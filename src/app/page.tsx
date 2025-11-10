"use client";

import AmbulanceMap from "../components/ambulance-map";
import Header from "../components/layout/header";
import { useAmbulanceTracker } from "../hooks/use-ambulance-tracker";
import { useToast } from "../hooks/use-toast";
import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";

export default function Home() {
  const {
    status,
    ambulances,
    userLocation,
    dispatchedAmbulance,
    destinationHospital,
    eta,
    dispatchAmbulance,
    reset,
    route,
  } = useAmbulanceTracker();

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

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

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background font-body">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <Sidebar
          status={status}
          eta={eta}
          dispatchedAmbulance={dispatchedAmbulance}
          destinationHospital={destinationHospital}
          onDispatch={dispatchAmbulance}
          onReset={reset}
        />
        <div className="flex-1 relative">
          <AmbulanceMap
            userLocation={userLocation}
            ambulances={ambulances}
            dispatchedAmbulance={dispatchedAmbulance}
            destinationHospital={destinationHospital}
            route={route}
          />
        </div>
      </main>
    </div>
  );
}
