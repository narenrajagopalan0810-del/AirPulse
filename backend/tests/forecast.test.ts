import { describe, it, expect } from 'vitest';
import { calculateSpikeRiskForecast } from '../src/fusion/forecast.js';

describe('Atmospheric Spike-Risk Forecast Engine', () => {
  it('should compute HIGH risk during winter inversion with stagnant winds and active upwind fires', () => {
    const forecast = calculateSpikeRiskForecast({
      regionId: 'delhi',
      windSpeedMps: 0.8, // severe stagnation
      boundaryLayerHeightMeters: 250, // low inversion layer
      fireUpwindCount: 35, // severe upwind stubble burning
      camsForecastPm25: 320 // hazardous forecast
    });

    expect(forecast.riskLevel).toBe('HIGH');
    expect(forecast.compositeRiskScore).toBeGreaterThanOrEqual(65);
    expect(forecast.drivers.stagnationIndex).toBeGreaterThan(0.7);
    expect(forecast.explanation).toContain('High risk of severe smog accumulation');
  });

  it('should compute LOW risk during clear ventilating conditions', () => {
    const forecast = calculateSpikeRiskForecast({
      regionId: 'chennai',
      windSpeedMps: 5.5, // strong wind dispersion
      boundaryLayerHeightMeters: 1400, // high planetary boundary layer
      fireUpwindCount: 0,
      camsForecastPm25: 25
    });

    expect(forecast.riskLevel).toBe('LOW');
    expect(forecast.compositeRiskScore).toBeLessThan(35);
    expect(forecast.explanation).toContain('Low risk');
  });
});
