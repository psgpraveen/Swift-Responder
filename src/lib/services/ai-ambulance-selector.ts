import type { Ambulance } from "../types";
import { AmbulanceStatus } from "../types";
import { haversineDistance } from "../utils";

/**
 * AI-powered ambulance selection service
 * Intelligently matches ambulances based on medical needs and equipment
 */

export interface AmbulanceSelectionCriteria {
  medicalNeeds: string;
  severity: "critical" | "urgent" | "moderate";
  requiredEquipment?: string[]; // e.g., ["ventilator", "defibrillator", "oxygen"]
  patientAge?: number;
  specialConditions?: string[]; // e.g., ["cardiac", "pediatric", "trauma"]
}

export interface ScoredAmbulance extends Ambulance {
  score: number;
  matchReason: string;
  equipmentMatch: number; // percentage
  distanceScore: number; // 0-10
  readinessScore: number; // 0-10
}

/**
 * Convert ambulance equipment object to string array
 */
function getEquipmentList(equipment?: {
  defibrillator: boolean;
  oxygen: boolean;
  ventilator: boolean;
  medications: string[];
}): string[] {
  if (!equipment) return [];

  const items: string[] = [];
  if (equipment.defibrillator) items.push("defibrillator");
  if (equipment.oxygen) items.push("oxygen");
  if (equipment.ventilator) items.push("ventilator");
  items.push(...equipment.medications);
  return items;
}

/**
 * Score and rank ambulances based on AI logic
 */
export function selectOptimalAmbulance(
  ambulances: Ambulance[],
  userLocation: { lat: number; lng: number },
  criteria: AmbulanceSelectionCriteria
): ScoredAmbulance[] {
  const scoredAmbulances = ambulances.map((ambulance) => {
    return scoreAmbulance(ambulance, userLocation, criteria);
  });

  // Sort by score (highest first)
  return scoredAmbulances.sort((a, b) => b.score - a.score);
}

/**
 * Score a single ambulance
 */
function scoreAmbulance(
  ambulance: Ambulance,
  userLocation: { lat: number; lng: number },
  criteria: AmbulanceSelectionCriteria
): ScoredAmbulance {
  let totalScore = 0;
  let matchReason = "";
  const reasons: string[] = [];

  // 1. Distance Score (0-30 points) - Closer is better
  const distance = haversineDistance(userLocation, ambulance.location);
  const distanceScore = calculateDistanceScore(distance);
  totalScore += distanceScore;
  reasons.push(
    `Distance: ${distance.toFixed(2)}km (${((distanceScore / 30) * 10).toFixed(
      1
    )}/10)`
  );

  // 2. Equipment Match Score (0-35 points) - Must-have equipment
  const equipmentList = getEquipmentList(ambulance.equipment);
  const equipmentScore = calculateEquipmentScore(
    equipmentList,
    criteria.requiredEquipment || [],
    criteria.medicalNeeds
  );
  totalScore += equipmentScore.score;
  reasons.push(
    `Equipment: ${equipmentScore.matchPercentage.toFixed(0)}% match (${(
      (equipmentScore.score / 35) *
      10
    ).toFixed(1)}/10)`
  );

  // 3. Specialty Match Score (0-20 points)
  const specialtyScore = calculateSpecialtyScore(ambulance, criteria);
  totalScore += specialtyScore.score;
  if (specialtyScore.reason) {
    reasons.push(specialtyScore.reason);
  }

  // 4. Readiness Score (0-15 points) - Driver rating, vehicle status
  const readinessScore = calculateReadinessScore(ambulance);
  totalScore += readinessScore;
  reasons.push(`Readiness: ${((readinessScore / 15) * 10).toFixed(1)}/10`);

  // 5. Severity Bonus - Critical cases prioritize proximity
  if (criteria.severity === "critical" && distance < 3) {
    totalScore += 10;
    reasons.push("⚡ Critical proximity bonus");
  }

  matchReason = reasons.join(" • ");

  return {
    ...ambulance,
    score: Math.round(totalScore),
    matchReason,
    equipmentMatch: equipmentScore.matchPercentage,
    distanceScore: (distanceScore / 30) * 10,
    readinessScore: (readinessScore / 15) * 10,
  };
}

