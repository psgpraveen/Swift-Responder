"use client";

import type { Ambulance, Hospital } from "../lib/types";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import {
  HospitalIcon,
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  Maximize2,
  Compass,
  MapPinned,
} from "lucide-react";
import AmbulanceIcon from "./icons/ambulance-icon";
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

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

// Circle overlay for user location accuracy
const AccuracyCircle = ({
  center,
  radius,
}: {
  center: google.maps.LatLngLiteral;
  radius: number;
}) => {
  const map = useMap();
  const [circle, setCircle] = React.useState<google.maps.Circle | null>(null);

  React.useEffect(() => {
    if (!map) return;

    if (!circle) {
      const c = new google.maps.Circle({
        center,
        radius,
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });
      c.setMap(map);
      setCircle(c);

      return () => {
        c.setMap(null);
      };
    } else {
      circle.setCenter(center);
      circle.setRadius(radius);
    }
  }, [map, circle, center, radius]);

  return null;
};

type AmbulanceMapEnhancedProps = {
  userLocation: google.maps.LatLngLiteral;
  ambulances: Ambulance[];
  dispatchedAmbulance: Ambulance | null;
  destinationHospital: Hospital | null;
  route: google.maps.LatLngLiteral[] | null;
  locationAccuracy?: number;
  isLiveLocationEnabled?: boolean;
  onLocationRefresh?: () => void;
};

