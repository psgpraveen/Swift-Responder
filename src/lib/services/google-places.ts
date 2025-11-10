"use client";

import type { Hospital } from "../types";

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  types: string[];
}

/**
 * Search for nearby hospitals using Google Places API
 * Now uses the CURRENT user location to find real hospitals nearby
 */
export async function searchNearbyHospitals(
  location: { lat: number; lng: number },
  radius: number = 10000 // 10km default (increased for better coverage)
): Promise<Hospital[]> {
  try {
    console.log(
      `🏥 Searching for hospitals near: ${location.lat}, ${location.lng} (radius: ${radius}m)`
    );

    // Using the browser's Google Maps API (already loaded from map component)
    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );

    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius,
      type: "hospital",
      keyword: "emergency hospital medical center clinic",
      rankBy: google.maps.places.RankBy.PROMINENCE, // Prioritize important hospitals
    };

    return new Promise((resolve, reject) => {
      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`✅ Found ${results.length} hospitals`);

          const hospitals = results
            .filter((place) => place.geometry?.location && place.name)
            .map((place, index) =>
              convertPlaceToHospital(place, location, index)
            )
            .sort((a, b) => {
              // Sort by: 1) Open status, 2) Suitability score, 3) Distance
              if (a.isOpen !== b.isOpen) {
                return a.isOpen ? -1 : 1;
              }
              if (Math.abs(a.suitabilityScore - b.suitabilityScore) > 0.5) {
                return b.suitabilityScore - a.suitabilityScore;
              }
              return (a.distance || 0) - (b.distance || 0);
            });

          console.log(
            `📍 Nearest hospital: ${
              hospitals[0]?.name
            } (${hospitals[0]?.distance?.toFixed(2)}km)`
          );
          resolve(hospitals);
        } else {
          console.error("Places search failed:", status);
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error("Error searching hospitals:", error);
    throw error;
  }
}

/**
 * Get detailed information about a specific hospital
 */
export async function getHospitalDetails(
  placeId: string
): Promise<Partial<Hospital>> {
  try {
    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
      fields: [
        "name",
        "formatted_address",
        "formatted_phone_number",
        "geometry",
        "rating",
        "user_ratings_total",
        "opening_hours",
        "website",
        "types",
        "reviews",
      ],
    };

    return new Promise((resolve, reject) => {
      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            name: place.name || "Unknown Hospital",
            address: place.formatted_address || "Address unavailable",
            phone: place.formatted_phone_number,
            location: place.geometry?.location
              ? {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                }
              : undefined,
          });
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error("Error getting hospital details:", error);
    throw error;
  }
}

/**
 * Convert Google Places result to Hospital type with realistic dummy data
 * Uses current location to calculate accurate distances and estimates
 */
function convertPlaceToHospital(
  place: google.maps.places.PlaceResult,
  userLocation: { lat: number; lng: number },
  index: number
): Hospital {
  const location = place.geometry?.location
    ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      }
    : userLocation;

  // Calculate distance from user's CURRENT location
  const distance = calculateDistance(userLocation, location);

  // Extract real data from Google Places
  const rating = place.rating || 0;
  const reviewCount = place.user_ratings_total || 0;
  const isOpen = place.opening_hours?.open_now ?? true;
  const businessStatus = place.business_status || "OPERATIONAL";

  // Generate realistic dummy data based on hospital characteristics
  const hospitalSize = inferHospitalSize(rating, reviewCount, place.name || "");
  const hospitalCapacity = generateCapacityData(hospitalSize, distance, isOpen);
  const suitabilityScore = calculateSuitabilityScore(
    rating,
    distance,
    isOpen,
    hospitalCapacity
  );

  return {
    id: place.place_id || `hospital-${index}`,
    name: place.name || "Medical Center",
    address: place.vicinity || place.formatted_address || "Address unavailable",
    location,
    distance,

    // Capacity data (dummy but realistic based on hospital characteristics)
    availableBeds: hospitalCapacity.beds,
    availableICUs: hospitalCapacity.icus,
    availableNICUs: hospitalCapacity.nicus,
    availableOxygenCylinders: hospitalCapacity.oxygen,
    availableVentilators: hospitalCapacity.ventilators,
    availableDoctors: hospitalCapacity.doctors,

    // Calculated scores
    suitabilityScore,
    reason: generateSuitabilityReason(
      rating,
      reviewCount,
      distance,
      isOpen,
      hospitalCapacity
    ),

    // Contact & metadata
    phone: place.formatted_phone_number,
    specialties: inferSpecialties(
      place.types || [],
      hospitalSize,
      place.name || ""
    ),
    waitTime: calculateWaitTime(distance, hospitalCapacity.beds, isOpen),
    rating: place.rating,
    reviewCount: place.user_ratings_total,
    isOpen: isOpen && businessStatus === "OPERATIONAL",
  };
}

/**
 * Infer hospital size from available data
 */
