"use client";

import { useState, useEffect, useCallback } from "react";

export interface LiveLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export function useLiveLocation(options?: PositionOptions) {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Check if geolocation is supported
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setError({
        code: 0,
        message: "Geolocation is not supported by your browser",
      });
      setIsLoading(false);
    }
  }, []);

  // Success callback
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;

    setLocation({
      lat: latitude,
      lng: longitude,
      accuracy,
      heading: heading,
      speed: speed,
      timestamp: position.timestamp,
    });
    setError(null);
    setIsLoading(false);
  }, []);

  // Error callback
  const handleError = useCallback((error: GeolocationPositionError) => {
    const errorMessages: Record<number, string> = {
      1: "Location permission denied. Please allow location access.",
      2: "Location information unavailable.",
      3: "Location request timed out.",
    };

    setError({
      code: error.code,
      message: errorMessages[error.code] || "An unknown error occurred",
    });
    setIsLoading(false);
  }, []);

  // Start watching location
  useEffect(() => {
    if (!isSupported) return;

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );

    // Watch position for continuous updates
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );

    setWatchId(id);

    // Cleanup
    return () => {
      if (id !== null) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [isSupported, handleSuccess, handleError, options]);

  // Manual refresh
  const refresh = useCallback(() => {
    if (!isSupported) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    });
  }, [isSupported, handleSuccess, handleError, options]);

  // Stop watching
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  return {
    location,
    error,
    isLoading,
    isSupported,
    refresh,
    stopWatching,
    isWatching: watchId !== null,
  };
}
