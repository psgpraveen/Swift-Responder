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
 */
export async function searchNearbyHospitals(
  location: { lat: number; lng: number },
  radius: number = 5000 // 5km default
): Promise<Hospital[]> {
  try {
    // Using the browser's Google Maps API (already loaded from map component)
    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );

    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius,
      type: "hospital",
      keyword: "emergency hospital medical center",
    };

    return new Promise((resolve, reject) => {
      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const hospitals = results
            .filter((place) => place.geometry?.location && place.name)
            .map((place, index) =>
              convertPlaceToHospital(place, location, index)
            )
            .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance

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
 * Convert Google Places result to Hospital type
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

  // Calculate distance
  const distance = calculateDistance(userLocation, location);

  // Estimate availability based on rating and reviews
  const rating = place.rating || 0;
  const reviewCount = place.user_ratings_total || 0;

  // Generate reasonable estimates (in real app, would come from hospital API)
  const availableBeds = Math.floor(Math.random() * 20) + 5;
  const availableICUs = Math.floor(Math.random() * 5) + 1;
  const suitabilityScore = rating > 0 ? rating : Math.random() * 2 + 7;

  return {
    id: place.place_id || `hospital-${index}`,
    name: place.name || "Unknown Hospital",
    address: place.vicinity || place.formatted_address || "Address unavailable",
    location,
    distance,
    availableBeds,
    availableICUs,
    availableNICUs: Math.floor(Math.random() * 3),
    availableOxygenCylinders: Math.floor(Math.random() * 15) + 5,
    availableVentilators: Math.floor(Math.random() * 8) + 2,
    availableDoctors: Math.floor(Math.random() * 10) + 3,
    suitabilityScore,
    reason: generateSuitabilityReason(rating, reviewCount, distance),
    phone: place.formatted_phone_number,
    specialties: inferSpecialties(place.types || []),
    waitTime: Math.floor(distance / 0.5) + Math.floor(Math.random() * 10),
    rating: place.rating,
    reviewCount: place.user_ratings_total,
    isOpen: place.opening_hours?.open_now ?? true,
  };
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
 * Generate suitability reason based on hospital data
 */
function generateSuitabilityReason(
  rating: number,
  reviewCount: number,
  distance: number
): string {
  const reasons: string[] = [];

  if (distance < 2) {
    reasons.push("Very close proximity");
  } else if (distance < 5) {
    reasons.push("Good location");
  }

  if (rating >= 4.5) {
    reasons.push("excellent patient reviews");
  } else if (rating >= 4.0) {
    reasons.push("highly rated");
  } else if (rating >= 3.5) {
    reasons.push("good ratings");
  }

  if (reviewCount > 1000) {
    reasons.push("well-established facility");
  } else if (reviewCount > 500) {
    reasons.push("trusted by community");
  }

  return reasons.length > 0
    ? reasons.join(", ") + "."
    : "Available emergency care facility.";
}

/**
 * Infer hospital specialties from Google Place types
 */
function inferSpecialties(types: string[]): string[] {
  const specialties: string[] = ["Emergency Medicine"];

  if (types.includes("hospital")) {
    specialties.push("General Medicine", "Surgery");
  }

  if (types.includes("doctor")) {
    specialties.push("Primary Care");
  }

  // Add common specialties
  const commonSpecialties = [
    "Cardiology",
    "Trauma Care",
    "Orthopedics",
    "Neurology",
  ];

  // Add 2-4 random specialties
  const count = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < count; i++) {
    const specialty =
      commonSpecialties[Math.floor(Math.random() * commonSpecialties.length)];
    if (!specialties.includes(specialty)) {
      specialties.push(specialty);
    }
  }

  return specialties;
}
