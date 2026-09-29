import { WeatherData } from '../types/index.js';

export class WeatherService {
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cacheTtlMs = 30 * 60 * 1000; // 30 minutes TTL

  async getWeatherData(
    lat: number,
    lng: number,
    killWeather: boolean = false
  ): Promise<{ data: WeatherData; fallbackUsed: boolean; fallbackReason?: string }> {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;

    // Chaos switch -> deterministic fallback
    if (killWeather) {
      return {
        data: {
          windSpeedMps: 0.8, // Calm wind default
          windDirectionDeg: 270,
          boundaryLayerHeightMeters: 450,
          relativeHumidity: 65,
          source: 'CLIMATOLOGY_DEFAULT'
        },
        fallbackUsed: true,
        fallbackReason: 'Chaos switch killWeather active; applied calm atmospheric default'
      };
    }

    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return { data: cached.data, fallbackUsed: false };
    }

    // Attempt live Open-Meteo call
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,relative_humidity_2m&hourly=boundary_layer_height&forecast_days=1`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json: any = await response.json();
        const current = json.current;
        const hourly = json.hourly;

        const windSpeedMps = current?.wind_speed_10m != null ? current.wind_speed_10m / 3.6 : 2.5; // convert km/h to m/s
        const windDirectionDeg = current?.wind_direction_10m != null ? current.wind_direction_10m : 280;
        const relativeHumidity = current?.relative_humidity_2m ?? 50;
        const boundaryLayerHeightMeters = hourly?.boundary_layer_height?.[0] ?? 600;

        const liveData: WeatherData = {
          windSpeedMps: Number(windSpeedMps.toFixed(1)),
          windDirectionDeg: Math.round(windDirectionDeg),
          boundaryLayerHeightMeters,
          relativeHumidity,
          source: 'OPEN_METEO_LIVE'
        };

        this.cache.set(cacheKey, { data: liveData, timestamp: Date.now() });
        return { data: liveData, fallbackUsed: false };
      }
    } catch {
      // Degrade gracefully
    }

    // Climatology Fallback
    const fallbackData: WeatherData = {
      windSpeedMps: 2.1,
      windDirectionDeg: 285,
      boundaryLayerHeightMeters: 550,
      relativeHumidity: 58,
      source: 'CLIMATOLOGY_DEFAULT'
    };

    return {
      data: fallbackData,
      fallbackUsed: true,
      fallbackReason: 'Open-Meteo API unavailable or timed out; defaulted to seasonal climatology'
    };
  }
}

export const weatherService = new WeatherService();
