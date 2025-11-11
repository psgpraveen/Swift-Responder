"use server";

import { suggestBestHospitals } from "../../ai/flows/suggest-best-hospitals";

/**
 * AI-powered route optimization service
 * Uses Gemini to analyze multiple factors for optimal routing
 */

export interface RouteConditions {
  trafficLevel: "light" | "moderate" | "heavy" | "severe";
  weather: {
    condition: string;
    visibility: number; // km
    temperature: number;
  };
  timeOfDay: "morning-rush" | "midday" | "evening-rush" | "night";
  roadQuality?: "excellent" | "good" | "fair" | "poor";
}

export interface RouteOption {
  hospitalName: string;
  distance: number; // km
  estimatedTime: number; // minutes
  routeQuality: number; // 0-10 score
}

export interface OptimizedRoute {
  recommendedHospital: string;
  alternativeHospital: string;
  reasoning: string;
  riskFactors: string[];
  estimatedArrival: number; // minutes
  confidenceScore: number; // 0-100
}

/**
 * Get AI-optimized route recommendation
 */
export async function getAIRouteOptimization(
  routeOptions: RouteOption[],
  conditions: RouteConditions,
  medicalUrgency: "critical" | "urgent" | "moderate"
): Promise<OptimizedRoute> {
  const routeAnalysis = routeOptions
    .map(
      (route, idx) => `
Option ${idx + 1}: ${route.hospitalName}
- Distance: ${route.distance.toFixed(2)} km
- Estimated Time: ${route.estimatedTime} minutes
- Route Quality: ${route.routeQuality}/10
`
    )
    .join("\n");

  const context = `
You are an emergency dispatch AI optimizing ambulance routes.

Current Conditions:
- Traffic: ${conditions.trafficLevel.toUpperCase()}
- Weather: ${conditions.weather.condition} (Visibility: ${
    conditions.weather.visibility
  }km)
- Time: ${conditions.timeOfDay.replace("-", " ")}
- Medical Urgency: ${medicalUrgency.toUpperCase()}

Available Route Options:
${routeAnalysis}

Analyze and recommend:
1. Best hospital to dispatch to (consider distance, time, and conditions)
2. Alternative backup hospital
3. Key risk factors affecting the route
4. Adjusted ETA considering all factors
5. Confidence score (0-100) in this recommendation

Consider that in critical emergencies, speed matters most. In moderate cases, hospital quality matters more.
${
  conditions.trafficLevel === "severe" || conditions.trafficLevel === "heavy"
    ? "\nNOTE: Heavy traffic detected - consider alternative routes or closer hospitals."
    : ""
}
${
  conditions.weather.visibility < 2
    ? "\nWARNING: Poor visibility - safety is priority."
    : ""
}
`;

  try {
    // Use hospital suggestion API with custom context
    const result = await suggestBestHospitals({
      needs: context,
      location: "Route optimization analysis",
    });

    if (result.length > 0) {
      const primary = result[0];
      const backup = result[1] || result[0];

      // Extract risk factors from reasoning
      const riskFactors: string[] = [];
      if (
        conditions.trafficLevel === "heavy" ||
        conditions.trafficLevel === "severe"
      ) {
        riskFactors.push(
          `Heavy traffic - add ${
            conditions.trafficLevel === "severe" ? "10-15" : "5-10"
          } min delay`
        );
      }
      if (conditions.weather.visibility < 2) {
        riskFactors.push("Poor visibility - reduce speed by 30%");
      }
      if (conditions.timeOfDay.includes("rush")) {
        riskFactors.push("Rush hour - expect congestion");
      }

      // Find matching route option
      const matchingRoute = routeOptions.find((r) =>
        r.hospitalName.toLowerCase().includes(primary.name.toLowerCase())
      );

      return {
        recommendedHospital: primary.name,
        alternativeHospital: backup.name,
        reasoning: primary.reason,
        riskFactors,
        estimatedArrival: matchingRoute?.estimatedTime || 15,
        confidenceScore: Math.min(primary.suitabilityScore * 10, 100),
      };
    }

    // Fallback to simple logic
    const fastest = routeOptions.reduce((prev, curr) =>
      curr.estimatedTime < prev.estimatedTime ? curr : prev
    );

    return {
      recommendedHospital: fastest.hospitalName,
      alternativeHospital:
        routeOptions[1]?.hospitalName || fastest.hospitalName,
      reasoning: "Selected fastest route based on estimated travel time",
      riskFactors: [],
      estimatedArrival: fastest.estimatedTime,
      confidenceScore: 75,
    };
  } catch (error) {
    console.error("[AI Route Optimizer] Error:", error);

    // Fallback logic
    const fastest = routeOptions.reduce((prev, curr) =>
      curr.estimatedTime < prev.estimatedTime ? curr : prev
    );

    return {
      recommendedHospital: fastest.hospitalName,
      alternativeHospital:
        routeOptions[1]?.hospitalName || fastest.hospitalName,
      reasoning: "AI analysis unavailable - using fastest route",
      riskFactors: ["AI analysis failed - using default routing"],
      estimatedArrival: fastest.estimatedTime,
      confidenceScore: 60,
    };
  }
}

