import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json({ error: 'Location required' }, { status: 400 });
  }

  // Check cache
  const cacheKey = `weather:${location}`;
  const cached = await cacheGet(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Get session and fetch user settings
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'default';

    const db = getDb();
    const userSettings = await db.select().from(settings).where(eq(settings.userId, userId));
    const settingsObj: Record<string, string> = {};
    userSettings.forEach((setting: any) => {
      settingsObj[setting.key] = setting.value || '';
    });

    const provider = settingsObj.weatherProvider || process.env.WEATHER_PROVIDER || 'weatherapi';
    let weatherData: WeatherData;

    if (provider === 'tempest') {
      const apiKey = settingsObj.tempestApiKey || process.env.TEMPEST_API_KEY || '';
      const stationSerial = settingsObj.tempestStationId || process.env.TEMPEST_STATION_ID || '';

      if (!apiKey || !stationSerial) {
        throw new Error('Tempest API key or station ID not configured');
      }

      // First, get stations to find the device ID
      const stationsResponse = await fetch(
        `https://swd.weatherflow.com/swd/rest/stations?token=${apiKey}`
      );

      if (!stationsResponse.ok) {
        throw new Error(`Tempest API error: ${stationsResponse.status} ${stationsResponse.statusText}`);
      }

      const stationsData = await stationsResponse.json();

      // Find the device ID matching the station serial number
      let deviceId: number | null = null;
      for (const station of stationsData.stations || []) {
        for (const device of station.devices || []) {
          if (device.serial_number === stationSerial || device.device_id === parseInt(stationSerial)) {
            deviceId = device.device_id;
            break;
          }
        }
        if (deviceId) break;
      }

      if (!deviceId) {
        throw new Error(`Station ${stationSerial} not found in your Tempest account`);
      }

      // Now fetch observations using the device ID
      const obsResponse = await fetch(
        `https://swd.weatherflow.com/swd/rest/observations/device/${deviceId}?token=${apiKey}`
      );

      if (!obsResponse.ok) {
        throw new Error(`Tempest API error: ${obsResponse.status} ${obsResponse.statusText}`);
      }

      const obsData = await obsResponse.json();

      if (!obsData.obs || !obsData.obs[0]) {
        throw new Error('No observation data available from Tempest station');
      }

      const obs = obsData.obs[0];

      // Check if temperature and humidity are available
      const tempC = obs[7]; // air_temperature in Celsius at index 7
      const humidity = obs[8]; // relative_humidity at index 8
      const windMs = obs[2]; // wind_avg in m/s at index 2

      if (tempC === null || humidity === null) {
        throw new Error('Temperature or humidity sensors not reporting data. Check if your Tempest device is functioning properly.');
      }

      // Convert Celsius to Fahrenheit
      const tempF = (tempC * 9/5) + 32;
      // Convert m/s to mph
      const windMph = windMs * 2.237;

      weatherData = {
        location: location,
        temperature: tempF,
        condition: 'Clear', // Tempest doesn't provide condition directly
        icon: '', // No icon in device observations
        humidity: humidity,
        windSpeed: windMph,
      };
    } else if (provider === 'openweather') {
      const apiKey = settingsObj.openweatherKey || process.env.OPENWEATHER_KEY || '';

      if (!apiKey) {
        throw new Error('OpenWeather API key not configured');
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?zip=${location},us&appid=${apiKey}&units=imperial`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenWeather API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      weatherData = {
        location: data.name,
        temperature: data.main.temp,
        condition: data.weather[0].main,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      };
    } else {
      // weatherapi
      const apiKey = settingsObj.weatherapiKey || process.env.WEATHERAPI_KEY || '';

      if (!apiKey) {
        throw new Error('WeatherAPI key not configured');
      }

      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WeatherAPI error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      weatherData = {
        location: data.location.name,
        temperature: data.current.temp_f,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_mph,
      };
    }

    // Cache for 10 minutes
    await cacheSet(cacheKey, weatherData, 600);

    return NextResponse.json(weatherData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather data';
    console.error('Weather API error:', errorMessage, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function mapCondition(icon: string): string {
  const iconMap: Record<string, string> = {
    'clear-day': 'Clear',
    'clear-night': 'Clear',
    'cloudy': 'Cloudy',
    'partly-cloudy-day': 'Partly Cloudy',
    'partly-cloudy-night': 'Partly Cloudy',
    'rain': 'Rain',
    'snow': 'Snow',
    'wind': 'Windy',
  };
  return iconMap[icon] || 'Unknown';
}
