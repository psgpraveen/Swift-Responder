# Quick Setup Guide - OpenWeatherMap API

## Why Add Weather Integration?

The weather service provides:

- **Safety Warnings**: Alert dispatchers about hazardous conditions
- **ETA Adjustments**: Add 5-15 minutes for bad weather
- **Real-Time Data**: Current temperature, wind, visibility
- **Professional UI**: Weather widget in dispatch sidebar

## Free Forever

OpenWeatherMap's free tier includes:

- ✅ 1,000 API calls per day (more than enough)
- ✅ Current weather data
- ✅ Weather alerts
- ✅ No credit card required

## Setup Steps (5 minutes)

### 1. Get Your Free API Key

1. Go to: https://openweathermap.org/api
2. Click "Sign Up" in the top right
3. Fill in:
   - Email
   - Username
   - Password
4. Verify your email (check inbox)
5. Log in to your account
6. Go to "API keys" tab
7. Copy your default API key (or create a new one)

### 2. Add to Your Project

Open `.env` file in your project root and add:

```env
# Existing Google Maps key (already have this)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD7N2udjsfAgk8UhCl5BrGfPUX2Sqr9RRg

# NEW: Add this line
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the key you copied.

### 3. Restart Dev Server

```bash
npm run dev
```

That's it! Weather will now show in the sidebar when you dispatch an ambulance.

## What You'll See

### Normal Weather:

```
☀️ 22°C
Clear sky
💨 12 km/h
Humidity: 65%
```

### Hazardous Weather:

```
🌧️ 18°C
Heavy rain
💨 45 km/h
⚠️ Warning: Heavy rain conditions. Response time may be increased. +8min
```

## Testing

1. Dispatch an ambulance
2. Look for "Current Conditions" section in sidebar
3. Should show real weather data for your location

## Optional: Skip Weather

If you don't want weather features:

- Simply don't add the API key
- Weather widget will be hidden automatically
- Everything else works normally

No errors or warnings!

## API Limits

Free tier allows **1,000 calls/day**:

- Weather updates every 10 minutes
- Max ~144 calls per day per user
- Can handle 7+ concurrent users easily

## Troubleshooting

**"Weather unavailable" showing?**

- Check API key is correct in `.env`
- Verify you restarted dev server after adding key
- Wait 10-15 minutes after signup (API key activation)

**Still not working?**

- Check browser console for errors
- Verify you copied the key correctly (no spaces)
- Try generating a new API key in OpenWeatherMap dashboard

## Cost: $0 Forever

- Free tier is permanent (not a trial)
- No automatic upgrades
- No credit card ever required
- Perfect for this project

---

**Already have OpenWeather key?** Just add it to `.env` and restart! 🚀
