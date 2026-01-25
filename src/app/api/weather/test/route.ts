import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user?.id || 'default';
    const db = getDb();
    const userSettings = await db.select().from(settings).where(eq(settings.userId, userId));
    const settingsObj: Record<string, string> = {};
    userSettings.forEach((setting: any) => {
      settingsObj[setting.key] = setting.value || '';
    });

    const provider = settingsObj.weatherProvider || 'weatherapi';
    const testLocation = settingsObj.weatherLocations?.split(',')[0]?.trim() || '90210';

    let result: any = { success: false, provider, testLocation };

    if (provider === 'tempest') {
      const apiKey = settingsObj.tempestApiKey || '';
      const stationSerial = settingsObj.tempestStationId || '';

      if (!apiKey || !stationSerial) {
        return NextResponse.json({
          ...result,
          error: 'Tempest API key or station ID not configured'
        });
      }

      // First, get stations to find the device ID
      const stationsResponse = await fetch(
        `https://swd.weatherflow.com/swd/rest/stations?token=${apiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!stationsResponse.ok) {
        return NextResponse.json({
          ...result,
          error: `Tempest API error: ${stationsResponse.status} ${stationsResponse.statusText}`
        });
      }

      const stationsData = await stationsResponse.json();

      // Find the device ID matching the station serial number
      let deviceId: number | null = null;
      let stationName = '';
      for (const station of stationsData.stations || []) {
        for (const device of station.devices || []) {
          if (device.serial_number === stationSerial || device.device_id === parseInt(stationSerial)) {
            deviceId = device.device_id;
            stationName = station.name;
            break;
          }
        }
        if (deviceId) break;
      }

      if (!deviceId) {
        return NextResponse.json({
          ...result,
          error: `Station ${stationSerial} not found in your Tempest account. Available stations: ${stationsData.stations?.map((s: any) => s.devices.map((d: any) => d.serial_number).join(', ')).join('; ') || 'none'}`
        });
      }

      // Now fetch observations using the device ID
      const obsResponse = await fetch(
        `https://swd.weatherflow.com/swd/rest/observations/device/${deviceId}?token=${apiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!obsResponse.ok) {
        return NextResponse.json({
          ...result,
          error: `Tempest API error: ${obsResponse.status} ${obsResponse.statusText}`
        });
      }

      const obsData = await obsResponse.json();

      if (!obsData.obs || !obsData.obs[0]) {
        return NextResponse.json({
          ...result,
          error: 'No observation data available from Tempest station'
        });
      }

      const obs = obsData.obs[0];

      // Check if temperature and humidity are available
      const tempC = obs[7]; // air_temperature in Celsius at index 7
      const humidity = obs[8]; // relative_humidity at index 8
      const windMs = obs[2]; // wind_avg in m/s at index 2

      if (tempC === null || humidity === null) {
        return NextResponse.json({
          ...result,
          error: `Temperature or humidity sensors not reporting data from station "${stationName}". Your Tempest device may be offline or sensors may be malfunctioning. Check the Tempest app or website.`
        });
      }

      // Convert Celsius to Fahrenheit
      const tempF = Math.round((tempC * 9/5) + 32);
      // Convert m/s to mph
      const windMph = Math.round(windMs * 2.237 * 10) / 10;

      result.success = true;
      result.data = {
        station: stationName,
        temperature: tempF,
        humidity: humidity,
        windSpeed: windMph,
        timestamp: obs[0]
      };
    } else if (provider === 'openweather') {
      const apiKey = settingsObj.openweatherKey || '';

      if (!apiKey) {
        return NextResponse.json({
          ...result,
          error: 'OpenWeather API key not configured'
        });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?zip=${testLocation},us&appid=${apiKey}&units=imperial`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({
          ...result,
          error: `OpenWeather API error: ${errorData.message || response.statusText}`
        });
      }

      const data = await response.json();
      result.success = true;
      result.data = {
        location: data.name,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        condition: data.weather[0].main
      };
    } else {
      // weatherapi
      const apiKey = settingsObj.weatherapiKey || '';

      if (!apiKey) {
        return NextResponse.json({
          ...result,
          error: 'WeatherAPI key not configured'
        });
      }

      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${testLocation}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({
          ...result,
          error: `WeatherAPI error: ${errorData.error?.message || response.statusText}`
        });
      }

      const data = await response.json();
      result.success = true;
      result.data = {
        location: data.location.name,
        temperature: data.current.temp_f,
        humidity: data.current.humidity,
        condition: data.current.condition.text
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
    console.error('Weather test error:', errorMessage, error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
