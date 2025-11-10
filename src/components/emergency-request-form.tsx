"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  EmergencyType,
  EmergencySeverity,
  type EmergencyRequest,
  type PatientInfo,
} from "../lib/types";
import { Activity, AlertCircle, Clock, User } from "lucide-react";

interface EmergencyRequestFormProps {
  userLocation: { lat: number; lng: number };
  onSubmit: (request: EmergencyRequest) => void;
  isDispatching: boolean;
}

const emergencyTypeLabels: Record<EmergencyType, string> = {
  [EmergencyType.CARDIAC]: "Cardiac Emergency",
  [EmergencyType.TRAUMA]: "Trauma / Accident",
  [EmergencyType.STROKE]: "Stroke",
  [EmergencyType.RESPIRATORY]: "Respiratory Distress",
  [EmergencyType.PEDIATRIC]: "Pediatric Emergency",
  [EmergencyType.OBSTETRIC]: "Obstetric / Childbirth",
  [EmergencyType.PSYCHIATRIC]: "Psychiatric Emergency",
  [EmergencyType.OTHER]: "Other Emergency",
};

const severityColors = {
  [EmergencySeverity.CRITICAL]: "bg-red-500",
  [EmergencySeverity.URGENT]: "bg-orange-500",
  [EmergencySeverity.NON_URGENT]: "bg-yellow-500",
};

export function EmergencyRequestForm({
  userLocation,
  onSubmit,
  isDispatching,
}: EmergencyRequestFormProps) {
  const [emergencyType, setEmergencyType] = useState<EmergencyType>(
    EmergencyType.OTHER
  );
  const [severity, setSeverity] = useState<EmergencySeverity>(
    EmergencySeverity.URGENT
  );
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const patientInfo: PatientInfo = {
      age: patientAge ? parseInt(patientAge) : undefined,
      chiefComplaint: symptoms || undefined,
    };

    const request: EmergencyRequest = {
      id: `REQ-${Date.now()}`,
      type: emergencyType,
      severity,
      location: userLocation,
      timestamp: Date.now(),
      patientInfo,
      requestedBy: patientName || "Anonymous",
      status: "pending",
    };

    onSubmit(request);
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-500" />
          Emergency Request Form
        </CardTitle>
        <CardDescription>
          Provide details to help us dispatch the most appropriate ambulance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emergency Type */}
          <div className="space-y-2">
            <Label htmlFor="emergency-type" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Emergency Type
            </Label>
            <Select
              value={emergencyType}
              onValueChange={(value) =>
                setEmergencyType(value as EmergencyType)
              }>
              <SelectTrigger id="emergency-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(emergencyTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Severity Level
            </Label>
            <div className="flex gap-2">
              {Object.values(EmergencySeverity).map((sev) => (
                <Badge
                  key={sev}
                  variant={severity === sev ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    severity === sev ? severityColors[sev] : ""
                  }`}
                  onClick={() => setSeverity(sev)}>
                  {sev}
                </Badge>
              ))}
            </div>
          </div>

          {/* Patient Info */}
          <div className="space-y-2">
            <Label htmlFor="patient-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Name (Optional)
            </Label>
            <Input
              id="patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-age">Patient Age (Optional)</Label>
            <Input
              id="patient-age"
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder="Enter patient age"
              className="bg-background/50"
            />
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms (Optional)</Label>
            <Textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe current symptoms..."
              className="bg-background/50 min-h-[80px]"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other important information..."
              className="bg-background/50 min-h-[60px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            disabled={isDispatching}>
            {isDispatching ? (
              <>
                <span className="animate-pulse">Dispatching...</span>
              </>
            ) : (
              "Request Emergency Ambulance"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
