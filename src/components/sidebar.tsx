"use client";

import {
  AlertCircle,
  BedDouble,
  Clock,
  HeartPulse,
  History,
  AirVent,
  Phone,
  Siren,
  Stethoscope,
  Activity,
  Baby,
} from "lucide-react";
import { Button } from "./ui/button";
import type { Ambulance, Hospital } from "../lib/types";
import { useState } from "react";
import { useToast } from "../hooks/use-toast";

type SidebarProps = {
  status: "IDLE" | "DISPATCHING" | "DISPATCHED" | "ARRIVED";
  eta: number | null;
  dispatchedAmbulance: Ambulance | null;
  destinationHospital: Hospital | null;
  onDispatch: () => void;
  onReset: () => void;
};

export default function Sidebar({
  status,
  eta,
  dispatchedAmbulance,
  destinationHospital,
  onDispatch,
  onReset,
}: SidebarProps) {
  const [isCalling, setIsCalling] = useState(false);
  const { toast } = useToast();

  const handleCall = () => {
    setIsCalling(!isCalling);
    // In a real app, this would initiate a VOIP call.
    if (!isCalling) {
      setTimeout(() => setIsCalling(false), 5000); // Simulate a 5 second call
    }
  };

  const handlePatientRecords = () => {
    // In a real app, this would open a secure view for patient records.
    toast({
      title: "Accessing Patient Records",
      description: "This feature is for demonstration purposes only.",
    });
  };

  const renderContent = () => {
    switch (status) {
      case "DISPATCHING":
        return (
          <div className="text-center py-8 space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <Siren className="relative w-16 h-16 mx-auto animate-spin text-primary drop-shadow-lg" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-lg">
                Dispatching nearest ambulance...
              </p>
              <p className="text-sm text-muted-foreground">
                Finding best hospital...
              </p>
              <div className="flex justify-center gap-1 mt-4">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        );
      case "DISPATCHED":
      case "ARRIVED":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Ambulance
              </p>
              <p className="font-semibold text-lg mt-1">
                {dispatchedAmbulance?.id} - {dispatchedAmbulance?.vehicle}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-lg p-4">
              <div className="bg-accent/20 p-2 rounded-full">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Estimated Arrival
                </p>
                <p className="font-bold text-xl">
                  {status === "ARRIVED" ? "Arrived! 🎉" : `${eta} min`}
                </p>
              </div>
            </div>
            {destinationHospital && (
              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Destination Hospital
                  </p>
                  <p className="font-semibold text-lg mt-1">
                    {destinationHospital.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {destinationHospital.address}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                    <BedDouble className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs">
                      <strong>{destinationHospital.availableBeds}</strong> Beds
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                    <HeartPulse className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs">
                      <strong>{destinationHospital.availableICUs}</strong> ICUs
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                    <Baby className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs">
                      <strong>{destinationHospital.availableNICUs}</strong>{" "}
                      NICUs
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                    <Siren className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs">
                      <strong>
                        {destinationHospital.availableOxygenCylinders}
                      </strong>{" "}
                      O₂
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                    <AirVent className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs">
                      <strong>
                        {destinationHospital.availableVentilators}
                      </strong>{" "}
                      Vents
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                    <Stethoscope className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs">
                      <strong>{destinationHospital.availableDoctors}</strong>{" "}
                      Docs
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button
                onClick={handleCall}
                className="w-full"
                variant={isCalling ? "destructive" : "default"}>
                {isCalling && (
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
                {isCalling ? "End Call" : "Call"}
                <Phone className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={handlePatientRecords} variant="secondary">
                Records <History className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={onReset}
                variant="outline"
                className="col-span-2">
                Cancel Dispatch
              </Button>
            </div>
          </div>
        );
      case "IDLE":
      default:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="space-y-2">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl"></div>
                <Siren className="relative w-20 h-20 mx-auto text-accent drop-shadow-lg" />
              </div>
              <p className="text-muted-foreground">
                In case of emergency, request an ambulance immediately.
              </p>
            </div>
            <Button
              onClick={onDispatch}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-8 shadow-lg hover:shadow-xl transition-all">
              <Siren className="mr-2 h-6 w-6" />
              Request Ambulance
            </Button>
          </div>
        );
    }
  };

  return (
    <aside className="w-96 bg-card/95 backdrop-blur-sm border-r flex flex-col p-6 space-y-6 shadow-lg">
      <div className="flex items-center gap-3 text-lg font-semibold">
        <div className="bg-primary/10 p-2 rounded-lg">
          <AlertCircle className="text-primary h-5 w-5" />
        </div>
        <span>Emergency Dispatch</span>
      </div>
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      <div className="border-t pt-4 space-y-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" /> System Status
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <p className="text-sm text-green-400 font-medium">
            All systems operational
          </p>
        </div>
      </div>
    </aside>
  );
}
