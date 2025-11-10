"use client";

import AmbulanceMapEnhanced from "../components/ambulance-map-enhanced";
import Header from "../components/layout/header";
import { useAmbulanceTracker } from "../hooks/use-ambulance-tracker";
import { useLiveLocation } from "../hooks/use-live-location";
import { useToast } from "../hooks/use-toast";
import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Locate, MapPinOff } from "lucide-react";

export default function LiveTrackingPage() {
  const {
    status,
    ambulances,
    userLocation: defaultUserLocation,
    dispatchedAmbulance,
    destinationHospital,
    eta,
    distance,
    dispatchAmbulance,
    reset,
    route,
    isLoadingHospitals,
  } = useAmbulanceTracker();

  const {
    location: liveLocation,
    error: locationError,
    isLoading: isLocationLoading,
    isSupported: isLocationSupported,
    refresh: refreshLocation,
    isWatching,
  } = useLiveLocation();

  const [isClient, setIsClient] = useState(false);
  const [useLiveTracking, setUseLiveTracking] = useState(true);
  const { toast } = useToast();

  // Use live location if available and enabled, otherwise use default
  const userLocation =
    useLiveTracking && liveLocation
      ? { lat: liveLocation.lat, lng: liveLocation.lng }
      : defaultUserLocation;

  const locationAccuracy = liveLocation?.accuracy;

  useEffect(() => {
    setIsClient(true);

    // Check for Google Maps API
    if (
      !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "YOUR_API_KEY"
    ) {
      toast({
        title: "Map API Key Missing",
        description:
          "The map is disabled. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Show location error toast
  useEffect(() => {
    if (locationError && useLiveTracking) {
      toast({
        title: "Location Access Error",
        description: locationError.message,
        variant: "destructive",
      });
    }
  }, [locationError, useLiveTracking, toast]);

  // Show success toast when location is acquired
  useEffect(() => {
    if (liveLocation && useLiveTracking && !isLocationLoading) {
      toast({
        title: "Live Location Active",
        description: `Accuracy: ±${Math.round(
          liveLocation.accuracy || 0
        )} meters`,
      });
    }
  }, [liveLocation, useLiveTracking, isLocationLoading, toast]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background font-body">
      <Header />

      {/* Location Controls Bar */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLocationSupported ? (
            <>
              <Badge
                variant={useLiveTracking ? "default" : "secondary"}
                className={useLiveTracking ? "bg-green-500" : ""}>
                {useLiveTracking ? (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                    Live Tracking
                  </>
                ) : (
                  <>
                    <MapPinOff className="w-3 h-3 mr-2" />
                    Static Location
                  </>
                )}
              </Badge>

              {liveLocation && useLiveTracking && (
                <>
                  <Badge variant="outline">
                    {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                  </Badge>
                  {locationAccuracy && (
                    <Badge variant="outline">
                      ±{Math.round(locationAccuracy)}m
                    </Badge>
                  )}
                  {liveLocation.speed !== null &&
                    liveLocation.speed !== undefined &&
                    liveLocation.speed > 0 && (
                      <Badge variant="outline">
                        {(liveLocation.speed * 3.6).toFixed(1)} km/h
                      </Badge>
                    )}
                </>
              )}
            </>
          ) : (
            <Badge variant="destructive">Geolocation Not Supported</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLocationSupported && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseLiveTracking(!useLiveTracking)}>
                {useLiveTracking ? (
                  <>
                    <MapPinOff className="w-4 h-4 mr-2" />
                    Use Static Location
                  </>
                ) : (
                  <>
                    <Locate className="w-4 h-4 mr-2" />
                    Enable Live Tracking
                  </>
                )}
              </Button>

              {useLiveTracking && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={refreshLocation}
                  disabled={isLocationLoading}>
                  {isLocationLoading ? "Refreshing..." : "Refresh Location"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        <Sidebar
          status={status}
          eta={eta}
          distance={distance}
          dispatchedAmbulance={dispatchedAmbulance}
          destinationHospital={destinationHospital}
          onDispatch={dispatchAmbulance}
          onReset={reset}
          isLoadingHospitals={isLoadingHospitals}
          userLocation={userLocation}
        />
        <div className="flex-1 relative">
          <AmbulanceMapEnhanced
            userLocation={userLocation}
            ambulances={ambulances}
            dispatchedAmbulance={dispatchedAmbulance}
            destinationHospital={destinationHospital}
            route={route}
            locationAccuracy={locationAccuracy}
            isLiveLocationEnabled={useLiveTracking && isWatching}
            onLocationRefresh={refreshLocation}
          />
        </div>
      </main>
    </div>
  );
}
