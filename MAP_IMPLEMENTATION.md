# Map Implementation & Live Location Tracking

## 📍 Overview

The Swift Responder application features a sophisticated map implementation using Google Maps with real-time ambulance tracking and live user location monitoring.

---

## 🗺️ Map Components

### 1. **AmbulanceMap** (Basic)

**File:** `src/components/ambulance-map.tsx`

**Features:**

- ✅ Google Maps integration via `@vis.gl/react-google-maps`
- ✅ User location marker (red pin)
- ✅ Hospital markers (green hospital icon)
- ✅ Ambulance markers with status indicators
- ✅ Route polyline showing path to hospital
- ✅ Animated ambulance pulsing when dispatched
- ✅ Custom styling with map ID

**Usage:**

```tsx
<AmbulanceMap
  userLocation={{ lat: 34.0522, lng: -118.2437 }}
  ambulances={ambulances}
  dispatchedAmbulance={dispatchedAmbulance}
  destinationHospital={destinationHospital}
  route={route}
/>
```

### 2. **AmbulanceMapEnhanced** (Advanced)

**File:** `src/components/ambulance-map-enhanced.tsx`

**Enhanced Features:**

- ✅ All basic map features
- ✅ **Live location tracking** with accuracy circle
- ✅ **Zoom controls** (in/out buttons)
- ✅ **Center on user** button
- ✅ **Fit all markers** button
- ✅ **Map type toggle** (roadmap/satellite/hybrid)
- ✅ **Status badges** (zoom level, accuracy, live tracking status)
- ✅ **Auto-follow mode** for user location
- ✅ **Accuracy visualization** (blue circle around user)
- ✅ **Ambulance labels** with driver names
- ✅ **Enhanced markers** with drop shadows and animations

**Usage:**

```tsx
<AmbulanceMapEnhanced
  userLocation={userLocation}
  ambulances={ambulances}
  dispatchedAmbulance={dispatchedAmbulance}
  destinationHospital={destinationHospital}
  route={route}
  locationAccuracy={50} // meters
  isLiveLocationEnabled={true}
  onLocationRefresh={refreshLocation}
/>
```

---

## 📡 Live Location Tracking

### **useLiveLocation Hook**

**File:** `src/hooks/use-live-location.ts`

**Features:**

- ✅ **Geolocation API** integration
- ✅ **Continuous tracking** via `watchPosition`
- ✅ **High accuracy mode** enabled by default
- ✅ **Error handling** with user-friendly messages
- ✅ **Permission management**
- ✅ **Location data:**
  - Latitude/Longitude
  - Accuracy (meters)
  - Heading (direction)
  - Speed (m/s)
  - Timestamp

**API:**

```typescript
const {
  location, // Current location data
  error, // Error object if any
  isLoading, // Initial load state
  isSupported, // Browser support check
  refresh, // Manual refresh function
  stopWatching, // Stop location updates
  isWatching, // Currently watching status
} = useLiveLocation(options);
```

**Location Object:**

```typescript
interface LiveLocation {
  lat: number;
  lng: number;
  accuracy?: number; // Accuracy in meters
  heading?: number | null; // Direction (0-359 degrees)
  speed?: number | null; // Speed in m/s
  timestamp: number; // Unix timestamp
}
```

**Options:**

```typescript
interface PositionOptions {
  enableHighAccuracy?: boolean; // Default: true
  timeout?: number; // Default: 10000ms
  maximumAge?: number; // Default: 0 (no cache)
}
```

---

## 🚀 Implementation Guide

### **Basic Setup (Static Location)**

1. **Add Google Maps API Key:**

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

2. **Use in Page:**

```tsx
import AmbulanceMap from "@/components/ambulance-map";
import { useAmbulanceTracker } from "@/hooks/use-ambulance-tracker";

export default function Page() {
  const { ambulances, userLocation, ... } = useAmbulanceTracker();

  return (
    <AmbulanceMap
      userLocation={userLocation}
      ambulances={ambulances}
      {...otherProps}
    />
  );
}
```

### **Advanced Setup (Live Location)**

1. **Import Enhanced Components:**

```tsx
import AmbulanceMapEnhanced from "@/components/ambulance-map-enhanced";
import { useLiveLocation } from "@/hooks/use-live-location";
```

2. **Request Location:**

```tsx
const { location, error, isLoading } = useLiveLocation({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
});

// Use live location if available
const userLocation = location
  ? { lat: location.lat, lng: location.lng }
  : defaultLocation;
```

3. **Render Enhanced Map:**

```tsx
<AmbulanceMapEnhanced
  userLocation={userLocation}
  locationAccuracy={location?.accuracy}
  isLiveLocationEnabled={!!location}
  onLocationRefresh={refresh}
  {...otherProps}
/>
```

### **Complete Example**

See: `src/app/live-tracking-demo.tsx` for a full implementation with:

- Live location toggle
- Error handling
- Toast notifications
- Status indicators
- Manual refresh

---

## 🎨 Map Customization

### **Custom Map Styling**

The map uses a custom Map ID for styling. Configure in Google Cloud Console:

1. Go to Google Cloud Console
2. Navigate to Maps → Map Styles
3. Create a new Map ID: `swift-responder-map`
4. Apply custom styling (dark theme recommended)

### **Marker Customization**

**User Location:**

```tsx
<AdvancedMarker position={userLocation}>
  <MapPin className="text-red-500 w-8 h-8" fill="currentColor" />
</AdvancedMarker>
```

**Ambulance with Animation:**

