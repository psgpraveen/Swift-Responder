"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Ambulance, Hospital, DispatchHistory } from "../lib/types";
import { generateAmbulancesNearLocation, mockHospital } from "../lib/mock-data";
import { haversineDistance } from "../lib/utils";
import { searchNearbyHospitals } from "../lib/services/google-places";
import { getRoute, getETAWithTraffic } from "../lib/services/google-directions";
import { saveDispatchHistory } from "../lib/services/indexeddb";
import {
  findHospitalsWithGemini,
  findHospitalsQuick,
  type EnhancedHospital,
} from "../lib/services/gemini-hospital-finder";
import {
  selectOptimalAmbulance,
  getEquipmentRecommendations,
  type AmbulanceSelectionCriteria,
} from "../lib/services/ai-ambulance-selector";
import {
  predictAIEnhancedETA,
  type RouteConditions,
} from "../lib/services/ai-route-optimizer";

const AVERAGE_SPEED_KM_PER_MIN = 0.8; // Approx 48 km/h (fallback)

// Add userLocation parameter to the hook
export function useAmbulanceTracker(
  userLocation: { lat: number; lng: number } | null
) {
  // Generate ambulances near user's actual location, or use fallback
  const initialAmbulances = useMemo(
    () =>
      generateAmbulancesNearLocation(
        userLocation || { lat: 34.0522, lng: -118.2437 }
      ),
    [userLocation]
  );

  const [status, setStatus] = useState<
    "IDLE" | "DISPATCHING" | "DISPATCHED" | "ARRIVED"
  >("IDLE");
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances);
  const [dispatchedAmbulance, setDispatchedAmbulance] =
    useState<Ambulance | null>(null);
  const [destinationHospital, setDestinationHospital] =
    useState<Hospital | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [route, setRoute] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [dispatchStartTime, setDispatchStartTime] = useState<number | null>(
    null
  );
  const [useGeminiSearch, setUseGeminiSearchState] = useState(true); // Toggle for AI-powered search
  const [medicalNeeds, setMedicalNeedsState] =
    useState<string>("emergency care"); // Can be set by user

  // Use refs to avoid stale closures in callbacks
  const useGeminiSearchRef = useRef(useGeminiSearch);
  const medicalNeedsRef = useRef(medicalNeeds);

  // Update refs when state changes
  useEffect(() => {
    useGeminiSearchRef.current = useGeminiSearch;
  }, [useGeminiSearch]);

  useEffect(() => {
    medicalNeedsRef.current = medicalNeeds;
  }, [medicalNeeds]);

  // Wrap setters in useCallback to prevent infinite loops
  const setUseGeminiSearch = useCallback((value: boolean) => {
    setUseGeminiSearchState(value);
  }, []);

  const setMedicalNeeds = useCallback((value: string) => {
    setMedicalNeedsState(value);
  }, []);

  // Regenerate ambulances when user location changes significantly
  useEffect(() => {
    if (!userLocation) return;

    const newAmbulances = generateAmbulancesNearLocation(userLocation);
    setAmbulances((prevAmbulances) => {
      // Keep the status of the dispatched ambulance
      if (dispatchedAmbulance) {
        const dispatchedIndex = prevAmbulances.findIndex(
          (amb) => amb.id === dispatchedAmbulance.id
        );
        if (dispatchedIndex !== -1) {
          newAmbulances[dispatchedIndex] = prevAmbulances[dispatchedIndex];
        }
      }
      return newAmbulances;
    });
  }, [userLocation, dispatchedAmbulance]);

  const findNearestAmbulance = useCallback(() => {
    if (!userLocation) return null;

    // Filter out already dispatched ambulances
    const availableAmbulances = ambulances.filter(
      (amb) => amb.id !== dispatchedAmbulance?.id
    );

    if (availableAmbulances.length === 0) return null;

    // Use AI-powered ambulance selection
    const criteria: AmbulanceSelectionCriteria = {
      medicalNeeds: medicalNeedsRef.current,
      severity: "urgent", // Can be made dynamic based on emergency type
      requiredEquipment: [], // Auto-determined by AI
    };

    const scoredAmbulances = selectOptimalAmbulance(
      availableAmbulances,
      userLocation,
      criteria
    );

    if (scoredAmbulances.length > 0) {
      const best = scoredAmbulances[0];
      console.log(`🤖 AI selected ambulance: ${best.id}`);
      console.log(`   Score: ${best.score}/100`);
      console.log(`   Reason: ${best.matchReason}`);
      return best;
    }

    // Fallback to simple nearest
    let nearestAmbulance: Ambulance | null = null;
    let minDistance = Infinity;

    availableAmbulances.forEach((ambulance) => {
      const distance = haversineDistance(userLocation, ambulance.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestAmbulance = ambulance;
      }
    });

    return nearestAmbulance;
  }, [ambulances, userLocation, dispatchedAmbulance]);

  const dispatchAmbulance = useCallback(async () => {
    if (!userLocation) {
      console.error("User location not available");
      return;
    }

    setStatus("DISPATCHING");
    setIsLoadingHospitals(true);
    setDispatchStartTime(Date.now());

    try {
      // Find nearest ambulance
      const nearest = findNearestAmbulance();
      if (!nearest) {
        setStatus("IDLE");
        setIsLoadingHospitals(false);
        console.error("No available ambulance found");
        return;
      }

      // Search for REAL nearby hospitals using current location
      let hospital: Hospital;
      try {
        if (useGeminiSearchRef.current) {
          console.log(
            "🤖 [Dispatch] Using Gemini AI-powered hospital search..."
          );
          const enhancedHospitals = await findHospitalsWithGemini({
            location: userLocation,
            radius: 15000, // 15km for better coverage
            medicalNeeds: medicalNeedsRef.current,
            severity: "urgent",
          });

          if (enhancedHospitals && enhancedHospitals.length > 0) {
            hospital = enhancedHospitals[0]; // Use top AI recommendation
            console.log(
              `✨ Gemini AI selected: ${
                hospital.name
              } (Score: ${hospital.suitabilityScore.toFixed(1)})`
            );
            console.log(`� Location: ${hospital.address}`);
            console.log(`📊 Distance: ${hospital.distance?.toFixed(2)} km`);
            console.log(`💡 Reasoning: ${hospital.reason}`);

            // Log hospital details
            if (hospital.phone) console.log(`📞 Phone: ${hospital.phone}`);
            if (hospital.specialties)
              console.log(`🏥 Specialties: ${hospital.specialties.join(", ")}`);
            console.log(
              `🛏️ Available Beds: ${hospital.availableBeds} | ICUs: ${hospital.availableICUs}`
            );
          } else {
            console.log(
              "⚠️ Gemini returned no results, falling back to quick search..."
            );
            const quickHospitals = await findHospitalsQuick(
              userLocation,
              15000
            );

            if (quickHospitals.length > 0) {
              hospital = quickHospitals[0];
              console.log(
                `✅ Quick search found: ${
                  hospital.name
                } (${hospital.distance?.toFixed(2)} km)`
              );
            } else {
              throw new Error("No hospitals found in the area");
            }
          }
        } else {
          console.log("🔍 [Dispatch] Using quick Google Places search...");
          const hospitals = await findHospitalsQuick(userLocation, 15000);

          if (hospitals && hospitals.length > 0) {
            hospital = hospitals[0];
            console.log(`✅ Found ${hospitals.length} hospitals near you:`);
            console.log(
              `   1. ${hospital.name} - ${hospital.distance?.toFixed(
                2
              )} km away`
            );
            console.log(`      📍 ${hospital.address}`);
            console.log(
              `      ⭐ Rating: ${hospital.rating || "N/A"} (${
                hospital.reviewCount || 0
              } reviews)`
            );
            console.log(
              `      🛏️ Beds: ${hospital.availableBeds} | ICUs: ${hospital.availableICUs}`
            );
            console.log(
              `      🏥 Open: ${
                hospital.isOpen ? "Yes ✅" : "Emergency Only 🟡"
              }`
            );

            // Show next few hospitals
            hospitals.slice(1, 4).forEach((h, idx) => {
              console.log(
                `   ${idx + 2}. ${h.name} - ${h.distance?.toFixed(2)} km`
              );
            });
          } else {
            throw new Error(
              "No hospitals found nearby - check location services"
            );
          }
        }
      } catch (error) {
        console.error("❌ Error searching hospitals:", error);
        console.log("🔄 Attempting fallback search with larger radius...");

        // Try one more time with a larger radius
        try {
          const fallbackHospitals = await searchNearbyHospitals(
            userLocation,
            25000
          );
          if (fallbackHospitals.length > 0) {
            hospital = fallbackHospitals[0];
            console.log(`✅ Fallback search successful: ${hospital.name}`);
          } else {
            throw new Error("No hospitals available");
          }
        } catch (fallbackError) {
          console.error("❌ Fallback search also failed:", fallbackError);
          // Use mock hospital as last resort
          hospital = mockHospital;
          console.warn("⚠️ Using mock hospital data - real search unavailable");
        }
      }

      setDispatchedAmbulance(nearest);
      setDestinationHospital(hospital);
      setIsLoadingHospitals(false);

      // Get REAL route with live traffic data from Google Directions API
      if (hospital.location) {
        console.log("🗺️ Calculating optimal route with real-time traffic...");
        try {
          const routeInfo = await getRoute(
            nearest.location,
            hospital.location,
            {
              departureTime: new Date(), // Current time for accurate traffic
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            }
          );

          console.log("✅ Route calculated successfully:");
          console.log(`   📏 Distance: ${routeInfo.distance.toFixed(2)} km`);
          console.log(
            `   ⏱️ Duration: ${Math.round(
              routeInfo.duration
            )} min (without traffic)`
          );
          console.log(
            `   🚦 Duration in Traffic: ${Math.round(
              routeInfo.durationInTraffic || routeInfo.duration
            )} min`
          );
          console.log(`   📍 ${routeInfo.path.length} waypoints in route`);

          setRoute(routeInfo.path);
          setDistance(routeInfo.distance);

          // Use AI-enhanced ETA prediction
          const baseETA = Math.round(
            routeInfo.durationInTraffic || routeInfo.duration
          );
          const currentHour = new Date().getHours();
          const conditions: RouteConditions = {
            trafficLevel:
              routeInfo.durationInTraffic &&
              routeInfo.durationInTraffic > routeInfo.duration * 1.3
                ? "heavy"
                : routeInfo.durationInTraffic &&
                  routeInfo.durationInTraffic > routeInfo.duration * 1.1
                ? "moderate"
                : "light",
            weather: {
              condition: "clear", // Can be integrated with weather API
              visibility: 10,
              temperature: 20,
            },
            timeOfDay:
              currentHour >= 7 && currentHour <= 9
                ? "morning-rush"
                : currentHour >= 17 && currentHour <= 19
                ? "evening-rush"
                : currentHour >= 22 || currentHour <= 6
                ? "night"
                : "midday",
          };

          try {
            const aiETA = await predictAIEnhancedETA(baseETA, conditions);
            setEta(aiETA.predictedETA);
            console.log(
              `🤖 AI-Enhanced ETA: ${aiETA.predictedETA} min (confidence: ${aiETA.confidence}%)`
            );
            if (aiETA.adjustmentFactors.length > 0) {
              console.log(
                `   Adjustments: ${aiETA.adjustmentFactors.join(", ")}`
              );
            }
          } catch (error) {
            console.log("Using base ETA without AI enhancement");
            setEta(baseETA);
          }

          // Log turn-by-turn directions if available
          if (routeInfo.steps && routeInfo.steps.length > 0) {
            console.log("🧭 Turn-by-turn navigation:");
            routeInfo.steps.slice(0, 3).forEach((step, idx) => {
              console.log(
                `   ${idx + 1}. ${step.instruction.replace(
                  /<[^>]*>/g,
                  ""
                )} (${step.distance.toFixed(1)} km)`
              );
            });
            if (routeInfo.steps.length > 3) {
              console.log(
                `   ... and ${routeInfo.steps.length - 3} more steps`
              );
            }
          }
        } catch (error) {
          console.error("⚠️ Error getting route from Directions API:", error);
          console.log("🔄 Using fallback straight-line route...");

          // Fallback to simple direct route
          setRoute([nearest.location, hospital.location]);
          const dist = haversineDistance(nearest.location, hospital.location);
          setDistance(dist);
          const estimatedEta = Math.round(dist / AVERAGE_SPEED_KM_PER_MIN);
          setEta(estimatedEta);

          console.log(
            `📏 Fallback route: ${dist.toFixed(2)} km, ~${estimatedEta} min`
          );
        }
      } else {
        console.warn(
          "⚠️ Hospital location not available, routing to user location"
        );
        // Fallback to user location
        setRoute([nearest.location, userLocation]);
        const dist = haversineDistance(nearest.location, userLocation);
        setDistance(dist);
        setEta(Math.round(dist / AVERAGE_SPEED_KM_PER_MIN));
      }

      setStatus("DISPATCHED");
    } catch (error) {
      console.error("Error during dispatch:", error);
      setStatus("IDLE");
      setIsLoadingHospitals(false);
    }
  }, [findNearestAmbulance, userLocation]);

  const reset = useCallback(async () => {
    // Save dispatch history if a dispatch was completed or arrived
    if (
      (status === "ARRIVED" || status === "DISPATCHED") &&
      dispatchedAmbulance &&
      destinationHospital &&
      dispatchStartTime
    ) {
      const duration = Math.round((Date.now() - dispatchStartTime) / 60000); // minutes
      const history: DispatchHistory = {
        id: `DISPATCH-${Date.now()}`,
        timestamp: dispatchStartTime,
        ambulance: dispatchedAmbulance,
        hospital: destinationHospital,
        duration,
        outcome: status === "ARRIVED" ? "completed" : "cancelled",
      };

      try {
        await saveDispatchHistory(history);
        console.log("Dispatch history saved:", history.id);
      } catch (error) {
        console.error("Failed to save dispatch history:", error);
      }
    }

    setStatus("IDLE");
    setDispatchedAmbulance(null);
    setAmbulances(initialAmbulances);
    setDestinationHospital(null);
    setEta(null);
    setDistance(null);
    setRoute(null);
    setDispatchStartTime(null);
  }, [
    status,
    dispatchedAmbulance,
    destinationHospital,
    dispatchStartTime,
    initialAmbulances,
  ]);

  // Enhanced real-time tracking with live route updates
  useEffect(() => {
    if (
      status !== "DISPATCHED" ||
      !dispatchedAmbulance ||
      !destinationHospital?.location
    )
      return;

    const destination = destinationHospital.location;
    let routeRefreshCounter = 0;
    const ROUTE_REFRESH_INTERVAL = 30; // Refresh route every 30 seconds for traffic updates

    const intervalId = setInterval(async () => {
      setAmbulances((prevAmbulances) =>
        prevAmbulances.map((amb) => {
          if (amb.id === dispatchedAmbulance.id) {
            const currentDistance = haversineDistance(
              amb.location,
              destination
            );
            setDistance(currentDistance);

            if (currentDistance < 0.1) {
              // Arrival threshold: 100 meters
              console.log("🏥 Ambulance arrived at hospital!");
              setStatus("ARRIVED");
              setRoute(null);
              setDistance(0);
              setEta(0);
              return { ...amb, location: destination };
            }

            // Simulate realistic movement along the route
            const latDiff = destination.lat - amb.location.lat;
            const lngDiff = destination.lng - amb.location.lng;
            // Move a fraction of the distance per second (average ambulance speed)
            const totalSteps =
              currentDistance / (AVERAGE_SPEED_KM_PER_MIN / 60);

            const newLat = amb.location.lat + latDiff / totalSteps;
            const newLng = amb.location.lng + lngDiff / totalSteps;

            const newLocation = { lat: newLat, lng: newLng };

            // Update ETA based on current position
            const remainingDistance = haversineDistance(
              newLocation,
              destination
            );
            const newEta = Math.max(
              0,
              Math.round(remainingDistance / AVERAGE_SPEED_KM_PER_MIN)
            );
            setEta(newEta);

            // Refresh route periodically to account for traffic changes
            routeRefreshCounter++;
            if (routeRefreshCounter >= ROUTE_REFRESH_INTERVAL) {
              routeRefreshCounter = 0;
              console.log("🔄 Refreshing route for live traffic updates...");

              // Get updated route with current traffic
              getRoute(newLocation, destination, {
                departureTime: new Date(),
                trafficModel: google.maps.TrafficModel.BEST_GUESS,
              })
                .then((routeInfo) => {
                  console.log(
                    `✅ Route updated: ${routeInfo.distance.toFixed(
                      2
                    )} km, ETA: ${Math.round(
                      routeInfo.durationInTraffic || routeInfo.duration
                    )} min`
                  );
                  setRoute(routeInfo.path);
                  setDistance(routeInfo.distance);
                  setEta(
                    Math.round(
                      routeInfo.durationInTraffic || routeInfo.duration
                    )
                  );
                })
                .catch((error) => {
                  console.warn(
                    "Failed to refresh route, using current path:",
                    error
                  );
                });
            } else {
              // Update route with new ambulance position
              setRoute([newLocation, destination]);
            }

            return { ...amb, location: newLocation };
          }
          return amb;
        })
      );
    }, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, [status, dispatchedAmbulance, destinationHospital]);

  return {
    status,
    ambulances,
    userLocation,
    dispatchedAmbulance,
    destinationHospital,
    eta,
    distance,
    dispatchAmbulance,
    reset,
    route,
    isLoadingHospitals,
    useGeminiSearch,
    setUseGeminiSearch,
    medicalNeeds,
    setMedicalNeeds,
  };
}
