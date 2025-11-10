export type Ambulance = {
  id: string;
  vehicle: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type Hospital = {
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
};
