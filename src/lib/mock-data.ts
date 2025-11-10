import type { Ambulance, Hospital } from "./types";
import { AmbulanceType, AmbulanceStatus } from "./types";

/**
 * Generate ambulances positioned around a given location
 * This allows ambulances to always be near the user's real location
 */
export function generateAmbulancesNearLocation(location: {
  lat: number;
  lng: number;
}): Ambulance[] {
  return [
    {
      id: "AMB-001",
      vehicle: "Ford Transit Custom",
      type: AmbulanceType.ADVANCED,
      status: AmbulanceStatus.AVAILABLE,
      location: { lat: location.lat + 0.01, lng: location.lng - 0.01 },
      driver: {
        name: "John Martinez",
        phone: "+1-555-0101",
        rating: 4.8,
      },
      equipment: {
        defibrillator: true,
        oxygen: true,
        ventilator: true,
        medications: ["Epinephrine", "Atropine", "Aspirin", "Nitroglycerin"],
      },
    },
    {
      id: "AMB-007",
      vehicle: "Mercedes-Benz Sprinter",
      type: AmbulanceType.CRITICAL_CARE,
      status: AmbulanceStatus.AVAILABLE,
      location: { lat: location.lat - 0.01, lng: location.lng + 0.01 },
      driver: {
        name: "Sarah Johnson",
        phone: "+1-555-0107",
        rating: 4.9,
      },
      equipment: {
        defibrillator: true,
        oxygen: true,
        ventilator: true,
        medications: [
          "Epinephrine",
          "Atropine",
          "Aspirin",
          "Nitroglycerin",
          "Dopamine",
          "Amiodarone",
        ],
      },
    },
    {
      id: "AMB-003",
      vehicle: "Ford E-Series",
      type: AmbulanceType.BASIC,
      status: AmbulanceStatus.AVAILABLE,
      location: { lat: location.lat + 0.005, lng: location.lng + 0.015 },
      driver: {
        name: "Michael Chen",
        phone: "+1-555-0103",
        rating: 4.7,
      },
      equipment: {
        defibrillator: true,
        oxygen: true,
        ventilator: false,
        medications: ["Aspirin", "Glucose", "Albuterol"],
      },
    },
    {
      id: "AMB-012",
      vehicle: "Chevrolet Express",
      type: AmbulanceType.ADVANCED,
      status: AmbulanceStatus.AVAILABLE,
      location: { lat: location.lat - 0.015, lng: location.lng - 0.005 },
      driver: {
        name: "Emily Rodriguez",
        phone: "+1-555-0112",
        rating: 4.9,
      },
      equipment: {
        defibrillator: true,
        oxygen: true,
        ventilator: true,
        medications: ["Epinephrine", "Atropine", "Aspirin", "Morphine"],
      },
    },
    {
      id: "AMB-018",
      vehicle: "Ram ProMaster",
      type: AmbulanceType.NEONATAL,
      status: AmbulanceStatus.AVAILABLE,
      location: { lat: location.lat + 0.02, lng: location.lng - 0.02 },
      driver: {
        name: "David Kim",
        phone: "+1-555-0118",
        rating: 5.0,
      },
      equipment: {
        defibrillator: true,
        oxygen: true,
        ventilator: true,
        medications: [
          "Pediatric Epinephrine",
          "Surfactant",
          "Glucose",
          "Sodium Bicarbonate",
        ],
      },
    },
  ];
}

// Default fallback location (Los Angeles) if live location is unavailable
const defaultLocation = { lat: 34.0522, lng: -118.2437 };

// Export initial ambulances (will be regenerated based on actual user location)
export const initialAmbulances: Ambulance[] =
  generateAmbulancesNearLocation(defaultLocation);

// Deprecated: Use live location instead
export const userLocation = defaultLocation;

// Fallback hospital (only used if Google Places API fails)
export const mockHospital: Hospital = {
  name: "Emergency Medical Center (Fallback)",
  address: "Location data unavailable",
  availableBeds: 12,
  availableICUs: 3,
  availableNICUs: 2,
  availableOxygenCylinders: 8,
  availableVentilators: 5,
  availableDoctors: 7,
  suitabilityScore: 8.0,
  reason: "Fallback hospital - real hospital data temporarily unavailable.",
  location: {
    lat: defaultLocation.lat + 0.02,
    lng: defaultLocation.lng + 0.02,
  },
  phone: "+1-555-HOSPITAL",
  specialties: ["Emergency Medicine", "General Medicine"],
  waitTime: 10,
  distance: 2.8,
};

export const mockHospitals: Hospital[] = [mockHospital];
