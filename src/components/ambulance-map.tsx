"use client";

import type { Ambulance, Hospital } from "../lib/types";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { HospitalIcon, MapPin } from "lucide-react";
import AmbulanceIcon from "./icons/ambulance-icon";
import React from "react";

type PolylineProps = {
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
};

const CustomPolyline = ({ path, ...options }: PolylineProps) => {
  const map = useMap();
  const [polyline, setPolyline] = React.useState<google.maps.Polyline | null>(
    null
  );

  React.useEffect(() => {
    if (!map) return;
    if (!polyline) {
      const p = new google.maps.Polyline({ path, ...options });
      p.setMap(map);
      setPolyline(p);

      return () => {
        p.setMap(null);
      };
    } else {
      polyline.setPath(path);
      polyline.setOptions(options);
    }
  }, [map, polyline, path, options]);

  return null;
};

type AmbulanceMapProps = {
  userLocation: google.maps.LatLngLiteral;
  ambulances: Ambulance[];
  dispatchedAmbulance: Ambulance | null;
  destinationHospital: Hospital | null;
  route: google.maps.LatLngLiteral[] | null;
};

export default function AmbulanceMap({
  userLocation,
  ambulances,
  dispatchedAmbulance,
  destinationHospital,
  route,
}: AmbulanceMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center p-4">
          <h2 className="text-lg font-semibold">Map Unavailable</h2>
          <p>Google Maps API Key is missing.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="swift-responder-map"
        defaultCenter={userLocation}
        defaultZoom={14}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        className="w-full h-full"
        mapTypeControl={false}
      >
        <AdvancedMarker position={userLocation} title={"Your Location"}>
          <MapPin className="text-red-500 w-8 h-8" fill="currentColor" />
        </AdvancedMarker>

        {destinationHospital?.location && (
           <AdvancedMarker position={destinationHospital.location} title={destinationHospital.name}>
             <HospitalIcon className="text-green-600 w-8 h-8" fill="currentColor" />
           </AdvancedMarker>
        )}

        {ambulances.map((amb) => (
          <AdvancedMarker
            key={amb.id}
            position={amb.location}
            title={`Ambulance ${amb.id}`}
          >
            <AmbulanceIcon
              className={`w-10 h-10 transition-transform duration-500 ease-in-out ${
                dispatchedAmbulance?.id === amb.id
                  ? "text-primary animate-pulse"
                  : "text-foreground/70"
              }`}
            />
          </AdvancedMarker>
        ))}
        {route && (
          <CustomPolyline
            path={route}
            strokeColor="hsl(var(--primary))"
            strokeOpacity={0.8}
            strokeWeight={5}
          />
        )}
      </Map>
    </APIProvider>
  );
}
