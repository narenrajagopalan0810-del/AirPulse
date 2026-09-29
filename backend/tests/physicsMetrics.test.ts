import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceKm,
  calculateBearingDeg,
  calculateDistanceAttenuationD,
  calculateStationAnomalyS,
  calculateWindAlignmentW
} from '../src/fusion/physicsMetrics.js';

describe('Atmospheric Physics & Geospatial Metrics', () => {
  describe('Haversine Distance', () => {
    it('should compute zero distance for identical coordinates', () => {
      const dist = calculateHaversineDistanceKm(28.6139, 77.2090, 28.6139, 77.2090);
      expect(dist).toBeCloseTo(0.0, 4);
    });

    it('should compute correct distance between Delhi and Anand Vihar (~11 km)', () => {
      const dist = calculateHaversineDistanceKm(28.6139, 77.2090, 28.6469, 77.3160);
      expect(dist).toBeGreaterThan(10.0);
      expect(dist).toBeLessThan(13.0);
    });
  });

  describe('Bearing Calculation', () => {
    it('should calculate due north (~0° or 360°)', () => {
      const bearing = calculateBearingDeg(28.0, 77.0, 29.0, 77.0);
      expect(bearing).toBeCloseTo(0.0, 1);
    });

    it('should calculate due east (~90°)', () => {
      const bearing = calculateBearingDeg(28.0, 77.0, 28.0, 78.0);
      expect(bearing).toBeCloseTo(90.0, 0);
    });

    it('should always return a value in [0, 360)', () => {
      const bearing = calculateBearingDeg(28.6, 77.2, 28.5, 77.1);
      expect(bearing).toBeGreaterThanOrEqual(0.0);
      expect(bearing).toBeLessThan(360.0);
    });
  });

  describe('Distance Attenuation D', () => {
    it('should be 1.0 at distance 0', () => {
      expect(calculateDistanceAttenuationD(0)).toBeCloseTo(1.0, 4);
    });

    it('should exponentially decay with distance', () => {
      const d2km = calculateDistanceAttenuationD(2.0); // exp(-1) ≈ 0.3678
      expect(d2km).toBeCloseTo(Math.exp(-1), 4);

      const d4km = calculateDistanceAttenuationD(4.0);
      expect(d4km).toBeLessThan(d2km);
    });
  });

  describe('Station Anomaly S', () => {
    it('should return 0 when current PM2.5 is at or below baseline μ', () => {
      const s = calculateStationAnomalyS(150, 150, 30, 2.0);
      expect(s).toBe(0.0);

      const sSub = calculateStationAnomalyS(100, 150, 30, 2.0);
      expect(sSub).toBe(0.0);
    });

    it('should clamp to 1.0 when PM2.5 reaches or exceeds μ + 3σ', () => {
      const s = calculateStationAnomalyS(240, 150, 30, 2.0); // 150 + 3*30 = 240
      expect(s).toBe(1.0);

      const sExtreme = calculateStationAnomalyS(500, 150, 30, 2.0);
      expect(sExtreme).toBe(1.0);
    });

    it('should force S to 0 if distance > 5.0 km regardless of reading', () => {
      const s = calculateStationAnomalyS(450, 150, 30, 5.2);
      expect(s).toBe(0.0);
    });
  });

  describe('Wind Transport Alignment W', () => {
    it('should return 0.5 under calm wind conditions (< 1.0 m/s)', () => {
      const w = calculateWindAlignmentW(180, 0.5, 45);
      expect(w).toBe(0.5);
    });

    it('should return 1.0 when wind blows plume directly toward station', () => {
      // Wind FROM 270° blows TOWARD 90°. If bearing is 90°, alignment is perfect.
      const w = calculateWindAlignmentW(270, 3.5, 90);
      expect(w).toBeCloseTo(1.0, 4);
    });

    it('should return 0.0 when wind blows directly away from station', () => {
      // Wind FROM 90° blows TOWARD 270°. Bearing is 90° (opposite direction).
      const w = calculateWindAlignmentW(90, 3.5, 90);
      expect(w).toBe(0.0);
    });

    it('should correctly handle 0°/360° circular wraparound', () => {
      // Wind FROM 175° blows TOWARD 355°. Bearing is 5° (difference is only 10°).
      const w = calculateWindAlignmentW(175, 4.0, 5);
      expect(w).toBeGreaterThan(0.95);
    });
  });
});
