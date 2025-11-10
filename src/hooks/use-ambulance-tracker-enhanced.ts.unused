"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Ambulance,
  Hospital,
  EmergencyRequest,
  DispatchHistory,
} from "../lib/types";
import {
  AmbulanceStatus,
  EmergencySeverity,
  EmergencyType,
} from "../lib/types";
import {
  initialAmbulances,
  userLocation as initialUserLocation,
  mockHospitals,
} from "../lib/mock-data";
import { haversineDistance } from "../lib/utils";

const AVERAGE_SPEED_KM_PER_MIN = 0.8; // Approx 48 km/h

// Priority scoring for ambulance selection (lower is better)
function calculatePriorityScore(
  ambulance: Ambulance,
  request: EmergencyRequest,
  distance: number
): number {
  let score = distance * 10; // Base score on distance

  // Severity weighting
  const severityWeight = {
    [EmergencySeverity.CRITICAL]: 0.5,
    [EmergencySeverity.URGENT]: 1.0,
    [EmergencySeverity.NON_URGENT]: 1.5,
  };
  score *= severityWeight[request.severity];

  // Type matching bonus
  const typeBonus: Record<string, number> = {
    [EmergencyType.CARDIAC_ARREST]: ambulance.type.includes("Advanced")
      ? 0.7
      : 1.0,
    [EmergencyType.TRAUMA]: ambulance.type.includes("Critical") ? 0.7 : 1.0,
    [EmergencyType.STROKE]: ambulance.type.includes("Advanced") ? 0.7 : 1.0,
    [EmergencyType.PEDIATRIC]: ambulance.type.includes("Neonatal") ? 0.6 : 1.0,
  };
  score *= typeBonus[request.emergencyType] || 1.0;

  // Equipment bonus
  if (
    ambulance.equipment?.ventilator &&
    request.severity === EmergencySeverity.CRITICAL
  ) {
    score *= 0.8;
  }

  // Driver rating bonus
  if (ambulance.driver && ambulance.driver.rating >= 4.8) {
    score *= 0.9;
  }

  return score;
}

// Hospital scoring based on emergency type and distance
function calculateHospitalScore(
  hospital: Hospital,
  request: EmergencyRequest,
  distance: number
): number {
  let score = 100; // Base score

  // Distance penalty
  score -= distance * 5;

  // Wait time penalty
  if (hospital.waitTime) {
    score -= hospital.waitTime;
  }

  // Specialty matching bonus
  const specialtyBonus: Record<string, string> = {
    [EmergencyType.CARDIAC_ARREST]: "Cardiology",
    [EmergencyType.TRAUMA]: "Trauma Surgery",
    [EmergencyType.STROKE]: "Neurology",
    [EmergencyType.RESPIRATORY]: "Pulmonology",
    [EmergencyType.PEDIATRIC]: "Pediatrics",
  };

  const preferredSpecialty = specialtyBonus[request.emergencyType];
  if (
    preferredSpecialty &&
    hospital.specialties?.includes(preferredSpecialty)
  ) {
    score += 20;
  }

  // Capacity scoring
  score += hospital.availableBeds * 0.5;
  score += hospital.availableICUs * 2;
  score += hospital.availableVentilators * 1.5;

  // Critical care needs
  if (request.severity === EmergencySeverity.CRITICAL) {
    if (hospital.availableICUs === 0) score -= 30;
    if (hospital.availableVentilators === 0) score -= 20;
  }

  return Math.max(0, score);
}

// LocalStorage helpers
const DISPATCH_HISTORY_KEY = "ambulance_dispatch_history";

function saveDispatchHistory(history: DispatchHistory[]): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(DISPATCH_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error("Failed to save dispatch history:", error);
  }
}

function loadDispatchHistory(): DispatchHistory[] {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(DISPATCH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  } catch (error) {
    console.error("Failed to load dispatch history:", error);
    return [];
  }
}

