"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Ambulance, Hospital, DispatchHistory } from "../lib/types";
import {
  initialAmbulances,
  userLocation as initialUserLocation,
  mockHospital,
} from "../lib/mock-data";
import { haversineDistance } from "../lib/utils";
import { searchNearbyHospitals } from "../lib/services/google-places";
import { getRoute, getETAWithTraffic } from "../lib/services/google-directions";
import { saveDispatchHistory } from "../lib/services/indexeddb";

const AVERAGE_SPEED_KM_PER_MIN = 0.8; // Approx 48 km/h (fallback)

export function useAmbulanceTracker() {
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

  const userLocation = useMemo(() => initialUserLocation, []);

  const findNearestAmbulance = useCallback(() => {
    let nearestAmbulance: Ambulance | null = null;
    let minDistance = Infinity;

    ambulances.forEach((ambulance) => {
      if (ambulance.id === dispatchedAmbulance?.id) return; // Don't consider dispatched ambulance
      const distance = haversineDistance(userLocation, ambulance.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestAmbulance = ambulance;
      }
    });

    return nearestAmbulance;
  }, [ambulances, userLocation, dispatchedAmbulance]);

  const dispatchAmbulance = useCallback(async () => {
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

      // Search for real nearby hospitals
      let hospital: Hospital;
      try {
        const hospitals = await searchNearbyHospitals(userLocation, 10000); // 10km radius
        if (hospitals && hospitals.length > 0) {
          // Use the closest hospital with good rating
          hospital = hospitals[0];
        } else {
          // Fallback to mock hospital if API fails
          hospital = mockHospital;
        }
      } catch (error) {
        console.error("Error searching hospitals, using fallback:", error);
        hospital = mockHospital;
      }

      setDispatchedAmbulance(nearest);
      setDestinationHospital(hospital);
      setIsLoadingHospitals(false);

      // Get real route with traffic data
      if (hospital.location) {
        try {
          const routeInfo = await getRoute(
            nearest.location,
            hospital.location,
            {
              departureTime: new Date(),
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            }
          );

          setRoute(routeInfo.path);
          setDistance(routeInfo.distance);
          setEta(Math.round(routeInfo.durationInTraffic || routeInfo.duration));
        } catch (error) {
          console.error("Error getting route, using fallback:", error);
          // Fallback to simple route
          setRoute([nearest.location, hospital.location]);
          const dist = haversineDistance(nearest.location, hospital.location);
          setDistance(dist);
          setEta(Math.round(dist / AVERAGE_SPEED_KM_PER_MIN));
        }
      } else {
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
  }, [status, dispatchedAmbulance, destinationHospital, dispatchStartTime]);

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
            const currentDistance = haversineDistance(
              amb.location,
              destination
            );
            setDistance(currentDistance);
            const newEta = Math.max(
              0,
              Math.round(currentDistance / AVERAGE_SPEED_KM_PER_MIN)
            );
            setEta(newEta);

            if (currentDistance < 0.1) {
              // Arrival threshold
              setStatus("ARRIVED");
              setRoute(null);
              setDistance(0);
              return { ...amb, location: destination };
            }

            // Simulate movement
            const latDiff = destination.lat - amb.location.lat;
            const lngDiff = destination.lng - amb.location.lng;
            // Move a fraction of the distance per second
            const totalSteps =
              currentDistance / (AVERAGE_SPEED_KM_PER_MIN / 60);

            const newLat = amb.location.lat + latDiff / totalSteps;
            const newLng = amb.location.lng + lngDiff / totalSteps;

            const newLocation = { lat: newLat, lng: newLng };
            setRoute([newLocation, destination]);
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
  };
}
