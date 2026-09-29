import delhiConfig from './regions/delhi.json';
import punjabConfig from './regions/punjab.json';
import chennaiConfig from './regions/chennai.json';
import { RegionConfig } from '../types/index.js';
import { calculateHaversineDistanceKm } from '../fusion/physicsMetrics.js';

const regions: Record<string, RegionConfig> = {
  delhi: delhiConfig as RegionConfig,
  punjab: punjabConfig as RegionConfig,
  chennai: chennaiConfig as RegionConfig
};

export function getRegion(regionId: string): RegionConfig {
  const region = regions[regionId.toLowerCase()];
  if (!region) {
    return regions['delhi']; // Default fallback
  }
  return region;
}

export function getAllRegions(): RegionConfig[] {
  return Object.values(regions);
}

export function findNearestStation(lat: number, lng: number, regionId?: string) {
  const targetRegion = regionId ? getRegion(regionId) : regions['delhi'];
  let closestStation = targetRegion.stations[0];
  let minDistance = Infinity;

  for (const station of targetRegion.stations) {
    const dist = calculateHaversineDistanceKm(lat, lng, station.lat, station.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestStation = station;
    }
  }

  return {
    station: closestStation,
    distanceKm: minDistance
  };
}
