"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Ambulance, Hospital } from "../lib/types";
import { initialAmbulances, userLocation as initialUserLocation, mockHospital } from "../lib/mock-data";
import { haversineDistance } from "../lib/utils";

const AVERAGE_SPEED_KM_PER_MIN = 0.8; // Approx 48 km/h

export function useAmbulanceTracker() {
  const [status, setStatus] = useState<"IDLE" | "DISPATCHING" | "DISPATCHED" | "ARRIVED">("IDLE");
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances);
  const [dispatchedAmbulance, setDispatchedAmbulance] = useState<Ambulance | null>(null);
  const [destinationHospital, setDestinationHospital] = useState<Hospital | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [route, setRoute] = useState<google.maps.LatLngLiteral[] | null>(null);
  
  const userLocation = useMemo(() => initialUserLocation, []);

  const findNearestAmbulance = useCallback(() => {
    let nearestAmbulance: Ambulance | null = null;
    let minDistance = Infinity;

    ambulances.forEach((ambulance) => {
      if(ambulance.id === dispatchedAmbulance?.id) return; // Don't consider dispatched ambulance
      const distance = haversineDistance(userLocation, ambulance.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestAmbulance = ambulance;
      }
    });

    return nearestAmbulance;
  }, [ambulances, userLocation, dispatchedAmbulance]);

  const dispatchAmbulance = useCallback(() => {
    setStatus("DISPATCHING");
    setTimeout(() => {
      const nearest = findNearestAmbulance();
      if (nearest) {
        setDispatchedAmbulance(nearest);
        // For demo purposes, we'll use a mock hospital.
        // In a real app, you would fetch this from the AI suggestion.
        const hospital = mockHospital;
        setDestinationHospital(hospital);
        setStatus("DISPATCHED");

        if (hospital.location) {
          setRoute([nearest.location, hospital.location]);
        } else {
          setRoute([nearest.location, userLocation]); // Fallback to user location
        }
      } else {
        setStatus("IDLE"); // Or some error state
      }
    }, 2500); // Simulate dispatch and hospital search delay
  }, [findNearestAmbulance, userLocation]);
  
  const reset = useCallback(() => {
    setStatus("IDLE");
    setDispatchedAmbulance(null);
    setAmbulances(initialAmbulances);
    setDestinationHospital(null);
    setEta(null);
    setRoute(null);
  }, []);

  useEffect(() => {
    if (status !== "DISPATCHED" || !dispatchedAmbulance || !destinationHospital?.location) return;

    const destination = destinationHospital.location;
    const intervalId = setInterval(() => {
      setAmbulances((prevAmbulances) =>
        prevAmbulances.map((amb) => {
          if (amb.id === dispatchedAmbulance.id) {
            const distance = haversineDistance(amb.location, destination);
            const newEta = Math.max(0, Math.round(distance / AVERAGE_SPEED_KM_PER_MIN));
            setEta(newEta);

            if (distance < 0.1) { // Arrival threshold
              setStatus("ARRIVED");
              setRoute(null);
              return { ...amb, location: destination };
            }

            // Simulate movement
            const latDiff = destination.lat - amb.location.lat;
            const lngDiff = destination.lng - amb.location.lng;
            // Move a fraction of the distance per second
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
    }, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, [status, dispatchedAmbulance, destinationHospital]);

  return { status, ambulances, userLocation, dispatchedAmbulance, destinationHospital, eta, dispatchAmbulance, reset, route };
}
