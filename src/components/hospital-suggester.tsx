"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getHospitalSuggestions, type State } from "../lib/actions";
import {
  BedDouble,
  HeartPulse,
  Loader2,
  AirVent,
  MapPin,
  Siren,
  Sparkles,
  Stethoscope,
  Baby,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Skeleton } from "./ui/skeleton";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="animate-spin mr-2" />
          AI is thinking...
        </>
      ) : (
        <>
          <Sparkles className="mr-2" />
          Get Suggestions
        </>
      )}
    </Button>
  );
}

export default function HospitalSuggester() {
  const initialState: State = { message: null, errors: {} };
  const [state, dispatch] = useFormState(getHospitalSuggestions, initialState);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="shadow-sm hover:shadow-md transition-shadow">
          <Sparkles className="mr-2 h-4 w-4" /> AI Hospital Finder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="bg-primary/10 p-2 rounded-lg">
              <HeartPulse className="text-primary h-6 w-6" />
            </div>
            AI Hospital Suggester
          </DialogTitle>
          <DialogDescription className="text-base">
            Find the best hospital based on your medical needs and location. Our
            AI analyzes real-time data on bed availability, ICU capacity, and
            more.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-lg">Your Details</h3>
            </div>
            <form
              action={dispatch}
              className="space-y-6 bg-muted/30 rounded-lg p-6 border">
              <div className="space-y-2">
                <Label htmlFor="needs" className="text-base font-medium">
                  Medical Need
                </Label>
                <Input
                  id="needs"
                  name="needs"
                  placeholder="e.g., Cardiac care, broken leg, emergency surgery"
                  required
                  className="h-11"
                />
                {state.errors?.needs && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <span className="font-bold">⚠</span> {state.errors.needs[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-medium">
                  Your Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Downtown Los Angeles, Mumbai Central"
                  required
                  className="h-11"
                />
                {state.errors?.location && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <span className="font-bold">⚠</span>{" "}
                    {state.errors.location[0]}
                  </p>
                )}
              </div>
              <SubmitButton />
              {state.message && !state.data && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {state.message}
                </p>
              )}
            </form>
          </div>
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-1 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-lg">Recommendations</h3>
              {state.data && state.data.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {state.data.length} found
                </Badge>
              )}
            </div>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-4">
                {state.data ? (
                  state.data.length > 0 ? (
                    <TooltipProvider>
                      {state.data.map((hospital, index) => (
                        <Card
                          key={hospital.name}
                          className="bg-card/60 backdrop-blur-sm hover:bg-card transition-colors border-2 hover:border-primary/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex justify-between items-start gap-2">
                              <div className="flex items-start gap-2">
                                <span className="text-2xl font-bold text-primary/40">
                                  #{index + 1}
                                </span>
                                <span className="flex-1">{hospital.name}</span>
                              </div>
                              <Badge
                                variant={
                                  hospital.suitabilityScore > 8
                                    ? "default"
                                    : hospital.suitabilityScore > 6
                                    ? "secondary"
                                    : "outline"
                                }
                                className={
                                  hospital.suitabilityScore > 8
                                    ? "bg-green-600 hover:bg-green-700"
                                    : hospital.suitabilityScore > 6
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : ""
                                }>
                                {hospital.suitabilityScore}/10
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-1">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="line-clamp-1">
                                {hospital.address}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 cursor-help">
                                    <BedDouble className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-lg">
                                      {hospital.availableBeds}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Beds
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Available hospital beds for patient
                                    admission
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 cursor-help">
                                    <HeartPulse className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-lg">
                                      {hospital.availableICUs}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ICUs
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Intensive Care Unit beds for critical
                                    patients
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 cursor-help">
                                    <Baby className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-lg">
                                      {hospital.availableNICUs}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      NICUs
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Neonatal Intensive Care Unit beds for
                                    newborns
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 cursor-help">
                                    <Siren className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-lg">
                                      {hospital.availableOxygenCylinders}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      O₂
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Available oxygen cylinders for respiratory
                                    support
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 cursor-help">
                                    <AirVent className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-lg">
                                      {hospital.availableVentilators}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Vents
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Mechanical ventilators for assisted
                                    breathing
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 cursor-help">
                                    <Stethoscope className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-lg">
                                      {hospital.availableDoctors}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Docs
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Number of doctors currently on duty</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground">
                                  Why recommended:
                                </span>{" "}
                                {hospital.reason}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TooltipProvider>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <HeartPulse className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No hospitals found. Try adjusting your search criteria.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <p className="text-muted-foreground">
                      Enter your details to find hospital recommendations
                      powered by AI.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