/**
 * Get real-time route adjustment recommendations
 */
export async function getRouteAdjustmentAdvice(
  currentRoute: {
    remainingDistance: number;
    remainingTime: number;
    currentSpeed: number; // km/h
  },
  conditions: RouteConditions
): Promise<{
  shouldReroute: boolean;
  reason: string;
  suggestedAction: string;
}> {
  // Simple heuristic-based adjustments (can be enhanced with AI later)
  if (conditions.trafficLevel === "severe" && currentRoute.currentSpeed < 20) {
    return {
      shouldReroute: true,
      reason: "Severe traffic congestion detected",
      suggestedAction: "Consider alternative route or nearby hospital",
    };
  }

  if (conditions.weather.visibility < 1 && currentRoute.remainingTime > 15) {
    return {
      shouldReroute: true,
      reason: "Dangerous visibility conditions",
      suggestedAction: "Reduce speed and consider closest safe hospital",
    };
  }

  if (currentRoute.currentSpeed < 15 && currentRoute.remainingTime > 20) {
    return {
      shouldReroute: true,
      reason: "Unusually slow progress",
      suggestedAction:
        "Check for accidents or road closures, consider rerouting",
    };
  }

  return {
    shouldReroute: false,
    reason: "Route conditions acceptable",
    suggestedAction: "Continue on current route",
  };
}

/**
 * Predict ETA with AI analysis of historical patterns
 */
export async function predictAIEnhancedETA(
  baseETA: number,
  conditions: RouteConditions,
  historicalData?: {
    averageDelayMinutes: number;
    successRate: number;
  }
): Promise<{
  predictedETA: number;
  confidence: number;
  adjustmentFactors: string[];
}> {
  let adjustedETA = baseETA;
  const factors: string[] = [];

  // Traffic adjustment
  const trafficMultipliers = {
    light: 1.0,
    moderate: 1.2,
    heavy: 1.5,
    severe: 2.0,
  };
  const trafficAdjustment = trafficMultipliers[conditions.trafficLevel];
  adjustedETA *= trafficAdjustment;
  if (trafficAdjustment > 1.0) {
    factors.push(
      `Traffic: +${((trafficAdjustment - 1) * 100).toFixed(0)}% delay`
    );
  }

  // Weather adjustment
  if (conditions.weather.visibility < 3) {
    const weatherMultiplier = 1.3;
    adjustedETA *= weatherMultiplier;
    factors.push("Poor visibility: +30% delay");
  }

  // Time of day adjustment
  if (conditions.timeOfDay.includes("rush")) {
    adjustedETA *= 1.15;
    factors.push("Rush hour: +15% delay");
  }

  // Historical data adjustment
  if (historicalData && historicalData.averageDelayMinutes > 0) {
    adjustedETA += historicalData.averageDelayMinutes;
    factors.push(
      `Historical pattern: +${historicalData.averageDelayMinutes} min`
    );
  }

  // Calculate confidence based on data quality
  let confidence = 85;
  if (conditions.trafficLevel === "severe") confidence -= 15;
  if (conditions.weather.visibility < 2) confidence -= 10;
  if (!historicalData) confidence -= 5;

  return {
    predictedETA: Math.round(adjustedETA),
    confidence: Math.max(confidence, 50),
    adjustmentFactors: factors,
  };
}
