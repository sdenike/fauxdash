# Driving Time Widget - Research Notes

## Overview

A proposed header widget that displays estimated driving time between home and work locations based on the user's schedule. Similar to the weather widget, it would show in the header with a popup for details.

## API Options

### 1. Google Maps Platform - Directions API

**Pros:**
- Most accurate real-time traffic data
- Well-documented, mature API
- Supports waypoints, alternatives, and departure time
- Excellent coverage worldwide

**Cons:**
- Expensive at scale ($5-10 per 1,000 requests)
- Requires billing account even for free tier
- Free tier: $200/month credit (~40,000 requests)

**Pricing (as of 2024):**
- Directions: $5.00 per 1,000 requests
- Directions (Advanced): $10.00 per 1,000 requests
- With traffic: Additional $5.00 per 1,000 requests

**API Example:**
```
GET https://maps.googleapis.com/maps/api/directions/json
  ?origin=place_id:ChIJ...
  &destination=place_id:ChIJ...
  &departure_time=now
  &traffic_model=best_guess
  &key=API_KEY
```

### 2. MapBox Directions API

**Pros:**
- Competitive pricing
- Good documentation
- Supports traffic data
- Free tier: 100,000 requests/month

**Cons:**
- Traffic data less accurate than Google in some regions
- Requires MapBox account

**Pricing:**
- Free: 100,000 requests/month
- Then: $0.60 per 1,000 requests

**API Example:**
```
GET https://api.mapbox.com/directions/v5/mapbox/driving-traffic
  /{longitude1},{latitude1};{longitude2},{latitude2}
  ?access_token=TOKEN
```

### 3. OpenRouteService

**Pros:**
- Open source
- Self-hostable option
- Free tier: 2,000 requests/day
- No credit card required

**Cons:**
- Less accurate traffic data
- Smaller coverage in some regions
- Rate limits on free tier

**Pricing:**
- Free: 2,000 requests/day
- Self-hosted: Free (requires infrastructure)

**API Example:**
```
GET https://api.openrouteservice.org/v2/directions/driving-car
  ?api_key=KEY
  &start={lon1},{lat1}
  &end={lon2},{lat2}
```

### 4. HERE Routing API

**Pros:**
- Good traffic data quality
- Competitive pricing
- Free tier: 250,000 requests/month

**Cons:**
- Complex API structure
- Requires HERE account

**Pricing:**
- Free: 250,000 requests/month
- Then: Volume-based pricing

**API Example:**
```
GET https://router.hereapi.com/v8/routes
  ?origin={lat1},{lon1}
  &destination={lat2},{lon2}
  &transportMode=car
  &return=summary
  &departureTime=now
  &apiKey=KEY
```

### 5. TomTom Routing API

**Pros:**
- Excellent traffic data
- Good global coverage
- Free tier: 2,500 requests/day

**Cons:**
- Complex pricing structure
- Requires TomTom account

## Recommendation

For a self-hosted dashboard like Faux|Dash, **MapBox** or **HERE** are recommended:

1. **MapBox**: Best balance of free tier (100k/month), pricing, and ease of use
2. **HERE**: Most generous free tier (250k/month) but more complex API
3. **OpenRouteService**: Best for privacy-conscious users (self-hostable)

Google Maps is excellent but expensive for personal use.

## Caching Strategy

To minimize API calls:

1. **Cache route data for 5-10 minutes**
   - Traffic patterns don't change second-by-second
   - Reduces API costs significantly

2. **Only fetch during relevant times**
   - Morning commute window: 1 hour before to 30 min after schedule start
   - Evening commute window: 30 min before to 1 hour after schedule end
   - Skip weekends if not in schedule

3. **Use departure_time parameter**
   - Enables predictive traffic (Google, MapBox)
   - More accurate than "now" for planning

4. **Store fallback duration**
   - Cache the "typical" duration
   - Show stale data with indicator if API fails

## Proposed Data Structure

```typescript
interface DrivingTimeSettings {
  enabled: boolean
  homeAddress: string
  homeLatitude: number
  homeLongitude: number
  workAddress: string
  workLatitude: number
  workLongitude: number
  apiProvider: 'google' | 'mapbox' | 'openroute' | 'here' | 'tomtom'
  apiKey: string
  schedule: {
    monday?: { start: string; end: string }
    tuesday?: { start: string; end: string }
    wednesday?: { start: string; end: string }
    thursday?: { start: string; end: string }
    friday?: { start: string; end: string }
    saturday?: { start: string; end: string }
    sunday?: { start: string; end: string }
  }
  cacheMinutes: number  // Default: 10
}

interface DrivingTimeData {
  direction: 'to_work' | 'to_home' | 'none'
  durationMinutes: number
  durationWithTraffic: number
  trafficDelay: number  // minutes of delay from traffic
  distance: number      // in miles or km
  fetchedAt: Date
  isStale: boolean
}
```

## UI/UX Considerations

### Header Display
- Show car icon + "25 min" when relevant
- Gray out or hide outside schedule
- Color code: green (normal), yellow (+10min delay), red (+20min delay)

### Hover Popup
- Show route summary
- Traffic conditions
- Departure recommendation
- "Leave by X to arrive on time"

### Settings UI
- Address inputs with geocoding
- Visual map preview of route
- Schedule editor (checkboxes + time pickers)
- API key input with test button
- Cache duration slider

## Implementation Phases

### Phase 1: Basic Implementation
- Settings UI with address inputs
- Single API provider (MapBox recommended)
- Basic caching
- Simple header display

### Phase 2: Enhanced Features
- Multiple provider support
- Schedule-aware display
- Traffic delay indicators
- "Leave now" recommendations

### Phase 3: Advanced
- Route alternatives
- Historical analysis
- Integration with calendar
- Push notifications (PWA)

## Security Considerations

1. **API Key Storage**
   - Store in database, not env vars (user-specific)
   - Encrypt at rest if possible

2. **Address Privacy**
   - Home/work addresses are sensitive
   - Consider hashing or encrypting in database

3. **Rate Limiting**
   - Implement server-side rate limiting
   - Prevent abuse of API quota

## Open Questions

1. Should we support multiple routes (work, gym, school)?
2. How to handle address validation/geocoding?
3. Should we show ETA or just duration?
4. Do we need historical data for pattern analysis?
5. Should this integrate with the existing weather location picker?

## References

- [Google Maps Directions API](https://developers.google.com/maps/documentation/directions)
- [MapBox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [OpenRouteService](https://openrouteservice.org/dev/#/api-docs)
- [HERE Routing API](https://developer.here.com/documentation/routing-api)
- [TomTom Routing API](https://developer.tomtom.com/routing-api)

---

**Status:** Research complete. Implementation deferred to future release.
**Last Updated:** January 2025
