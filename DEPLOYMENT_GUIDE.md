# Swift Responder - Deployment Guide

## 🎯 Overview

Swift Responder is a real-time ambulance dispatch system with AI-powered hospital recommendations using Gemini AI, Google Maps integration, and live location tracking.

## ✅ All Issues Resolved

### 1. **Infinite Loop Error - FIXED ✓**

**Problem:** "Maximum update depth exceeded" caused by Switch component re-renders

**Root Cause:**

- Setter functions from `useState` were being recreated on every render
- This caused infinite loops when passed to child components

**Solution Applied:**

- **Hook Level** (`use-ambulance-tracker.ts`):
  - Wrapped `setUseGeminiSearch` and `setMedicalNeeds` in `useCallback` with empty dependency arrays
  - Created refs (`useGeminiSearchRef`, `medicalNeedsRef`) to avoid stale closures
  - Updated refs in `useEffect` when state changes
  - Modified `dispatchAmbulance` to use ref values instead of state values
- **Component Level** (`sidebar.tsx`):
  - Created stable handlers `handleGeminiToggle` and `handleMedicalNeedsChange`
  - Used empty dependency arrays (since setter functions are already stable from hook)
  - Updated Switch and Input components to use stable handlers

**Files Modified:**

- `src/hooks/use-ambulance-tracker.ts` - Added refs and stable setters
- `src/components/sidebar.tsx` - Added useCallback import and stable handlers

### 2. **Hydration Mismatch Warning - FIXED ✓**

**Problem:** Browser extensions (like Grammarly) adding attributes to body tag causing hydration mismatch

**Solution Applied:**

- Added `suppressHydrationWarning` to body tag in `src/app/layout.tsx`
- This prevents React from warning about attributes added by browser extensions

**Files Modified:**

- `src/app/layout.tsx` - Added suppressHydrationWarning prop

### 3. **useMap() Context Error - FIXED ✓**

**Problem:** `useMap(): failed to retrieve APIProviderContext`

**Solution Applied:**

- Created `MapController` component that properly accesses map context inside APIProvider
- Used callback pattern to pass map instance to parent component
- Moved map instance retrieval inside the APIProvider wrapper

**Files Modified:**

- `src/components/ambulance-map-enhanced.tsx`

### 4. **useActionState Deprecation - FIXED ✓**

**Problem:** React 19 deprecated `useFormState` in favor of `useActionState`

**Solution Applied:**

- Changed import from `react-dom` to `react`
- Updated hook name from `useFormState` to `useActionState`

**Files Modified:**

- `src/components/hospital-suggester.tsx`

## 🚀 Features Implemented

### ✅ **Completed Features:**

1. **Google Places API Integration**

   - Real-time hospital search within radius
   - Hospital details (ratings, opening hours, contact info)
   - Distance calculations

2. **Google Directions API Integration**

   - Real road directions with turn-by-turn navigation
   - Traffic-aware ETA calculations
   - Route optimization

3. **Gemini AI Hospital Finder**

   - AI-powered hospital ranking based on medical needs
   - Intelligent analysis of hospital suitability
   - Detailed reasoning for recommendations
   - Severity-based prioritization

4. **IndexedDB Integration**

   - Persistent dispatch history storage
   - Better performance than localStorage
   - Larger storage capacity

5. **Real-Time Weather Integration**

   - Current weather conditions
   - Weather impact analysis on ambulance dispatch
   - Delay warnings for adverse conditions

6. **Traffic Data Integration**

   - Google Maps Traffic Layer
   - Real-time traffic-aware ETAs
   - Optimal route suggestions

7. **Live Location Tracking**
   - Continuous GPS tracking
   - Location accuracy indicators
   - Speed and heading information
   - Auto-refresh capabilities

### 🔄 **Pending Features:**

1. **Geofencing for Arrival Detection**

   - Accurate detection when ambulance arrives at hospital
   - Boundary-based arrival confirmation

2. **Emergency Contact Integration**

   - Access device contacts
   - Auto-notify emergency contacts on dispatch

3. **Enhanced AI with Real Data**
   - Patient medical history integration
   - Real-time hospital capacity data
   - Improved Genkit AI flow

## 📋 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### API Keys Setup

1. **Google Maps API Key:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API, Places API, Directions API
   - Create API key and restrict it appropriately

