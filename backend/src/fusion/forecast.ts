import { SpikeRiskForecast } from '../types/index.js';

export interface ForecastInput {
  regionId: string;
  windSpeedMps: number;
  boundaryLayerHeightMeters: number; // e.g. 200m (winter inversion) vs 1500m (clear day)
  fireUpwindCount: number; // fires within 200km upwind
  camsForecastPm25: number; // forecasted ambient PM2.5 in ug/m3
}

/**
 * Heuristic 24-48h Spike-Risk Forecast Engine.
 * Fuses atmospheric stagnation, satellite upwind thermal fires, and CAMS forecast.
 */
export function calculateSpikeRiskForecast(input: ForecastInput): SpikeRiskForecast {
  // 1. Stagnation Index (0 = high dispersion, 1 = severe inversion/trapping)
  // Low wind speed (< 2 m/s) and low boundary layer (< 500m) cause severe winter smog trapping
  const windStagnation = Math.max(0.0, Math.min(1.0, (5.0 - input.windSpeedMps) / 5.0));
  const blhStagnation = Math.max(0.0, Math.min(1.0, (1200.0 - input.boundaryLayerHeightMeters) / 1000.0));
  const stagnationIndex = Number(((windStagnation * 0.5) + (blhStagnation * 0.5)).toFixed(3));

  // 2. Fire Upwind Index (0 = no fires, 1 = >= 20 fires upwind)
  const fireUpwindNorm = Math.min(input.fireUpwindCount / 20.0, 1.0);

  // 3. Forecast PM Index (0 = clean <= 30 ug/m3, 1 = hazardous >= 250 ug/m3)
  const forecastPmNorm = Math.max(0.0, Math.min(1.0, (input.camsForecastPm25 - 30.0) / 220.0));

  // Risk Formula: 0.4 stagnation + 0.3 fireUpwind + 0.3 forecastPM
  const compositeRiskNorm = (0.4 * stagnationIndex) + (0.3 * fireUpwindNorm) + (0.3 * forecastPmNorm);
  const compositeRiskScore = Math.round(compositeRiskNorm * 100.0);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (compositeRiskScore >= 65) {
    riskLevel = 'HIGH';
  } else if (compositeRiskScore >= 35) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  let explanation = '';
  if (riskLevel === 'HIGH') {
    explanation = `High risk of severe smog accumulation: Low boundary layer (${input.boundaryLayerHeightMeters}m) and stagnant winds (${input.windSpeedMps}m/s) combined with ${input.fireUpwindCount} upwind thermal hotspots.`;
  } else if (riskLevel === 'MEDIUM') {
    explanation = `Moderate atmospheric accumulation risk: Moderate dispersion conditions with forecasted PM2.5 at ${input.camsForecastPm25} µg/m³.`;
  } else {
    explanation = `Low risk: Good atmospheric ventilation (${input.windSpeedMps}m/s winds) and minimal upwind combustion detections.`;
  }

  return {
    regionId: input.regionId,
    timestamp: new Date().toISOString(),
    riskLevel,
    compositeRiskScore,
    drivers: {
      stagnationIndex,
      fireUpwindCount: input.fireUpwindCount,
      forecastPmNormalized: Number(forecastPmNorm.toFixed(3))
    },
    explanation,
    provenance: 'Open-Meteo Atmospheric + NASA FIRMS + CAMS Climatology Model'
  };
}
