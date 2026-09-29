import { describe, it, expect } from 'vitest';
import { computeEvidenceScore } from '../src/fusion/evidenceEngine.js';

describe('Evidence Fusion Engine', () => {
  const baseInput = {
    visualScoreV: 0.85,
    sourceType: 'INDUSTRIAL_STACK' as const,
    distanceKm: 1.5,
    pm25Now: 280,
    baselineMu: 160,
    baselineSigma: 40,
    windFromDeg: 270,
    windSpeedMps: 3.5,
    bearingReportToStationDeg: 90, // perfectly aligned
    activeFirmsDetectionsNearReport: 0,
    nearestStationId: 'delhi-wazirpur',
    stationName: 'Wazirpur Industrial Area',
    provenance: {
      aiModel: 'Gemini-2.5-Flash',
      sensorSource: 'OPENAQ_LIVE' as const,
      weatherSource: 'OPEN_METEO_LIVE' as const,
      satelliteSource: 'NASA_FIRMS_LIVE' as const
    }
  };

  it('should compute high composite score for close industrial stack with aligned wind and sensor spike', () => {
    const result = computeEvidenceScore(baseInput);

    expect(result.weightMode).toBe('OPTIMAL');
    expect(result.priorityClass).toBe('CRITICAL');
    expect(result.evidenceTier).toBe('VERIFIED');
    expect(result.compositeScore).toBeGreaterThanOrEqual(75);
    expect(result.formulaString).toContain('R = min(100');
  });

  describe('Dynamic Weight Shifting', () => {
    it('should use OPTIMAL weights when station is within 3 km', () => {
      const res = computeEvidenceScore({ ...baseInput, distanceKm: 2.1 });
      expect(res.weightMode).toBe('OPTIMAL');
      expect(res.weightsApplied).toEqual({ wV: 0.35, wS: 0.35, wD: 0.15, wW: 0.15 });
    });

    it('should shift to SPARSE weights when station is between 3 km and 5 km', () => {
      const res = computeEvidenceScore({ ...baseInput, distanceKm: 4.2 });
      expect(res.weightMode).toBe('SPARSE');
      expect(res.weightsApplied).toEqual({ wV: 0.50, wS: 0.20, wD: 0.15, wW: 0.15 });
    });

    it('should shift to SENSOR_BLINDSPOT and cap at 80 when station is beyond 5 km', () => {
      const res = computeEvidenceScore({
        ...baseInput,
        visualScoreV: 1.0,
        distanceKm: 8.5
      });

      expect(res.weightMode).toBe('SENSOR_BLINDSPOT');
      expect(res.evidenceTier).toBe('VISUAL_ONLY');
      expect(res.weightsApplied.wS).toBe(0.0);
      expect(res.compositeScore).toBeLessThanOrEqual(80);
    });

    it('should apply +10 satellite bonus and SATELLITE_BOOST mode when FIRMS detections present', () => {
      const res = computeEvidenceScore({
        ...baseInput,
        sourceType: 'STUBBLE',
        activeFirmsDetectionsNearReport: 3
      });

      expect(res.weightMode).toBe('SATELLITE_BOOST');
      expect(res.evidenceTier).toBe('SATELLITE_CORROBORATED');
      expect(res.components.fireBonus).toBe(10);
      expect(res.compositeScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Priority Threshold Boundaries', () => {
    it('should classify R < 45 as LOW', () => {
      const lowRes = computeEvidenceScore({
        ...baseInput,
        visualScoreV: 0.2,
        pm25Now: 160, // S = 0
        distanceKm: 4.0,
        windFromDeg: 90, // wind blowing away from station
        bearingReportToStationDeg: 90
      });

      expect(lowRes.compositeScore).toBeLessThan(45);
      expect(lowRes.priorityClass).toBe('LOW');
    });

    it('should classify R >= 75 as CRITICAL', () => {
      const critRes = computeEvidenceScore({
        ...baseInput,
        visualScoreV: 0.9,
        pm25Now: 300,
        distanceKm: 0.5
      });

      expect(critRes.compositeScore).toBeGreaterThanOrEqual(75);
      expect(critRes.priorityClass).toBe('CRITICAL');
    });
  });
});
