"use server";

import { searchNearbyHospitals } from "./google-places";
import { suggestBestHospitals } from "../../ai/flows/suggest-best-hospitals";
import type { Hospital } from "../types";

/**
 * Enhanced hospital finder that combines Google Places API with Gemini AI analysis
 *
 * Flow:
 * 1. Search for real hospitals near user using Google Places API
 * 2. Send hospital data to Gemini AI for intelligent analysis and ranking
 * 3. Gemini considers medical needs, distance, ratings, and availability
 * 4. Return AI-ranked hospitals with detailed recommendations
 */

export interface GeminiHospitalSearchParams {
  location: { lat: number; lng: number };
  radius?: number; // in meters, default 10000 (10km)
  medicalNeeds: string; // e.g., "cardiac emergency", "pediatric care", "trauma"
  patientAge?: number;
  severity?: "critical" | "urgent" | "moderate";
}

export interface EnhancedHospital extends Hospital {
  aiReasoning?: string; // Gemini's explanation for this recommendation
  aiScore?: number; // AI-calculated suitability score
}

/**
 * Find nearby hospitals using Google Places, then rank them with Gemini AI
 */
export async function findHospitalsWithGemini(
  params: GeminiHospitalSearchParams
): Promise<EnhancedHospital[]> {
  const {
    location,
    radius = 10000,
    medicalNeeds,
    patientAge,
    severity = "urgent",
  } = params;

  try {
    // Step 1: Get real hospitals from Google Places API
    console.log(
      `[Gemini Hospital Finder] Searching for hospitals within ${radius}m of (${location.lat}, ${location.lng})`
    );

    const realHospitals = await searchNearbyHospitals(location, radius);

    if (!realHospitals || realHospitals.length === 0) {
      console.log("[Gemini Hospital Finder] No hospitals found nearby");
      return [];
    }

    console.log(
      `[Gemini Hospital Finder] Found ${realHospitals.length} hospitals via Google Places`
    );

    // Step 2: Prepare hospital data for Gemini AI analysis
    const hospitalList = realHospitals
      .map((hospital, index) => {
        return `${index + 1}. ${hospital.name}
   - Address: ${hospital.address}
   - Distance: ${hospital.distance?.toFixed(2)} km away
   - Rating: ${hospital.rating || "N/A"}/5 (${
          hospital.reviewCount || 0
        } reviews)
   - Phone: ${hospital.phone || "Not available"}
   - Specialties: ${hospital.specialties?.join(", ") || "General"}
   - Wait Time: ~${hospital.waitTime || "Unknown"} minutes
   - Available Beds: ${hospital.availableBeds || "Unknown"}
   - Available ICUs: ${hospital.availableICUs || "Unknown"}`;
      })
      .join("\n\n");

    // Step 3: Create detailed context for Gemini
    const locationDescription = `Latitude ${location.lat.toFixed(
      4
    )}, Longitude ${location.lng.toFixed(4)}`;

    const contextualNeeds = `
Medical Situation:
- Primary Need: ${medicalNeeds}
- Severity Level: ${severity.toUpperCase()}
${patientAge ? `- Patient Age: ${patientAge} years` : ""}

Available Hospitals in Area:
${hospitalList}

Please analyze these REAL hospitals and rank them based on:
1. Distance from patient location
2. Google ratings and reviews (indicates quality)
3. Specialties matching the medical need
4. Estimated wait times
5. Severity of the emergency (${severity})

Provide realistic availability estimates since exact bed counts aren't available from Google Places API.
`;

    console.log(
      "[Gemini Hospital Finder] Sending data to Gemini AI for analysis..."
    );

    // Step 4: Get AI-powered recommendations from Gemini
    const aiRecommendations = await suggestBestHospitals({
      needs: contextualNeeds,
      location: locationDescription,
    });

    console.log(
      `[Gemini Hospital Finder] Gemini returned ${aiRecommendations.length} recommendations`
    );

    // Step 5: Merge AI insights with real hospital data
    const enhancedHospitals: EnhancedHospital[] = aiRecommendations.map(
      (aiHospital) => {
        // Find matching real hospital by name
        const matchingHospital = realHospitals.find(
          (real) =>
            real.name.toLowerCase().includes(aiHospital.name.toLowerCase()) ||
            aiHospital.name.toLowerCase().includes(real.name.toLowerCase())
        );

        if (matchingHospital) {
          // Merge real data with AI analysis
          return {
            ...matchingHospital,
            // Override with AI estimates for capacity data
            availableBeds: aiHospital.availableBeds,
            availableICUs: aiHospital.availableICUs,
            availableNICUs: aiHospital.availableNICUs,
            availableOxygenCylinders: aiHospital.availableOxygenCylinders,
            availableVentilators: aiHospital.availableVentilators,
            availableDoctors: aiHospital.availableDoctors,
            suitabilityScore: aiHospital.suitabilityScore,
            reason: aiHospital.reason,
            aiReasoning: aiHospital.reason,
            aiScore: aiHospital.suitabilityScore,
          };
        }

        // If no exact match, create new entry from AI data
        return {
          name: aiHospital.name,
          address: aiHospital.address,
          location: location, // Use search location as fallback
          availableBeds: aiHospital.availableBeds,
          availableICUs: aiHospital.availableICUs,
          availableNICUs: aiHospital.availableNICUs,
          availableOxygenCylinders: aiHospital.availableOxygenCylinders,
          availableVentilators: aiHospital.availableVentilators,
          availableDoctors: aiHospital.availableDoctors,
          suitabilityScore: aiHospital.suitabilityScore,
          reason: aiHospital.reason,
          phone: "Call directory assistance",
          specialties: [],
          waitTime: 15,
          distance: 5.0,
          aiReasoning: aiHospital.reason,
          aiScore: aiHospital.suitabilityScore,
        };
      }
    );

    console.log(
      `[Gemini Hospital Finder] Successfully enhanced ${enhancedHospitals.length} hospitals with AI analysis`
    );

    return enhancedHospitals;
  } catch (error) {
    console.error("[Gemini Hospital Finder] Error:", error);
    throw new Error(
      `Failed to find hospitals with Gemini: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Quick search for emergency situations - uses just Google Places without AI delay
 */
export async function findHospitalsQuick(
  location: { lat: number; lng: number },
  radius: number = 10000
): Promise<Hospital[]> {
  console.log(`[Quick Hospital Finder] Emergency search within ${radius}m`);
  return searchNearbyHospitals(location, radius);
}

/**
 * Get AI analysis for a specific hospital
 */
export async function getHospitalAIAnalysis(
  hospital: Hospital,
  medicalNeeds: string,
  userLocation: { lat: number; lng: number }
): Promise<{
  suitabilityScore: number;
  reasoning: string;
  estimatedCapacity: {
    beds: number;
    icus: number;
    doctors: number;
  };
}> {
  const locationDesc = `${
    hospital.distance?.toFixed(2) || "Unknown"
  } km from patient`;

  const context = `
Analyze this specific hospital for a patient with: ${medicalNeeds}

Hospital Details:
- Name: ${hospital.name}
- Address: ${hospital.address}
- Distance: ${locationDesc}
- Rating: ${hospital.rating || "N/A"}/5
- Specialties: ${hospital.specialties?.join(", ") || "General"}
- Current Wait Time: ${hospital.waitTime || "Unknown"} minutes

Provide:
1. Suitability score (0-10)
2. Detailed reasoning for this score
3. Estimated current capacity (beds, ICUs, doctors available)
`;

  try {
    const result = await suggestBestHospitals({
      needs: context,
      location: `Latitude ${userLocation.lat}, Longitude ${userLocation.lng}`,
    });

    if (result.length > 0) {
      const analysis = result[0];
      return {
        suitabilityScore: analysis.suitabilityScore,
        reasoning: analysis.reason,
        estimatedCapacity: {
          beds: analysis.availableBeds,
          icus: analysis.availableICUs,
          doctors: analysis.availableDoctors,
        },
      };
    }

    throw new Error("No analysis returned from Gemini");
  } catch (error) {
    console.error("[Hospital AI Analysis] Error:", error);
    return {
      suitabilityScore: 7.0,
      reasoning: "Analysis unavailable - using default assessment",
      estimatedCapacity: {
        beds: 10,
        icus: 3,
        doctors: 5,
      },
    };
  }
}
