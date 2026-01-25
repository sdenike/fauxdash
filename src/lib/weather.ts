export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface WeatherProvider {
  getWeather(location: string): Promise<WeatherData>;
}

class TempestWeatherProvider implements WeatherProvider {
  private apiKey: string;
  private stationId: string;

  constructor() {
    this.apiKey = process.env.TEMPEST_API_KEY || '';
    this.stationId = process.env.TEMPEST_STATION_ID || '';
  }

  async getWeather(location: string): Promise<WeatherData> {
    if (!this.apiKey || !this.stationId) {
      throw new Error('Tempest API key or station ID not configured');
    }

    const response = await fetch(
      `https://swd.weatherflow.com/swd/rest/observations/station/${this.stationId}?api_key=${this.apiKey}`
    );

    const data = await response.json();
    const obs = data.obs[0];

    return {
      location: location,
      temperature: obs.air_temperature,
      condition: this.mapCondition(obs.icon),
      icon: obs.icon,
      humidity: obs.relative_humidity,
      windSpeed: obs.wind_avg,
    };
  }

  private mapCondition(icon: string): string {
    // Map Tempest icons to readable conditions
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
}

class WeatherAPIProvider implements WeatherProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.WEATHERAPI_KEY || '';
  }

  async getWeather(location: string): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('WeatherAPI key not configured');
    }

    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${location}`
    );

    const data = await response.json();

    return {
      location: data.location.name,
      temperature: data.current.temp_f,
      condition: data.current.condition.text,
      icon: data.current.condition.icon,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_mph,
    };
  }
}

class OpenWeatherProvider implements WeatherProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_KEY || '';
  }

  async getWeather(location: string): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?zip=${location},us&appid=${this.apiKey}&units=imperial`
    );

    const data = await response.json();

    return {
      location: data.name,
      temperature: data.main.temp,
      condition: data.weather[0].main,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    };
  }
}

export const getWeatherProvider = (): WeatherProvider => {
  const provider = process.env.WEATHER_PROVIDER || 'weatherapi';

  switch (provider) {
    case 'tempest':
      return new TempestWeatherProvider();
    case 'openweather':
      return new OpenWeatherProvider();
    case 'weatherapi':
    default:
      return new WeatherAPIProvider();
  }
};