/**
 * Calculate distance score (0-30 points)
 * < 2km = 30 points, 2-5km = 20 points, 5-10km = 10 points, >10km = 5 points
 */
function calculateDistanceScore(distanceKm: number): number {
  if (distanceKm < 2) return 30;
  if (distanceKm < 5) return 20;
  if (distanceKm < 10) return 10;
  return 5;
}

/**
 * Calculate equipment match score (0-35 points)
 */
function calculateEquipmentScore(
  ambulanceEquipment: string[],
  requiredEquipment: string[],
  medicalNeeds: string
): { score: number; matchPercentage: number } {
  if (requiredEquipment.length === 0) {
    // No specific requirements, check general capability
    return {
      score:
        ambulanceEquipment.length >= 5 ? 35 : ambulanceEquipment.length * 5,
      matchPercentage: 100,
    };
  }

  // Check how many required items are available
  const matchedCount = requiredEquipment.filter((req) =>
    ambulanceEquipment.some(
      (equip) =>
        equip.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(equip.toLowerCase())
    )
  ).length;

  const matchPercentage = (matchedCount / requiredEquipment.length) * 100;
  const score = Math.round((matchPercentage / 100) * 35);

  return { score, matchPercentage };
}

/**
 * Calculate specialty match score (0-20 points)
 */
function calculateSpecialtyScore(
  ambulance: Ambulance,
  criteria: AmbulanceSelectionCriteria
): { score: number; reason?: string } {
  const needsLower = criteria.medicalNeeds.toLowerCase();
  const equipment = getEquipmentList(ambulance.equipment);
  const equipmentLower = equipment.map((e) => e.toLowerCase());

  // Cardiac care
  if (
    needsLower.includes("cardiac") ||
    needsLower.includes("heart") ||
    needsLower.includes("chest pain")
  ) {
    const hasCardiacEquipment =
      equipmentLower.includes("defibrillator") ||
      equipmentLower.includes("ecg");
    return {
      score: hasCardiacEquipment ? 20 : 5,
      reason: hasCardiacEquipment
        ? "❤️ Cardiac equipment available"
        : "⚠️ Limited cardiac equipment",
    };
  }

  // Respiratory care
  if (
    needsLower.includes("breathing") ||
    needsLower.includes("respiratory") ||
    needsLower.includes("asthma")
  ) {
    const hasRespiratoryEquipment =
      equipment.includes("ventilator") || equipment.includes("oxygen");
    return {
      score: hasRespiratoryEquipment ? 20 : 5,
      reason: hasRespiratoryEquipment
        ? "🫁 Respiratory support available"
        : "⚠️ Limited respiratory equipment",
    };
  }

  // Trauma care
  if (
    needsLower.includes("trauma") ||
    needsLower.includes("injury") ||
    needsLower.includes("accident")
  ) {
    const hasTraumaEquipment =
      equipment.includes("stretcher") ||
      equipment.includes("splints") ||
      equipment.includes("bandages");
    return {
      score: hasTraumaEquipment ? 20 : 10,
      reason: hasTraumaEquipment ? "🚑 Trauma equipment ready" : undefined,
    };
  }

  // Pediatric care
  if (criteria.patientAge && criteria.patientAge < 12) {
    const hasPediatricEquipment = equipment.some(
      (e) => e.includes("pediatric") || e.includes("child")
    );
    return {
      score: hasPediatricEquipment ? 20 : 10,
      reason: hasPediatricEquipment
        ? "👶 Pediatric equipment available"
        : undefined,
    };
  }

  // General emergency
  return { score: 10 };
}

/**
 * Calculate readiness score (0-15 points)
 */
