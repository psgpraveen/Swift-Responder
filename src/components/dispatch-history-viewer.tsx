"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import type { DispatchHistory } from "../lib/types";
import { Clock, MapPin, User, Activity } from "lucide-react";

interface DispatchHistoryViewerProps {
  history: DispatchHistory[];
}

export function DispatchHistoryViewer({ history }: DispatchHistoryViewerProps) {
  if (history.length === 0) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dispatch History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No dispatches yet. Recent emergency responses will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Dispatch History
          <Badge variant="secondary" className="ml-auto">
            {history.length} Total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {history.map((entry, index) => {
              const date = new Date(entry.timestamp);
              const timeAgo = getTimeAgo(entry.timestamp);

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-background/50 border border-white/10 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {entry.ambulance.vehicle}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            entry.outcome === "completed"
                              ? "bg-green-500/20 text-green-500 border-green-500/50"
                              : entry.outcome === "cancelled"
                              ? "bg-red-500/20 text-red-500 border-red-500/50"
                              : "bg-blue-500/20 text-blue-500 border-blue-500/50"
                          }>
                          {entry.outcome}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {date.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Driver:</span>
                      <span className="font-medium">
                        {entry.ambulance.driver?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{entry.duration} min</span>
                    </div>
                  </div>

                  {/* Hospital */}
                  <div className="flex items-start gap-1 text-xs">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">
                        Destination:
                      </span>
                      <p className="font-medium">{entry.hospital.name}</p>
                      <p className="text-muted-foreground">
                        {entry.hospital.address}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-1 text-muted-foreground italic">
                        {entry.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}
