import type { Ambulance, Hospital } from "./types";
import { AmbulanceType, AmbulanceStatus } from "./types";

// Using coordinates for Downtown Los Angeles area
const center = { lat: 34.0522, lng: -118.2437 };

export const initialAmbulances: Ambulance[] = [
  {
    id: "AMB-001",
    vehicle: "Ford Transit Custom",
    type: AmbulanceType.ADVANCED,
    status: AmbulanceStatus.AVAILABLE,
    location: { lat: center.lat + 0.01, lng: center.lng - 0.01 },
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
    location: { lat: center.lat - 0.01, lng: center.lng + 0.01 },
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
    location: { lat: center.lat + 0.005, lng: center.lng + 0.015 },
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
    location: { lat: center.lat - 0.015, lng: center.lng - 0.005 },
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
    location: { lat: center.lat + 0.02, lng: center.lng - 0.02 },
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
  phone: "+1-555-HOSPITAL",
  specialties: [
    "Cardiology",
    "Emergency Medicine",
    "Trauma Surgery",
    "Neurology",
    "Orthopedics",
  ],
  waitTime: 5,
  distance: 2.8,
};

export const mockHospitals: Hospital[] = [
  mockHospital,
  {
    name: "St. Mary's Medical Center",
    address: "456 Oak Avenue, Los Angeles, CA",
    availableBeds: 8,
    availableICUs: 2,
    availableNICUs: 1,
    availableOxygenCylinders: 6,
    availableVentilators: 3,
    availableDoctors: 5,
    suitabilityScore: 8.5,
    reason: "Excellent emergency care with short wait times.",
    location: { lat: center.lat - 0.025, lng: center.lng + 0.015 },
    phone: "+1-555-STMARY",
    specialties: [
      "Emergency Medicine",
      "Internal Medicine",
      "Pediatrics",
      "Obstetrics",
    ],
    waitTime: 8,
    distance: 3.5,
  },
  {
    name: "City Memorial Hospital",
    address: "789 Elm Street, Los Angeles, CA",
    availableBeds: 15,
    availableICUs: 4,
    availableNICUs: 3,
    availableOxygenCylinders: 12,
    availableVentilators: 6,
    availableDoctors: 10,
    suitabilityScore: 9.0,
    reason: "Large capacity with specialized trauma unit.",
    location: { lat: center.lat + 0.015, lng: center.lng - 0.025 },
    phone: "+1-555-CITYMEM",
    specialties: [
      "Trauma Surgery",
      "Neurosurgery",
      "Emergency Medicine",
      "Burn Unit",
    ],
    waitTime: 6,
    distance: 2.2,
  },
];
