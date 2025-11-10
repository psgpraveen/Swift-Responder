import type { Ambulance, Hospital } from "./types";

// Using coordinates for Downtown Los Angeles area
const center = { lat: 34.0522, lng: -118.2437 };

export const initialAmbulances: Ambulance[] = [
  {
    id: "AMB-001",
    vehicle: "Ford Transit Custom",
    location: { lat: center.lat + 0.01, lng: center.lng - 0.01 },
  },
  {
    id: "AMB-007",
    vehicle: "Mercedes-Benz Sprinter",
    location: { lat: center.lat - 0.01, lng: center.lng + 0.01 },
  },
  {
    id: "AMB-003",
    vehicle: "Ford E-Series",
    location: { lat: center.lat + 0.005, lng: center.lng + 0.015 },
  },
];

export const userLocation = { lat: center.lat, lng: center.lng };

export const mockHospital: Hospital = {
    name: "General Hospital",
    address: "123 Main St, Los Angeles, CA",
    availableBeds: 12,
    availableICUs: 3,
    availableNICUs: 2,
    availableOxygenCylinders: 8,
    availableVentilators: 5,
    availableDoctors: 7,
    suitabilityScore: 9.2,
    reason: "Top-rated for cardiac emergencies and has immediate availability.",
    location: { lat: center.lat + 0.02, lng: center.lng + 0.02 },
};