function inferHospitalSize(
  rating: number,
  reviewCount: number,
  name: string
): "small" | "medium" | "large" {
  const nameLower = name.toLowerCase();

  // Large hospitals - university/medical centers with many reviews
  if (
    reviewCount > 1000 ||
    nameLower.includes("medical center") ||
    nameLower.includes("university") ||
    nameLower.includes("regional") ||
    nameLower.includes("general hospital")
  ) {
    return "large";
  }

  // Small hospitals/clinics - fewer reviews, clinic in name
  if (
    reviewCount < 200 ||
    nameLower.includes("clinic") ||
    nameLower.includes("urgent care")
  ) {
    return "small";
  }

  // Medium hospitals - everything else
  return "medium";
}

/**
 * Generate realistic capacity data based on hospital size and current conditions
 */
function generateCapacityData(
  size: "small" | "medium" | "large",
  distance: number,
  isOpen: boolean
): {
  beds: number;
  icus: number;
  nicus: number;
  oxygen: number;
  ventilators: number;
  doctors: number;
} {
  // Base capacity by hospital size
  const baseCapacity = {
    small: {
      beds: [3, 8],
      icus: [1, 3],
      nicus: [0, 1],
      oxygen: [5, 10],
      ventilators: [2, 5],
      doctors: [2, 5],
    },
    medium: {
      beds: [8, 20],
      icus: [3, 8],
      nicus: [1, 3],
      oxygen: [10, 25],
      ventilators: [5, 12],
      doctors: [5, 12],
    },
    large: {
      beds: [15, 35],
      icus: [8, 15],
      nicus: [3, 8],
      oxygen: [20, 50],
      ventilators: [10, 20],
      doctors: [10, 25],
    },
  };

  const capacity = baseCapacity[size];

  // Generate random values within range
  let beds = randomInRange(capacity.beds[0], capacity.beds[1]);
  let icus = randomInRange(capacity.icus[0], capacity.icus[1]);
  let nicus = randomInRange(capacity.nicus[0], capacity.nicus[1]);
  let oxygen = randomInRange(capacity.oxygen[0], capacity.oxygen[1]);
  let ventilators = randomInRange(
    capacity.ventilators[0],
    capacity.ventilators[1]
  );
  let doctors = randomInRange(capacity.doctors[0], capacity.doctors[1]);

  // Reduce availability for closed hospitals (night shift has less staff)
  if (!isOpen) {
    beds = Math.floor(beds * 0.6);
    icus = Math.floor(icus * 0.7);
    doctors = Math.floor(doctors * 0.4);
  }

  // Slightly reduce availability for distant hospitals (simulate busy conditions)
  if (distance > 5) {
    beds = Math.max(1, Math.floor(beds * 0.8));
    icus = Math.max(1, Math.floor(icus * 0.8));
  }

  return { beds, icus, nicus, oxygen, ventilators, doctors };
}

/**
 * Calculate overall suitability score (1-10)
 */
function calculateSuitabilityScore(
  rating: number,
  distance: number,
  isOpen: boolean,
  capacity: { beds: number; icus: number; doctors: number }
): number {
  let score = 5; // Base score

  // Rating contribution (0-3 points)
  if (rating >= 4.5) score += 3;
  else if (rating >= 4.0) score += 2.5;
  else if (rating >= 3.5) score += 2;
  else if (rating >= 3.0) score += 1;

  // Distance contribution (0-2 points) - closer is better
  if (distance < 1) score += 2;
  else if (distance < 3) score += 1.5;
  else if (distance < 5) score += 1;
  else if (distance < 10) score += 0.5;

  // Open status (0-2 points)
  if (isOpen) score += 2;
  else score += 0.5; // Still available for emergencies

  // Capacity contribution (0-3 points)
  const totalCapacity = capacity.beds + capacity.icus + capacity.doctors;
  if (totalCapacity > 30) score += 3;
  else if (totalCapacity > 20) score += 2;
  else if (totalCapacity > 10) score += 1;

  return Math.min(10, Math.max(1, score)); // Clamp between 1-10
}

/**
 * Calculate estimated wait time based on distance and hospital load
 */
function calculateWaitTime(
  distance: number,
  availableBeds: number,
  isOpen: boolean
): number {
  // Base travel time (assuming 48 km/h average speed)
  let waitTime = Math.floor((distance / 48) * 60); // Convert to minutes

  // Add processing time based on availability
  if (availableBeds > 15) {
    waitTime += randomInRange(5, 10); // Low wait
  } else if (availableBeds > 8) {
    waitTime += randomInRange(10, 20); // Medium wait
  } else {
    waitTime += randomInRange(15, 30); // High wait
  }

  // Closed hospitals might have longer processing
  if (!isOpen) {
    waitTime += randomInRange(5, 15);
  }

  return waitTime;
}

/**
 * Helper function to generate random integer in range
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLon = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.lat * Math.PI) / 180) *
      Math.cos((coords2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate suitability reason based on hospital data and CURRENT conditions
 */
