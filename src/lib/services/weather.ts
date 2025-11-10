"use client";

export interface WeatherData {
  temperature: number; // Celsius
  condition: string; // e.g., "Clear", "Rain", "Snow"
  description: string; // e.g., "light rain"
  humidity: number; // percentage
  windSpeed: number; // km/h
  visibility: number; // meters
  icon: string; // Weather icon code
  alerts?: WeatherAlert[];
  isHazardous: boolean; // Weather may affect ambulance dispatch
}

export interface WeatherAlert {
  event: string;
  severity: "minor" | "moderate" | "severe" | "extreme";
  description: string;
  start: number; // timestamp
  end: number; // timestamp
}

/**
 * Get current weather data for a location using OpenWeatherMap API
 * Note: Requires NEXT_PUBLIC_OPENWEATHER_API_KEY in .env file
 */
export async function getCurrentWeather(
  location: { lat: number; lng: number }
): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      console.warn("OpenWeather API key not found. Weather features disabled.");
      return null;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for hazardous conditions
    const hazardousConditions = [
      "thunderstorm",
      "snow",
      "heavy rain",
      "fog",
      "tornado",
      "hurricane",
    ];
    const isHazardous =
      hazardousConditions.some((condition) =>
        data.weather[0].description.toLowerCase().includes(condition)
      ) ||
      data.wind.speed > 50 || // Strong winds (km/h)
      data.visibility < 1000; // Poor visibility (meters)

    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      visibility: data.visibility,
      icon: data.weather[0].icon,
      isHazardous,
    };

    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

/**
 * Get weather alerts for a location
 */
export async function getWeatherAlerts(
  location: { lat: number; lng: number }
): Promise<WeatherAlert[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return [];
    }

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${location.lat}&lon=${location.lng}&exclude=minutely,hourly,daily&appid=${apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.alerts) {
      return [];
    }

    return data.alerts.map((alert: any) => ({
      event: alert.event,
      severity: mapSeverity(alert.tags?.[0]),
      description: alert.description,
      start: alert.start * 1000,
      end: alert.end * 1000,
    }));
  } catch (error) {
    console.error("Error fetching weather alerts:", error);
    return [];
  }
}

/**
 * Map alert severity from API to our severity levels
 */
function mapSeverity(apiSeverity?: string): WeatherAlert["severity"] {
  if (!apiSeverity) return "moderate";
  
  const severity = apiSeverity.toLowerCase();
  if (severity.includes("extreme")) return "extreme";
  if (severity.includes("severe")) return "severe";
  if (severity.includes("moderate")) return "moderate";
  return "minor";
}

/**
 * Get weather icon URL from OpenWeatherMap
 */
export function getWeatherIconUrl(iconCode: string, size: "1x" | "2x" | "4x" = "2x"): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

/**
 * Check if weather conditions may affect ambulance dispatch
 */
export function analyzeWeatherImpact(weather: WeatherData): {
  canDispatch: boolean;
  warning?: string;
  estimatedDelay?: number; // in minutes
} {
  // Critical conditions that may prevent dispatch
  if (weather.visibility < 500) {
    return {
      canDispatch: false,
      warning: "Extremely poor visibility. Dispatch may be delayed until conditions improve.",
      estimatedDelay: 15,
    };
  }

  // Hazardous conditions that may slow response
  if (weather.isHazardous) {
    let warning = "";
    let estimatedDelay = 0;

    if (weather.condition.toLowerCase().includes("thunderstorm")) {
      warning = "Thunderstorm in area. Ambulance may take longer route for safety.";
      estimatedDelay = 10;
    } else if (weather.condition.toLowerCase().includes("snow")) {
      warning = "Snow conditions. Response time may be increased.";
      estimatedDelay = 15;
    } else if (weather.visibility < 1000) {
      warning = "Poor visibility. Driver will proceed with caution.";
      estimatedDelay = 5;
    } else if (weather.windSpeed > 50) {
      warning = "Strong winds. Ambulance will take extra precautions.";
      estimatedDelay = 5;
    } else {
      warning = "Hazardous weather conditions detected. ETA may be affected.";
      estimatedDelay = 8;
    }

    return {
      canDispatch: true,
      warning,
      estimatedDelay,
    };
  }

  // Normal conditions
  return {
    canDispatch: true,
  };
}
