// Enums for better type safety
export enum AmbulanceType {
  BASIC = "Basic Life Support",
  ADVANCED = "Advanced Life Support",
  CRITICAL_CARE = "Critical Care Transport",
  NEONATAL = "Neonatal Transport",
}

export enum AmbulanceStatus {
  AVAILABLE = "available",
  DISPATCHED = "dispatched",
  EN_ROUTE = "en_route",
  ON_SCENE = "on_scene",
  TRANSPORTING = "transporting",
  AT_HOSPITAL = "at_hospital",
  MAINTENANCE = "maintenance",
}

export enum EmergencySeverity {
  CRITICAL = "Critical - Life Threatening",
  URGENT = "Urgent - Needs Immediate Care",
  NON_URGENT = "Non-Urgent - Stable",
}

export enum EmergencyType {
  CARDIAC = "Cardiac Emergency",
  TRAUMA = "Trauma/Injury",
  RESPIRATORY = "Respiratory Distress",
  STROKE = "Stroke",
  PEDIATRIC = "Pediatric Emergency",
  OBSTETRIC = "Obstetric Emergency",
  PSYCHIATRIC = "Psychiatric Emergency",
  OTHER = "Other Medical Emergency",
}

// Enhanced Ambulance type
export type Ambulance = {
  id: string;
  vehicle: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
  location: {
    lat: number;
    lng: number;
  };
  driver?: {
    name: string;
    phone: string;
    rating: number;
  };
  equipment?: {
    defibrillator: boolean;
    oxygen: boolean;
    ventilator: boolean;
    medications: string[];
  };
};

// Enhanced Hospital type
export type Hospital = {
  id?: string; // Place ID from Google Places API
  name: string;
  address: string;
  availableBeds: number;
  availableICUs: number;
  availableNICUs: number;
  availableOxygenCylinders: number;
  availableVentilators: number;
  availableDoctors: number;
  suitabilityScore: number;
  reason: string;
  location?: google.maps.LatLngLiteral;
  phone?: string;
  specialties?: string[];
  waitTime?: number; // in minutes
  distance?: number; // in km
  rating?: number; // Google rating (1-5)
  reviewCount?: number; // Number of Google reviews
  isOpen?: boolean; // Whether hospital is currently open
};

// New types for enhanced features
export type EmergencyRequest = {
  id: string;
  timestamp: number;
  severity: EmergencySeverity;
  type: EmergencyType;
  location: google.maps.LatLngLiteral;
  patientInfo?: PatientInfo;
  requestedBy: string;
  status: "pending" | "dispatched" | "completed" | "cancelled";
};

export type PatientInfo = {
  age?: number;
  gender?: "male" | "female" | "other";
  consciousness?: "alert" | "verbal" | "pain" | "unresponsive";
  chiefComplaint?: string;
  allergies?: string[];
  medications?: string[];
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
};

export type DispatchHistory = {
  id: string;
  timestamp: number;
  ambulance: Ambulance;
  hospital: Hospital;
  duration: number; // in minutes
  outcome: "completed" | "cancelled" | "transferred";
  notes?: string;
};