export function useAmbulanceTrackerEnhanced() {
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
  const [emergencyRequest, setEmergencyRequest] =
    useState<EmergencyRequest | null>(null);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchHistory[]>([]);

  const userLocation = useMemo(() => initialUserLocation, []);

  // Load dispatch history on mount
  useEffect(() => {
    const history = loadDispatchHistory();
    setDispatchHistory(history);
  }, []);

  // Request notification permission
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // Find best ambulance based on emergency request
  const findBestAmbulance = useCallback(
    (request: EmergencyRequest) => {
      const available = ambulances.filter(
        (amb) =>
          amb.status === AmbulanceStatus.AVAILABLE || amb.status === undefined
      );

      if (available.length === 0) return null;

      // Calculate priority scores and sort
      const scored = available.map((amb) => {
        const distance = haversineDistance(userLocation, amb.location);
        return {
          ambulance: amb,
          distance,
          score: calculatePriorityScore(amb, request, distance),
        };
      });

      scored.sort((a, b) => a.score - b.score);
      return scored[0];
    },
    [ambulances, userLocation]
  );

  // Find best hospital based on emergency request
  const findBestHospital = useCallback(
    (
      request: EmergencyRequest,
      ambulanceLocation: { lat: number; lng: number }
    ) => {
      const scored = mockHospitals.map((hospital) => {
        const distance = haversineDistance(
          ambulanceLocation,
          hospital.location
        );
        return {
          hospital: { ...hospital, distance },
          score: calculateHospitalScore(hospital, request, distance),
        };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored[0]?.hospital || mockHospitals[0];
    },
    []
  );

  // Enhanced dispatch with emergency request
  const dispatchAmbulanceWithRequest = useCallback(
    (request: EmergencyRequest) => {
      setStatus("DISPATCHING");
      setEmergencyRequest(request);

      setTimeout(() => {
        const best = findBestAmbulance(request);

        if (!best) {
          setStatus("IDLE");
          return;
        }

        const { ambulance, distance } = best;
        setDispatchedAmbulance(ambulance);

        // Find best hospital for this emergency
        const hospital = findBestHospital(request, ambulance.location);
        setDestinationHospital(hospital);
        setStatus("DISPATCHED");

        // Update ambulance status
        setAmbulances((prev) =>
          prev.map((amb) =>
            amb.id === ambulance.id
              ? { ...amb, status: AmbulanceStatus.EN_ROUTE }
              : amb
          )
        );

        // Calculate initial ETA
        const initialEta = Math.round(distance / AVERAGE_SPEED_KM_PER_MIN);
        setEta(initialEta);

        // Set route
        if (hospital.location) {
          setRoute([ambulance.location, hospital.location]);
        }

        // Create dispatch history entry
        const historyEntry: DispatchHistory = {
          id: `DISPATCH-${Date.now()}`,
          ambulanceId: ambulance.id,
          ambulanceVehicle: ambulance.vehicle,
          driverName: ambulance.driver?.name || "Unknown",
          emergencyType: request.emergencyType,
          severity: request.severity,
          patientInfo: request.patientInfo,
          dispatchTime: new Date(),
          estimatedArrival: new Date(Date.now() + initialEta * 60000),
          status: "dispatched",
          location: request.location,
          destinationHospital: hospital.name,
        };

        // Update history
        const newHistory = [historyEntry, ...dispatchHistory].slice(0, 50);
        setDispatchHistory(newHistory);
        saveDispatchHistory(newHistory);

        // Show notification
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("Ambulance Dispatched", {
            body: `${ambulance.vehicle} with ${ambulance.driver?.name} is en route. ETA: ${initialEta} min`,
            icon: "/ambulance-icon.png",
          });
        }
      }, 2500);
    },
    [findBestAmbulance, findBestHospital, dispatchHistory]
  );

  // Legacy dispatch for backward compatibility
  const dispatchAmbulance = useCallback(() => {
    if (emergencyRequest) {
      dispatchAmbulanceWithRequest(emergencyRequest);
    } else {
      // Default emergency request
      const defaultRequest: EmergencyRequest = {
        emergencyType: EmergencyType.OTHER,
        severity: EmergencySeverity.URGENT,
        location: userLocation,
        timestamp: new Date(),
      };
      dispatchAmbulanceWithRequest(defaultRequest);
    }
  }, [emergencyRequest, userLocation, dispatchAmbulanceWithRequest]);

  const reset = useCallback(() => {
    setStatus("IDLE");
    setDispatchedAmbulance(null);
    setAmbulances(initialAmbulances);
    setDestinationHospital(null);
    setEta(null);
    setRoute(null);
    setEmergencyRequest(null);
  }, []);

  // Ambulance movement simulation
  useEffect(() => {
    if (
      status !== "DISPATCHED" ||
      !dispatchedAmbulance ||
      !destinationHospital?.location
    )
      return;

    const destination = destinationHospital.location;
    const intervalId = setInterval(() => {
      setAmbulances((prevAmbulances) =>
        prevAmbulances.map((amb) => {
          if (amb.id === dispatchedAmbulance.id) {
            const distance = haversineDistance(amb.location, destination);
            const newEta = Math.max(
              0,
              Math.round(distance / AVERAGE_SPEED_KM_PER_MIN)
            );
            setEta(newEta);

            if (distance < 0.1) {
              // Arrival threshold
              setStatus("ARRIVED");
              setRoute(null);

              // Update dispatch history
              setDispatchHistory((prev) =>
                prev.map((entry, index) =>
                  index === 0
                    ? { ...entry, status: "completed", arrivalTime: new Date() }
                    : entry
                )
              );

              // Show arrival notification
              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification("Ambulance Arrived", {
                  body: `${amb.vehicle} has arrived at ${destinationHospital.name}`,
                  icon: "/ambulance-icon.png",
                });
              }

              return {
                ...amb,
                location: destination,
                status: AmbulanceStatus.ON_SCENE,
              };
            }

            // Simulate movement
            const latDiff = destination.lat - amb.location.lat;
            const lngDiff = destination.lng - amb.location.lng;
            const totalSteps = distance / (AVERAGE_SPEED_KM_PER_MIN / 60);

            const newLat = amb.location.lat + latDiff / totalSteps;
            const newLng = amb.location.lng + lngDiff / totalSteps;

            const newLocation = { lat: newLat, lng: newLng };
            setRoute([newLocation, destination]);
            return { ...amb, location: newLocation };
          }
          return amb;
        })
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status, dispatchedAmbulance, destinationHospital]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      availableCount: ambulances.filter(
        (a) => a.status === AmbulanceStatus.AVAILABLE || a.status === undefined
      ).length,
      enRouteCount: ambulances.filter(
        (a) => a.status === AmbulanceStatus.EN_ROUTE
      ).length,
      onSceneCount: ambulances.filter(
        (a) => a.status === AmbulanceStatus.ON_SCENE
      ).length,
      totalDispatches: dispatchHistory.length,
      averageResponseTime:
        dispatchHistory.length > 0
          ? dispatchHistory
              .filter((h) => h.arrivalTime)
              .reduce((sum, h) => {
                const diff =
                  h.arrivalTime!.getTime() - h.dispatchTime.getTime();
                return sum + diff / 60000; // Convert to minutes
              }, 0) / dispatchHistory.filter((h) => h.arrivalTime).length
          : 0,
    };
  }, [ambulances, dispatchHistory]);

  return {
    status,
    ambulances,
    userLocation,
    dispatchedAmbulance,
    destinationHospital,
    eta,
    route,
    emergencyRequest,
    dispatchHistory,
    stats,
    dispatchAmbulance,
    dispatchAmbulanceWithRequest,
    setEmergencyRequest,
    reset,
  };
}
