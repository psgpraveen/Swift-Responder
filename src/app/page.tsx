"use client";

import AmbulanceMapEnhanced from "../components/ambulance-map-enhanced";
import Header from "../components/layout/header";
import { useAmbulanceTracker } from "../hooks/use-ambulance-tracker";
import { useLiveLocation } from "../hooks/use-live-location";
import { useNotificationSound } from "../hooks/use-notification-sound";
import { useToast } from "../hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Locate,
  MapPinOff,
  Navigation2,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
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
  const [showSOS, setShowSOS] = useState(false);
  const { toast } = useToast();
  const { notify } = useNotificationSound();

  // FIX: Make userLocation stable
  const userLocation = useMemo(() => {
    return useLiveTracking && liveLocation
      ? { lat: liveLocation.lat, lng: liveLocation.lng }
      : { lat: 34.0522, lng: -118.2437 };
  }, [useLiveTracking, liveLocation]);

  const {
    status,
    ambulances,
    dispatchedAmbulance,
    destinationHospital,
    eta,
    distance,
    dispatchAmbulance,
    reset,
    route,
    isLoadingHospitals,
    useGeminiSearch,
    setUseGeminiSearch,
    medicalNeeds,
    setMedicalNeeds,
  } = useAmbulanceTracker(userLocation);

  const handleSOS = () => {
    setShowSOS(true);
    notify("alert");
    toast({
      title: "🚨 SOS ACTIVATED",
      description: "Emergency services are being notified!",
      variant: "destructive",
    });

    setTimeout(() => {
      if (status === "IDLE") dispatchAmbulance();
      setShowSOS(false);
    }, 2000);
  };

  useEffect(() => {
    if (status === "DISPATCHED") notify("dispatch");
    else if (status === "ARRIVED") notify("arrived");
  }, [status, notify]);

  const locationAccuracy = liveLocation?.accuracy;

  useEffect(() => {
    setIsClient(true);

    if (
      !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "YOUR_API_KEY"
    ) {
      toast({
        title: "Map API Key Missing",
        description:
          "The map is disabled. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (locationError && useLiveTracking) {
      toast({
        title: "Location Access Error",
        description: locationError.message,
        variant: "destructive",
      });
    }
  }, [locationError, useLiveTracking, toast]);

  useEffect(() => {
    if (liveLocation && useLiveTracking && !isLocationLoading) {
      toast({
        title: "Live Location Active",
        description: `Tracking with ±${Math.round(
          liveLocation.accuracy || 0
        )}m accuracy`,
        duration: 3000,
      });
    }
  }, [liveLocation, useLiveTracking, isLocationLoading, toast]);

  if (!isClient) return null;

  return (
    <div className="flex flex-col h-screen w-screen bg-background font-body">
      <Header />

      {/* SOS Button - Responsive */}
      {status === "IDLE" && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
          <Button
            size="lg"
            onClick={handleSOS}
            disabled={showSOS}
            className={`rounded-full w-16 h-16 sm:w-20 sm:h-20 shadow-2xl ${
              showSOS
                ? "bg-red-500 animate-pulse"
                : "bg-red-600 hover:bg-red-700"
            } transition-all hover:scale-110`}>
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="text-[10px] sm:text-xs font-bold mt-0.5 sm:mt-1">
                SOS
              </span>
            </div>
          </Button>
        </div>
      )}

      {/* Location Status Bar - Responsive */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-white/10 px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
          {isLocationSupported ? (
            <>
              <Badge
                variant={
                  useLiveTracking && liveLocation ? "default" : "secondary"
                }
                className={`text-[10px] sm:text-xs ${
                  useLiveTracking && liveLocation ? "bg-green-500" : ""
                }`}>
                {useLiveTracking && liveLocation ? (
                  <>
                    <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-2 animate-pulse" />
                    <span className="hidden sm:inline">Live GPS Active</span>
                    <span className="sm:hidden">GPS On</span>
                  </>
                ) : isLocationLoading ? (
                  <>
                    <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Acquiring GPS...</span>
                    <span className="sm:hidden">Acquiring...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Static Location</span>
                    <span className="sm:hidden">Static</span>
                  </>
                )}
              </Badge>

              {liveLocation && useLiveTracking && (
                <>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] sm:text-xs hidden md:inline-flex">
                    {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] sm:text-xs md:hidden">
                    {liveLocation.lat.toFixed(4)}, {liveLocation.lng.toFixed(4)}
                  </Badge>
                  {locationAccuracy && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] sm:text-xs ${
                        locationAccuracy < 20
                          ? "border-green-500 text-green-500"
                          : locationAccuracy < 50
                          ? "border-yellow-500 text-yellow-500"
                          : "border-orange-500 text-orange-500"
                      }`}>
                      ±{Math.round(locationAccuracy)}m
                    </Badge>
                  )}
                  {liveLocation.speed > 0.5 && (
                    <Badge
                      variant="outline"
                      className="border-blue-500 text-blue-500 text-[10px] sm:text-xs">
                      <Navigation2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      {(liveLocation.speed * 3.6).toFixed(1)} km/h
                    </Badge>
                  )}
                </>
              )}
            </>
          ) : (
            <Badge variant="destructive" className="text-[10px] sm:text-xs">
              <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">
                Geolocation Not Supported
              </span>
              <span className="sm:hidden">GPS N/A</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          {isLocationSupported && (
            <>
              <Button
                variant={useLiveTracking ? "default" : "outline"}
                size="sm"
                onClick={() => setUseLiveTracking(!useLiveTracking)}
                className={`text-xs sm:text-sm flex-1 sm:flex-none ${
                  useLiveTracking ? "bg-green-600 hover:bg-green-700" : ""
                }`}>
                {useLiveTracking ? (
                  <>
                    <Locate className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">GPS Enabled</span>
                    <span className="sm:hidden">On</span>
                  </>
                ) : (
                  <>
                    <MapPinOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Enable GPS</span>
                    <span className="sm:hidden">Off</span>
                  </>
                )}
              </Button>

              {useLiveTracking && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={refreshLocation}
                  disabled={isLocationLoading}
                  className="text-xs sm:text-sm flex-1 sm:flex-none">
                  {isLocationLoading ? (
                    <span className="hidden sm:inline">Refreshing...</span>
                  ) : (
                    <span className="hidden sm:inline">Refresh</span>
                  )}
                  <span className="sm:hidden">
                    {isLocationLoading ? "..." : "↻"}
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
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
          useGeminiSearch={useGeminiSearch}
          setUseGeminiSearch={setUseGeminiSearch}
          medicalNeeds={medicalNeeds}
          setMedicalNeeds={setMedicalNeeds}
        />
        <div className="flex-1 relative min-h-[50vh] md:min-h-0">
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