2. **Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create API key for Gemini model access

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js app directory
│   ├── page.tsx                  # Main application page
│   ├── layout.tsx                # Root layout with hydration fix
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── sidebar.tsx               # Dispatch control sidebar (with fixed handlers)
│   ├── ambulance-map-enhanced.tsx # Google Maps integration (with MapController fix)
│   ├── hospital-suggester.tsx    # AI hospital suggestions (useActionState fix)
│   ├── weather-widget.tsx        # Weather display
│   └── ui/                       # Reusable UI components
├── hooks/                        # Custom React hooks
│   ├── use-ambulance-tracker.ts  # Main dispatch logic (with refs and stable setters)
│   ├── use-live-location.ts      # GPS tracking
│   ├── use-notification-sound.ts # Sound notifications
│   └── use-toast.ts              # Toast notifications
├── lib/                          # Utility libraries
│   ├── services/
│   │   ├── gemini-hospital-finder.ts  # AI hospital search
│   │   ├── google-directions.ts       # Route calculations
│   │   ├── google-places.ts           # Hospital search
│   │   ├── indexeddb.ts               # Persistent storage
│   │   └── weather.ts                 # Weather API
│   ├── types.ts                  # TypeScript types
│   ├── utils.ts                  # Helper functions
│   └── mock-data.ts              # Mock ambulance data
└── ai/                           # AI flows
    └── flows/
        └── suggest-best-hospitals.ts # Genkit AI flow
```

## 🔧 Configuration

### TypeScript Configuration

- Target: ES2017
- Strict mode: Disabled (for faster development)
- Module: ESNext with bundler resolution

### Next.js Configuration

- Framework: Next.js 15.3.3
- React: 19
- App Router architecture

## 🎨 Key Technologies

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Maps:** Google Maps JavaScript API, @vis.gl/react-google-maps
- **AI:** Google Gemini 2.5 Flash via Genkit
- **APIs:** Google Places API, Google Directions API, OpenWeatherMap
- **Storage:** IndexedDB for persistent data
- **UI:** Radix UI components, Lucide icons

## 🐛 Debugging Tips

### If you encounter infinite loops:

1. Check that all setter functions are wrapped in `useCallback`
2. Verify dependency arrays don't include unstable functions
3. Use React DevTools Profiler to identify render loops

### If you encounter hydration mismatches:

1. Ensure `suppressHydrationWarning` is on body tag
2. Avoid using `Date.now()` or `Math.random()` during SSR
3. Check for browser extension interference

### If maps don't load:

1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env`
2. Check API key has required APIs enabled
3. Ensure APIProvider wraps all map components

## 📊 Performance Optimizations

1. **Memoization:**

   - All setter functions use `useCallback`
   - Expensive calculations use `useMemo`
   - Component re-renders minimized

2. **Code Splitting:**

   - Dynamic imports for heavy components
   - Lazy loading of map components

3. **API Efficiency:**
   - Debounced location updates
   - Cached API responses
   - Optimized search radius

## 🚢 Deployment Checklist

- [x] All infinite loop errors resolved
- [x] Hydration warnings suppressed
- [x] useMap() context errors fixed
- [x] React 19 compatibility ensured
- [x] Environment variables configured
- [x] API keys validated
- [x] Build succeeds without errors
- [x] All critical features functional
- [ ] Performance testing completed
- [ ] Error boundaries implemented
- [ ] Analytics integrated (optional)
- [ ] PWA features added (optional)

## 🌐 Deployment Platforms

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

- **Netlify:** Compatible with Next.js
- **AWS Amplify:** Full Next.js support
- **Digital Ocean App Platform:** Docker-based deployment

## 📝 Notes

1. **Gemini AI Search Toggle:** Users can enable/disable AI-powered hospital ranking
2. **Medical Needs Input:** Provide specific medical emergency type for better AI recommendations
3. **Live Location:** Enable GPS for accurate real-time tracking
4. **Weather Impact:** System automatically analyzes weather conditions for dispatch delays

## 🔒 Security Considerations

1. API keys are environment variables (never commit to git)
2. Client-side API keys are restricted by domain
3. Server-side API calls use secure server actions
4. IndexedDB data is client-side only (no sensitive data)

## 📞 Support

For issues or questions:

1. Check this deployment guide
2. Review error logs in browser console
3. Verify environment variable configuration
4. Test with mock data first before live APIs

---

## 🎉 Status: DEPLOYMENT READY

All critical errors have been resolved. The application is stable and ready for deployment.

**Last Updated:** November 11, 2025