function calculateReadinessScore(ambulance: Ambulance): number {
  let score = 0;

  // Driver rating (0-10 points)
  if (ambulance.driver?.rating) {
    score += Math.min(ambulance.driver.rating * 2, 10);
  } else {
    score += 5; // Default average
  }

  // Vehicle status (0-5 points)
  if (ambulance.status === AmbulanceStatus.AVAILABLE) {
    score += 5;
  } else if (ambulance.status === AmbulanceStatus.EN_ROUTE) {
    score += 2;
  }

  return score;
}

/**
 * Get equipment recommendations for a medical condition
 */
export function getEquipmentRecommendations(medicalNeeds: string): {
  critical: string[];
  recommended: string[];
  optional: string[];
} {
  const needsLower = medicalNeeds.toLowerCase();

  // Cardiac emergencies
  if (needsLower.includes("cardiac") || needsLower.includes("heart")) {
    return {
      critical: ["Defibrillator", "ECG Monitor", "Oxygen"],
      recommended: ["IV Setup", "Cardiac Medications", "Ventilator"],
      optional: ["Blood Pressure Monitor", "Pulse Oximeter"],
    };
  }

  // Respiratory emergencies
  if (needsLower.includes("breathing") || needsLower.includes("respiratory")) {
    return {
      critical: ["Oxygen", "Ventilator", "Nebulizer"],
      recommended: ["Pulse Oximeter", "Suction Unit"],
      optional: ["Intubation Kit", "CPAP Machine"],
    };
  }

  // Trauma emergencies
  if (needsLower.includes("trauma") || needsLower.includes("accident")) {
    return {
      critical: ["Stretcher", "Immobilization Equipment", "Bandages"],
      recommended: ["Splints", "Cervical Collar", "IV Setup"],
      optional: ["Blood Pressure Monitor", "Oxygen"],
    };
  }

  // Stroke
  if (needsLower.includes("stroke") || needsLower.includes("neurological")) {
    return {
      critical: ["Blood Pressure Monitor", "Oxygen", "Glucose Monitor"],
      recommended: ["IV Setup", "Stroke Assessment Tools"],
      optional: ["Intubation Kit", "Ventilator"],
    };
  }

  // General emergency
  return {
    critical: ["Basic Life Support", "Oxygen", "Stretcher"],
    recommended: [
      "Defibrillator",
      "IV Setup",
      "Bandages",
      "Blood Pressure Monitor",
    ],
    optional: ["Ventilator", "ECG Monitor", "Suction Unit"],
  };
}

/**
 * Analyze if ambulance is suitable for the case
 */
export function analyzeAmbulanceSuitability(
  ambulance: Ambulance,
  criteria: AmbulanceSelectionCriteria
): {
  isSuitable: boolean;
  confidence: number; // 0-100
  warnings: string[];
  strengths: string[];
} {
  const warnings: string[] = [];
  const strengths: string[] = [];
  let confidence = 100;

  const recommendations = getEquipmentRecommendations(criteria.medicalNeeds);
  const ambulanceEquipment = getEquipmentList(ambulance.equipment).map((e) =>
    e.toLowerCase()
  );

  // Check critical equipment
  const missingCritical = recommendations.critical.filter(
    (item) => !ambulanceEquipment.some((e) => e.includes(item.toLowerCase()))
  );

  if (missingCritical.length > 0) {
    warnings.push(`Missing critical: ${missingCritical.join(", ")}`);
    confidence -= missingCritical.length * 20;
  } else {
    strengths.push("All critical equipment available");
  }

  // Check distance for severity
  const distance = 10; // Placeholder - should calculate actual distance
  if (criteria.severity === "critical" && distance > 5) {
    warnings.push("Distance may be too far for critical case");
    confidence -= 15;
  }

  // Check driver experience
  if (ambulance.driver?.rating && ambulance.driver.rating >= 4.5) {
    strengths.push("Highly rated driver");
  } else if (ambulance.driver?.rating && ambulance.driver.rating < 3.5) {
    warnings.push("Driver rating below average");
    confidence -= 10;
  }

  const isSuitable = confidence >= 60 && missingCritical.length === 0;

  return {
    isSuitable,
    confidence: Math.max(confidence, 0),
    warnings,
    strengths,
  };
}
