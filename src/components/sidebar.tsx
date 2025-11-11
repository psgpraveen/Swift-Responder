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
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import type { Ambulance, Hospital } from "../lib/types";
import { useState, useCallback } from "react";
import { useToast } from "../hooks/use-toast";
import { WeatherWidget } from "./weather-widget";

type SidebarProps = {
  status: "IDLE" | "DISPATCHING" | "DISPATCHED" | "ARRIVED";
  eta: number | null;
  distance: number | null;
  dispatchedAmbulance: Ambulance | null;
  destinationHospital: Hospital | null;
  onDispatch: () => void;
  onReset: () => void;
  isLoadingHospitals?: boolean;
  userLocation?: { lat: number; lng: number };
  useGeminiSearch?: boolean;
  setUseGeminiSearch?: (value: boolean) => void;
  medicalNeeds?: string;
  setMedicalNeeds?: (value: string) => void;
};

export default function Sidebar({
  status,
  eta,
  distance,
  dispatchedAmbulance,
  destinationHospital,
  onDispatch,
  onReset,
  isLoadingHospitals = false,
  userLocation,
  useGeminiSearch = true,
  setUseGeminiSearch,
  medicalNeeds = "emergency care",
  setMedicalNeeds,
}: SidebarProps) {
  const [isCalling, setIsCalling] = useState(false);
  const { toast } = useToast();

  // Stable handlers to prevent infinite loops - empty deps since setter functions are already stable
  const handleGeminiToggle = useCallback(
    (value: boolean) => {
      if (setUseGeminiSearch) {
        setUseGeminiSearch(value);
      }
    },
    [] // Empty deps - setUseGeminiSearch is stable from useCallback in hook
  );

  const handleMedicalNeedsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (setMedicalNeeds) {
        setMedicalNeeds(e.target.value);
      }
    },
    [] // Empty deps - setMedicalNeeds is stable from useCallback in hook
  );

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
              {isLoadingHospitals ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching nearby hospitals...</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Calculating optimal route...
                </p>
              )}
              <div className="flex justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></div>
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
                {status === "DISPATCHED" && eta && eta > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">
                      Approximately{" "}
                      {new Date(Date.now() + eta * 60000).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                    {distance !== null && distance > 0 && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        {distance.toFixed(2)} km away
                      </p>
                    )}
                  </>
                )}
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

                  {/* AI Reasoning (if available) */}
                  {destinationHospital.reason && (
                    <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-400">
                          Gemini AI Analysis
                        </span>
                        {destinationHospital.suitabilityScore && (
                          <Badge
                            variant="outline"
                            className="ml-auto border-purple-500/50 text-purple-400 text-xs">
                            Score:{" "}
                            {destinationHospital.suitabilityScore.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {destinationHospital.reason}
                      </p>
                    </div>
                  )}
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

            {/* Weather Conditions */}
            {userLocation && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                  Current Conditions
                </p>
                <WeatherWidget
                  location={userLocation}
                  showImpactAnalysis={status === "DISPATCHED"}
                />
              </div>
            )}

            {/* Driver Information */}
            {dispatchedAmbulance?.driver && (
              <div className="bg-card/50 border rounded-lg p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Driver Information
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {dispatchedAmbulance.driver.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dispatchedAmbulance.driver.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">
                      {dispatchedAmbulance.driver.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Equipment Available */}
            {dispatchedAmbulance?.equipment && (
              <div className="bg-card/50 border rounded-lg p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Equipment On Board
                </p>
                <div className="flex flex-wrap gap-2">
                  {dispatchedAmbulance.equipment.defibrillator && (
                    <Badge variant="secondary" className="text-xs">
                      <Activity className="w-3 h-3 mr-1" />
                      Defibrillator
                    </Badge>
                  )}
                  {dispatchedAmbulance.equipment.oxygen && (
                    <Badge variant="secondary" className="text-xs">
                      <AirVent className="w-3 h-3 mr-1" />
                      Oxygen
                    </Badge>
                  )}
                  {dispatchedAmbulance.equipment.ventilator && (
                    <Badge variant="secondary" className="text-xs">
                      Ventilator
                    </Badge>
                  )}
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
          <div className="space-y-6 py-4">
            {/* Gemini AI Controls */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">AI-Powered Search</h3>
                {useGeminiSearch && (
                  <Badge
                    variant="outline"
                    className="ml-auto border-purple-500/50 text-purple-400">
                    <Zap className="w-3 h-3 mr-1" />
                    Gemini AI
                  </Badge>
                )}
              </div>

              {/* Gemini Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="gemini-toggle"
                    className="text-sm font-medium">
                    Use Gemini AI
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    AI ranks hospitals by need & availability
                  </p>
                </div>
                <Switch
                  id="gemini-toggle"
                  checked={useGeminiSearch}
                  onCheckedChange={handleGeminiToggle}
                />
              </div>

              {/* Medical Needs Input */}
              <div className="space-y-2">
                <Label htmlFor="medical-needs" className="text-sm">
                  Medical Emergency Type
                </Label>
                <Input
                  id="medical-needs"
                  placeholder="e.g., cardiac emergency, trauma, stroke..."
                  value={medicalNeeds}
                  onChange={handleMedicalNeedsChange}
                  className="bg-background/50"
                  disabled={!useGeminiSearch}
                />
                <p className="text-xs text-muted-foreground">
                  {useGeminiSearch
                    ? "AI will find best hospitals for this condition"
                    : "Enable AI search to use this feature"}
                </p>
              </div>

              {useGeminiSearch && (
                <div className="flex items-start gap-2 text-xs text-purple-400 bg-purple-500/5 rounded p-2">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Gemini AI will analyze real hospitals, consider your medical
                    needs, and recommend the best option with detailed
                    reasoning.
                  </span>
                </div>
              )}
            </div>

            {/* Request Button */}
            <div className="text-center space-y-4">
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
          </div>
        );
    }
  };

  return (
    <aside className="w-full md:w-96 lg:w-[28rem] bg-card/95 backdrop-blur-sm border-r md:border-b-0 border-b flex flex-col p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 shadow-lg max-h-[40vh] md:max-h-none overflow-y-auto">
      <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold">
        <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg">
          <AlertCircle className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span>Emergency Dispatch</span>
      </div>
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      <div className="border-t pt-3 sm:pt-4 space-y-2">
        <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
          <Activity className="h-3 w-3 sm:h-4 sm:w-4" /> System Status
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <p className="text-xs sm:text-sm text-green-400 font-medium">
            All systems operational
          </p>
        </div>
      </div>
    </aside>
  );
}
