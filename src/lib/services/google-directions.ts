"use client";

export interface RouteInfo {
  path: google.maps.LatLngLiteral[];
  distance: number; // in kilometers
  duration: number; // in minutes
  durationInTraffic?: number; // in minutes (with current traffic)
  polyline: string; // Encoded polyline
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  startLocation: google.maps.LatLngLiteral;
  endLocation: google.maps.LatLngLiteral;
}

/**
 * Get route directions between two points using Google Directions API
 */
export async function getRoute(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  options?: {
    departureTime?: Date;
    trafficModel?: google.maps.TrafficModel;
    mode?: google.maps.TravelMode;
  }
): Promise<RouteInfo> {
  try {
    const directionsService = new google.maps.DirectionsService();

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: options?.mode || google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: options?.departureTime || new Date(),
        trafficModel:
          options?.trafficModel || google.maps.TrafficModel.BEST_GUESS,
      },
      provideRouteAlternatives: false, // Get the fastest route only
    };

    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const leg = route.legs[0];

          // Extract path coordinates from route
          const path: google.maps.LatLngLiteral[] = [];
          leg.steps.forEach((step) => {
            step.path?.forEach((point) => {
              path.push({
                lat: point.lat(),
                lng: point.lng(),
              });
            });
          });

          // Extract turn-by-turn steps
          const steps: RouteStep[] = leg.steps.map((step) => ({
            instruction: step.instructions || "",
            distance: step.distance?.value || 0,
            duration: step.duration?.value || 0,
            startLocation: {
              lat: step.start_location.lat(),
              lng: step.start_location.lng(),
            },
            endLocation: {
              lat: step.end_location.lat(),
              lng: step.end_location.lng(),
            },
          }));

          const routeInfo: RouteInfo = {
            path,
            distance: (leg.distance?.value || 0) / 1000, // Convert to km
            duration: (leg.duration?.value || 0) / 60, // Convert to minutes
            durationInTraffic: leg.duration_in_traffic
              ? leg.duration_in_traffic.value / 60
              : undefined,
            polyline: route.overview_polyline || "",
            steps,
          };

          resolve(routeInfo);
        } else {
          console.error("Directions request failed:", status);
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error("Error getting route:", error);
    throw error;
  }
}

/**
 * Get multiple route alternatives between two points
 */
export async function getRouteAlternatives(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  maxAlternatives: number = 3
): Promise<RouteInfo[]> {
  try {
    const directionsService = new google.maps.DirectionsService();

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS,
      },
      provideRouteAlternatives: true,
    };

    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const routes: RouteInfo[] = [];

          result.routes.slice(0, maxAlternatives).forEach((route) => {
            const leg = route.legs[0];

            const path: google.maps.LatLngLiteral[] = [];
            leg.steps.forEach((step) => {
              step.path?.forEach((point) => {
                path.push({
                  lat: point.lat(),
                  lng: point.lng(),
                });
              });
            });

            const steps: RouteStep[] = leg.steps.map((step) => ({
              instruction: step.instructions || "",
              distance: step.distance?.value || 0,
              duration: step.duration?.value || 0,
              startLocation: {
                lat: step.start_location.lat(),
                lng: step.start_location.lng(),
              },
              endLocation: {
                lat: step.end_location.lat(),
                lng: step.end_location.lng(),
              },
            }));

            routes.push({
              path,
              distance: (leg.distance?.value || 0) / 1000,
              duration: (leg.duration?.value || 0) / 60,
              durationInTraffic: leg.duration_in_traffic
                ? leg.duration_in_traffic.value / 60
                : undefined,
              polyline: route.overview_polyline || "",
              steps,
            });
          });

          resolve(routes);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error("Error getting route alternatives:", error);
    throw error;
  }
}

/**
 * Calculate ETA considering current traffic
 */
export async function getETAWithTraffic(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<{
  eta: number; // minutes
  etaWithTraffic: number; // minutes
  distance: number; // km
  trafficDelay: number; // minutes
}> {
  try {
    const route = await getRoute(origin, destination, {
      departureTime: new Date(),
      trafficModel: google.maps.TrafficModel.BEST_GUESS,
    });

    const etaWithTraffic = route.durationInTraffic || route.duration;
    const trafficDelay = etaWithTraffic - route.duration;

    return {
      eta: route.duration,
      etaWithTraffic,
      distance: route.distance,
      trafficDelay,
    };
  } catch (error) {
    console.error("Error calculating ETA:", error);
    throw error;
  }
}

/**
 * Decode a Google Maps encoded polyline
 */
export function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}
