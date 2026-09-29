/**
 * Pure atmospheric physics and geospatial calculation engine.
 * No external dependencies — pure deterministic mathematics.
 */

const EARTH_RADIUS_KM = 6371.0;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180.0;
}

function toDegrees(radians: number): number {
  return (radians * 180.0) / Math.PI;
}

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates the forward bearing (in degrees [0, 360)) from point 1 to point 2.
 */
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const thetaRad = Math.atan2(y, x);
  const thetaDeg = (toDegrees(thetaRad) + 360.0) % 360.0;

  return thetaDeg;
}

/**
 * Spatial Attenuation metric D:
 * D = exp(-d / 2.0) where d is in km.
 */
export function calculateDistanceAttenuationD(distanceKm: number): number {
  if (distanceKm < 0) return 1.0;
  return Math.exp(-distanceKm / 2.0);
}

/**
 * Ground station anomaly score S:
 * S = clamp((pm25_now - μ) / (3σ), 0, 1)
 * If d > 5 km, S is forced to 0.
 */
export function calculateStationAnomalyS(
  pm25Now: number,
  baselineMu: number,
  baselineSigma: number,
  distanceKm: number
): number {
  if (distanceKm > 5.0) {
    return 0.0;
  }
  const safeSigma = Math.max(baselineSigma, 1.0); // Prevent divide-by-zero
  const zScore = (pm25Now - baselineMu) / (3.0 * safeSigma);
  return Math.min(Math.max(zScore, 0.0), 1.0);
}

/**
 * Wind alignment metric W:
 * Wind is reported as the direction it blows FROM (windFromDeg).
 * The plume travels TOWARD windTowardDeg = (windFromDeg + 180) % 360.
 * Bearing is from report -> station.
 * If wind is calm (< 1.0 m/s), dispersion is omnidirectional -> W = 0.5.
 * Otherwise W = max(0, cos(theta)) where theta is the difference angle.
 */
export function calculateWindAlignmentW(
  windFromDeg: number,
  windSpeedMps: number,
  bearingReportToStationDeg: number
): number {
  if (windSpeedMps < 1.0) {
    return 0.5; // Calm wind condition
  }

  const windTowardDeg = (windFromDeg + 180.0) % 360.0;
  let angleDiff = Math.abs(windTowardDeg - bearingReportToStationDeg);

  // Wrap around circular difference (e.g. 350° and 10° diff is 20°)
  if (angleDiff > 180.0) {
    angleDiff = 360.0 - angleDiff;
  }

  const angleRad = toRadians(angleDiff);
  const cosTheta = Math.cos(angleRad);

  return Math.max(0.0, cosTheta);
}