function generateSuitabilityReason(
  rating: number,
  reviewCount: number,
  distance: number,
  isOpen: boolean,
  capacity: { beds: number; icus: number; doctors: number }
): string {
  const reasons: string[] = [];

  // Distance-based reasons
  if (distance < 1) {
    reasons.push("🚑 Extremely close - under 1 km");
  } else if (distance < 2) {
    reasons.push("📍 Very close proximity");
  } else if (distance < 5) {
    reasons.push("📍 Good location within 5 km");
  } else {
    reasons.push(`📍 ${distance.toFixed(1)} km away`);
  }

  // Rating-based reasons
  if (rating >= 4.5) {
    reasons.push("⭐ Excellent patient reviews (4.5+)");
  } else if (rating >= 4.0) {
    reasons.push("⭐ Highly rated (4.0+)");
  } else if (rating >= 3.5) {
    reasons.push("⭐ Good ratings (3.5+)");
  }

  // Review count (trust factor)
  if (reviewCount > 1000) {
    reasons.push("🏥 Well-established facility");
  } else if (reviewCount > 500) {
    reasons.push("🏥 Trusted by community");
  }

  // Availability reasons
  if (capacity.beds > 15) {
    reasons.push(`✅ High bed availability (${capacity.beds} beds)`);
  } else if (capacity.beds > 8) {
    reasons.push(`✅ Adequate capacity (${capacity.beds} beds)`);
  } else {
    reasons.push(`⚠️ Limited beds (${capacity.beds} available)`);
  }

  if (capacity.icus >= 5) {
    reasons.push(`🏥 Well-equipped ICU (${capacity.icus} units)`);
  }

  // Staffing
  if (capacity.doctors >= 10) {
    reasons.push(`👨‍⚕️ Well-staffed (${capacity.doctors} doctors)`);
  }

  // Open status
  if (isOpen) {
    reasons.push("🟢 Currently open");
  } else {
    reasons.push("🟡 24/7 emergency services available");
  }

  return reasons.join(" • ");
}

/**
 * Infer hospital specialties from Google Place types and name
 * More realistic specialty assignment based on hospital characteristics
 */
function inferSpecialties(
  types: string[],
  size: "small" | "medium" | "large",
  name: string
): string[] {
  const specialties: string[] = [];
  const nameLower = name.toLowerCase();

  // All emergency facilities have emergency medicine
  specialties.push("Emergency Medicine");

  // Check for specific specialties mentioned in name
  if (nameLower.includes("children") || nameLower.includes("pediatric")) {
    specialties.push("Pediatrics", "Neonatology");
  }

  if (nameLower.includes("cardiac") || nameLower.includes("heart")) {
    specialties.push("Cardiology", "Cardiac Surgery");
  }

  if (nameLower.includes("cancer") || nameLower.includes("oncology")) {
    specialties.push("Oncology", "Radiation Therapy");
  }

  if (nameLower.includes("women") || nameLower.includes("maternity")) {
    specialties.push("Obstetrics", "Gynecology");
  }

  if (nameLower.includes("trauma") || nameLower.includes("regional")) {
    specialties.push("Trauma Surgery", "Emergency Care");
  }

  // Add specialties based on hospital size
  if (size === "large") {
    // Large hospitals have comprehensive services
    const largeHospitalSpecialties = [
      "General Medicine",
      "Surgery",
      "Cardiology",
      "Neurology",
      "Orthopedics",
      "Trauma Care",
      "Intensive Care",
      "Radiology",
      "Anesthesiology",
    ];
    // Add 6-8 specialties for large hospitals
    const count = randomInRange(6, 8);
    for (let i = 0; i < count; i++) {
      const specialty =
        largeHospitalSpecialties[i % largeHospitalSpecialties.length];
      if (!specialties.includes(specialty)) {
        specialties.push(specialty);
      }
    }
  } else if (size === "medium") {
    // Medium hospitals have core services
    const mediumHospitalSpecialties = [
      "General Medicine",
      "Surgery",
      "Cardiology",
      "Orthopedics",
      "Radiology",
    ];
    // Add 3-5 specialties
    const count = randomInRange(3, 5);
    for (let i = 0; i < count; i++) {
      const specialty =
        mediumHospitalSpecialties[i % mediumHospitalSpecialties.length];
      if (!specialties.includes(specialty)) {
        specialties.push(specialty);
      }
    }
  } else {
    // Small hospitals/clinics have basic services
    const smallHospitalSpecialties = [
      "Primary Care",
      "General Medicine",
      "Minor Surgery",
    ];
    // Add 2-3 specialties
    const count = randomInRange(2, 3);
    for (let i = 0; i < count; i++) {
      const specialty =
        smallHospitalSpecialties[i % smallHospitalSpecialties.length];
      if (!specialties.includes(specialty)) {
        specialties.push(specialty);
      }
    }
  }

  // If we still have only emergency medicine, add general medicine
  if (specialties.length === 1) {
    specialties.push("General Medicine", "Primary Care");
  }

  return [...new Set(specialties)]; // Remove duplicates
}
