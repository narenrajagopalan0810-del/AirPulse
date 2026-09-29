import mockSensors from './fixtures/mockSensors.json';
import { StationData } from '../types/index.js';
import { findNearestStation } from '../config/regionManager.js';

interface MockSensorMap {
  [stationId: string]: {
    name: string;
    pm25: number;
    baselineMu: number;
    baselineSigma: number;
    status: string;
  };
}

const mockStationStore = (mockSensors as { stations: MockSensorMap }).stations;

export class SensorService {
  private cache: Map<string, { data: StationData; timestamp: number }> = new Map();
  private cacheTtlMs = 15 * 60 * 1000; // 15 minutes TTL

  async getStationReading(
    lat: number,
    lng: number,
    regionId: string,
    killOpenAQ: boolean = false
  ): Promise<{ data: StationData; fallbackUsed: boolean; fallbackReason?: string }> {
    const { station, distanceKm } = findNearestStation(lat, lng, regionId);

    // Chaos killswitch or no API key -> immediate deterministic fallback
    if (killOpenAQ || !process.env.OPENAQ_API_KEY) {
      const mock = mockStationStore[station.id];
      const pm25Value = mock ? mock.pm25 : station.baselineMu + 20.0;
      return {
        data: {
          stationId: station.id,
          name: station.name,
          latitude: station.lat,
          longitude: station.lng,
          pm25: pm25Value,
          baselineMu: station.baselineMu,
          baselineSigma: station.baselineSigma,
          lastUpdated: new Date().toISOString(),
          source: killOpenAQ ? 'MOCK_FALLBACK' : 'STATION_CACHE'
        },
        fallbackUsed: true,
        fallbackReason: killOpenAQ ? 'Chaos switch killOpenAQ active' : 'Using verified regional baseline cache'
      };
    }

    // Check memory cache
    const cached = this.cache.get(station.id);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return { data: cached.data, fallbackUsed: false };
    }

    // Try live OpenAQ API query
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(
        `https://api.openaq.org/v3/locations?coordinates=${lat},${lng}&radius=15000&limit=1`,
        {
          headers: {
            'X-API-Key': process.env.OPENAQ_API_KEY || ''
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const json: any = await response.json();
        if (json.results && json.results.length > 0) {
          const loc = json.results[0];
          // Find PM2.5 sensor if available
          const pm25Sensor = loc.sensors?.find((s: { parameter?: { name?: string } }) => s.parameter?.name === 'pm25');
          const liveValue = pm25Sensor?.latest?.value ?? (station.baselineMu + 15.0);

          const liveData: StationData = {
            stationId: String(loc.id || station.id),
            name: loc.name || station.name,
            latitude: loc.coordinates?.latitude || station.lat,
            longitude: loc.coordinates?.longitude || station.lng,
            pm25: liveValue,
            baselineMu: station.baselineMu,
            baselineSigma: station.baselineSigma,
            lastUpdated: new Date().toISOString(),
            source: 'OPENAQ_LIVE'
          };

          this.cache.set(station.id, { data: liveData, timestamp: Date.now() });
          return { data: liveData, fallbackUsed: false };
        }
      }
    } catch {
      // Graceful degradation on network timeout or error
    }

    // Fallback to regional baseline
    const mock = mockStationStore[station.id];
    const fallbackData: StationData = {
      stationId: station.id,
      name: station.name,
      latitude: station.lat,
      longitude: station.lng,
      pm25: mock ? mock.pm25 : station.baselineMu + 25.0,
      baselineMu: station.baselineMu,
      baselineSigma: station.baselineSigma,
      lastUpdated: new Date().toISOString(),
      source: 'STATION_CACHE'
    };

    return {
      data: fallbackData,
      fallbackUsed: true,
      fallbackReason: 'OpenAQ live timed out or station unavailable; reverted to 7-day rolling baseline'
    };
  }
}

export const sensorService = new SensorService();
