"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  AlertTriangle,
} from "lucide-react";
import {
  getCurrentWeather,
  analyzeWeatherImpact,
  type WeatherData,
} from "../lib/services/weather";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

interface WeatherWidgetProps {
  location: { lat: number; lng: number };
  showImpactAnalysis?: boolean;
}

export function WeatherWidget({
  location,
  showImpactAnalysis = false,
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWeather() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCurrentWeather(location);

        if (mounted) {
          setWeather(data);
        }
      } catch (err) {
        if (mounted) {
          setError("Weather unavailable");
          console.error("Weather fetch error:", err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [location]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Cloud className="w-4 h-4" />
        <span>Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return null; // Don't show anything if weather is unavailable
  }

  const getWeatherIcon = () => {
    const condition = weather.condition.toLowerCase();
    if (condition.includes("rain")) return <CloudRain className="w-5 h-5" />;
    if (condition.includes("snow")) return <CloudSnow className="w-5 h-5" />;
    if (condition.includes("cloud")) return <Cloud className="w-5 h-5" />;
    return <Sun className="w-5 h-5" />;
  };

  const impact = showImpactAnalysis ? analyzeWeatherImpact(weather) : null;

  return (
    <div className="space-y-2">
      {/* Weather Display */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="text-primary">{getWeatherIcon()}</div>
          <div>
            <p className="text-sm font-medium">{weather.temperature}°C</p>
            <p className="text-xs text-muted-foreground capitalize">
              {weather.description}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            <span>{weather.windSpeed} km/h</span>
          </div>
          <div>Humidity: {weather.humidity}%</div>
        </div>
      </div>

      {/* Weather Impact Warning */}
      {impact && impact.warning && showImpactAnalysis && (
        <Alert variant={weather.isHazardous ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <div className="flex items-center justify-between">
              <span>{impact.warning}</span>
              {impact.estimatedDelay && (
                <Badge variant="outline" className="ml-2">
                  +{impact.estimatedDelay}min
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