export default function AmbulanceMapEnhanced({
  userLocation,
  ambulances,
  dispatchedAmbulance,
  destinationHospital,
  route,
  locationAccuracy,
  isLiveLocationEnabled = false,
  onLocationRefresh,
}: AmbulanceMapEnhancedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(14);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">(
    "roadmap"
  );
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [trafficLayer, setTrafficLayer] =
    useState<google.maps.TrafficLayer | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Get map instance through context
  const map = useMap();

  // Store map instance when available
  React.useEffect(() => {
    if (map && !mapInstance) {
      setMapInstance(map);
    }
  }, [map, mapInstance]); // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom() || 14;
      mapInstance.setZoom(currentZoom + 1);
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom() || 14;
      mapInstance.setZoom(currentZoom - 1);
    }
  }, [mapInstance]);

  // Center on user location
  const handleCenterOnUser = useCallback(() => {
    if (mapInstance) {
      mapInstance.panTo(userLocation);
      mapInstance.setZoom(16);
      setIsFollowingUser(true);
      onLocationRefresh?.();
    }
  }, [mapInstance, userLocation, onLocationRefresh]);

  // Toggle map type
  const handleToggleMapType = useCallback(() => {
    setMapType((prev) => {
      if (prev === "roadmap") return "satellite";
      if (prev === "satellite") return "hybrid";
      return "roadmap";
    });
  }, []);

  // Fit bounds to show all markers
  const handleFitBounds = useCallback(() => {
    if (!mapInstance) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation);

    ambulances.forEach((amb) => {
      bounds.extend(amb.location);
    });

    if (destinationHospital?.location) {
      bounds.extend(destinationHospital.location);
    }

    mapInstance.fitBounds(bounds, 50); // 50px padding
  }, [mapInstance, userLocation, ambulances, destinationHospital]);

  // Handle camera change
  const handleCameraChange = useCallback(
    (event: MapCameraChangedEvent) => {
      if (event.detail.zoom !== undefined) {
        setZoom(event.detail.zoom);
      }
      // If user manually moves map, stop following
      if (isFollowingUser) {
        setIsFollowingUser(false);
      }
    },
    [isFollowingUser]
  );

  // Auto-follow user if enabled
  React.useEffect(() => {
    if (isFollowingUser && mapInstance) {
      mapInstance.panTo(userLocation);
    }
  }, [userLocation, isFollowingUser, mapInstance]);

  // Traffic layer toggle
  useEffect(() => {
    if (!mapInstance) return;

    if (showTraffic) {
      const traffic = new google.maps.TrafficLayer();
      traffic.setMap(mapInstance);
      setTrafficLayer(traffic);
    } else if (trafficLayer) {
      trafficLayer.setMap(null);
      setTrafficLayer(null);
    }

    return () => {
      if (trafficLayer) {
        trafficLayer.setMap(null);
      }
    };
  }, [showTraffic, mapInstance]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setShowFullscreen(true);
    } else {
      document.exitFullscreen();
      setShowFullscreen(false);
    }
  }, []);

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center p-4 space-y-4">
          <h2 className="text-lg font-semibold">Map Unavailable</h2>
          <p>Google Maps API Key is missing.</p>
          <div className="text-xs bg-background/50 p-4 rounded-lg border border-white/10 text-left">
            <p className="font-medium mb-2">To enable maps:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Get an API key from Google Cloud Console</li>
              <li>
                Create a <code>.env.local</code> file
              </li>
              <li>
                Add: <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key</code>
              </li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Update map center when user location changes significantly
  React.useEffect(() => {
    if (mapInstance && !isFollowingUser) {
      const currentCenter = mapInstance.getCenter();
      if (currentCenter) {
        const distance = Math.sqrt(
          Math.pow(currentCenter.lat() - userLocation.lat, 2) +
            Math.pow(currentCenter.lng() - userLocation.lng, 2)
        );
        // If location changed by more than ~1km, recenter
        if (distance > 0.01) {
          mapInstance.panTo(userLocation);
        }
      }
    }
  }, [userLocation, mapInstance, isFollowingUser]);

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="swift-responder-map"
          center={userLocation}
          defaultZoom={14}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          className="w-full h-full"
          mapTypeId={mapType}
          onCameraChanged={handleCameraChange}>
          {/* User Location Marker */}
          <AdvancedMarker position={userLocation} title="Your Location">
            <div className="relative">
              <MapPin
                className="text-red-500 w-8 h-8 drop-shadow-lg"
                fill="currentColor"
              />
              {isLiveLocationEnabled && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </AdvancedMarker>

          {/* Accuracy circle if live location is enabled */}
          {isLiveLocationEnabled && locationAccuracy && (
            <AccuracyCircle center={userLocation} radius={locationAccuracy} />
          )}

          {/* Hospital Marker */}
          {destinationHospital?.location && (
            <AdvancedMarker
              position={destinationHospital.location}
              title={destinationHospital.name}>
              <div className="flex flex-col items-center">
                <HospitalIcon
                  className="text-green-600 w-8 h-8 drop-shadow-lg"
                  fill="currentColor"
                />
                <div className="mt-1 bg-green-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                  {destinationHospital.name}
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Ambulance Markers */}
          {ambulances.map((amb) => {
            const isDispatched = dispatchedAmbulance?.id === amb.id;
            return (
              <AdvancedMarker
                key={amb.id}
                position={amb.location}
                title={`${amb.vehicle} - ${
                  amb.driver?.name || "Unknown Driver"
                }`}>
                <div className="flex flex-col items-center">
                  <AmbulanceIcon
                    className={cn(
                      "w-10 h-10 transition-all duration-500 ease-in-out drop-shadow-lg",
                      isDispatched
                        ? "text-primary animate-pulse scale-110"
                        : "text-foreground/70 hover:scale-105"
                    )}
                  />
                  {isDispatched && (
                    <Badge className="mt-1 bg-primary text-primary-foreground animate-pulse">
                      En Route
                    </Badge>
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Route Polyline */}
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

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="bg-card/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-none border-b border-white/10"
            title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-none"
            title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Location Controls */}
        <Button
          variant="default"
          size="icon"
          onClick={handleCenterOnUser}
          className={cn(
            "w-10 h-10 shadow-lg",
            isFollowingUser && "bg-primary animate-pulse"
          )}
          title="Center on Your Location">
          <Locate className="h-4 w-4" />
        </Button>

        {/* Fit Bounds */}
        <Button
          variant="secondary"
          size="icon"
          onClick={handleFitBounds}
          className="w-10 h-10 shadow-lg"
          title="Show All">
          <Navigation className="h-4 w-4" />
        </Button>

        {/* Map Type Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleMapType}
          className="shadow-lg text-xs px-2"
          title="Change Map Type">
          {mapType === "roadmap" && "🗺️"}
          {mapType === "satellite" && "🛰️"}
          {mapType === "hybrid" && "🌍"}
        </Button>

        {/* Traffic Layer Toggle */}
        <Button
          variant={showTraffic ? "default" : "outline"}
          size="icon"
          onClick={() => setShowTraffic(!showTraffic)}
          className={cn(
            "w-10 h-10 shadow-lg",
            showTraffic && "bg-orange-500 hover:bg-orange-600"
          )}
          title={showTraffic ? "Hide Traffic" : "Show Traffic"}>
          <Layers className="h-4 w-4" />
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="w-10 h-10 shadow-lg"
          title={showFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Compass (shows heading if available) */}
        {heading !== 0 && (
          <div className="bg-card/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg p-2">
            <Compass
              className="h-6 w-6 text-primary"
              style={{ transform: `rotate(${heading}deg)` }}
            />
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {/* Live Location Status */}
        {isLiveLocationEnabled && (
          <Badge className="bg-green-500/90 backdrop-blur-sm text-white">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
            Live Location Active
          </Badge>
        )}

        {/* Traffic Status */}
        {showTraffic && (
          <Badge className="bg-orange-500/90 backdrop-blur-sm text-white">
            <Layers className="w-3 h-3 mr-2" />
            Traffic Layer On
          </Badge>
        )}

        {/* Zoom Level */}
        <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
          Zoom: {zoom.toFixed(1)}
        </Badge>

        {/* Accuracy */}
        {locationAccuracy && (
          <Badge
            variant="secondary"
            className={cn(
              "bg-card/90 backdrop-blur-sm",
              locationAccuracy < 20 && "border-green-500",
              locationAccuracy >= 20 &&
                locationAccuracy < 50 &&
                "border-yellow-500",
              locationAccuracy >= 50 && "border-orange-500"
            )}>
            Accuracy: ±{Math.round(locationAccuracy)}m
          </Badge>
        )}

        {/* Active Ambulances Count */}
        <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
          <MapPinned className="w-3 h-3 mr-2" />
          {ambulances.length} Ambulance{ambulances.length !== 1 ? "s" : ""}
        </Badge>
      </div>
    </div>
  );
}