```tsx
<AdvancedMarker position={ambulance.location}>
  <AmbulanceIcon
    className={cn("w-10 h-10", isDispatched && "animate-pulse scale-110")}
  />
</AdvancedMarker>
```

**Hospital with Label:**

```tsx
<AdvancedMarker position={hospital.location}>
  <div className="flex flex-col items-center">
    <HospitalIcon className="w-8 h-8" />
    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-md">
      {hospital.name}
    </div>
  </div>
</AdvancedMarker>
```

---

## 🔧 Technical Details

### **Distance Calculation**

Uses Haversine formula for accurate distance:

```typescript
// src/lib/utils.ts
export function haversineDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius in km
  // ... calculation
  return distance; // in kilometers
}
```

### **Ambulance Movement Simulation**

```typescript
// Update every 1 second
setInterval(() => {
  // Calculate direction to destination
  const latDiff = destination.lat - current.lat;
  const lngDiff = destination.lng - current.lng;

  // Move 10% closer each update
  const newLat = current.lat + latDiff * 0.1;
  const newLng = current.lng + lngDiff * 0.1;

  // Update ambulance location
  updateLocation({ lat: newLat, lng: newLng });
}, 1000);
```

### **ETA Calculation**

```typescript
const AVERAGE_SPEED_KM_PER_MIN = 0.8; // ~48 km/h

const calculateETA = (distance: number) => {
  return Math.round(distance / AVERAGE_SPEED_KM_PER_MIN);
};
```

---

## 📊 Performance Optimization

### **Location Updates**

- **High Accuracy Mode:** GPS + WiFi + Cell towers
- **Update Interval:** Continuous (watchPosition)
- **Timeout:** 10 seconds
- **Maximum Age:** 0 (no cache)

### **Map Rendering**

- **Markers:** React components (efficient updates)
- **Polyline:** Native Google Maps overlay
- **Gesture Handling:** "greedy" (no scroll capture)
- **Default UI:** Disabled (custom controls)

### **Memory Management**

```typescript
// Cleanup on unmount
useEffect(() => {
  const id = navigator.geolocation.watchPosition(...);

  return () => {
    navigator.geolocation.clearWatch(id);
  };
}, []);
```

---

## 🛡️ Security & Privacy

### **Location Permissions**

```typescript
// Request permission
if (Notification.permission === "default") {
  await Notification.requestPermission();
}

// Handle permission denied
if (error.code === 1) {
  // PERMISSION_DENIED
  showError("Location permission required");
}
```

### **Data Privacy**

- ✅ Location data stays in browser
- ✅ No server transmission (unless explicitly implemented)
- ✅ User can disable live tracking
- ✅ Clear permission prompts
- ✅ No location history stored

---

## 🐛 Troubleshooting

### **Map Not Loading**

1. **Check API Key:**

```bash
# Verify in .env.local
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

2. **Enable Required APIs:**

   - Maps JavaScript API
   - Places API (optional)
   - Directions API (if using routes)

3. **Check API Key Restrictions:**
   - Website restrictions: `localhost:*`, `your-domain.com`
   - API restrictions: Enable Maps JavaScript API

### **Location Not Working**

1. **HTTPS Required:**

   - Geolocation only works on HTTPS or localhost
   - Deploy to Vercel/Netlify for HTTPS

2. **Check Browser Support:**

```typescript
if (!("geolocation" in navigator)) {
  console.error("Geolocation not supported");
}
```

3. **Permission Issues:**
   - Check browser settings
   - Try different browser
   - Clear site data and retry

### **Markers Not Showing**

1. **Check Coordinates:**

```typescript
console.log("Location:", location);
// Should be: { lat: number, lng: number }
```

2. **Verify API Key Scope:**
   - Advanced Markers require Maps JavaScript API
   - Check API quotas

---

## 📱 Mobile Considerations

### **Touch Gestures**

```tsx
<Map gestureHandling="greedy">
  {/* No scroll capture, full touch support */}
</Map>
```

### **Responsive Design**

```tsx
<div className="w-full h-screen md:h-[calc(100vh-64px)]">
  <AmbulanceMapEnhanced {...props} />
</div>
```

### **Battery Optimization**

- Use `maximumAge` to reduce GPS updates
- Lower accuracy for better battery life
- Stop watching when not needed

---

## 🔮 Future Enhancements

### **Planned Features**

1. **Route Optimization** - Google Directions API integration
2. **Traffic Layers** - Real-time traffic overlay
3. **Heatmaps** - Emergency density visualization
4. **Clustering** - Group nearby ambulances
5. **Street View** - Hospital entrance preview
6. **Offline Maps** - Cache tiles for offline use
7. **AR View** - Augmented reality navigation
8. **Voice Navigation** - Turn-by-turn audio guidance

---

## 📚 Dependencies

```json
{
  "@vis.gl/react-google-maps": "^1.1.0",
  "@types/google.maps": "^3.55.11",
  "lucide-react": "^0.475.0"
}
```

---

## 🎯 Key Achievements

- ✅ Real-time ambulance tracking
- ✅ Live user location with high accuracy
- ✅ Smooth animations and transitions
- ✅ Custom markers and styling
- ✅ Route visualization
- ✅ Comprehensive error handling
- ✅ Mobile-optimized
- ✅ Performance-optimized
- ✅ Privacy-focused
- ✅ Accessibility-ready

---

_Last Updated: November 11, 2025_
_Project: Swift Responder - Real-time Ambulance Dispatch System_
