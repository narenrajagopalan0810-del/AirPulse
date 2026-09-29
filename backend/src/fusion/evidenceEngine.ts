import {
  EvidenceTier,
  FusionComponents,
  FusionProvenance,
  FusionResult,
  FusionTelemetry,
  FusionWeights,
  PriorityClass,
  SourceType,
  WeightMode
} from '../types/index.js';
import {
  calculateDistanceAttenuationD,
  calculateStationAnomalyS,
  calculateWindAlignmentW
} from './physicsMetrics.js';

export interface FusionEngineInput {
  visualScoreV: number; // V ∈ [0, 1]
  sourceType: SourceType;
  distanceKm: number;
  pm25Now: number;
  baselineMu: number;
  baselineSigma: number;
  windFromDeg: number;
  windSpeedMps: number;
  bearingReportToStationDeg: number;
  activeFirmsDetectionsNearReport: number; // detections within 5 km
  nearestStationId: string;
  stationName: string;
  clusterCount?: number; // count of nearby reports in 30 mins
  provenance: {
    aiModel: string;
    sensorSource: 'OPENAQ_LIVE' | 'STATION_CACHE' | 'MOCK_FALLBACK';
    weatherSource: 'OPEN_METEO_LIVE' | 'CLIMATOLOGY_DEFAULT';
    satelliteSource: 'NASA_FIRMS_LIVE' | 'CACHE_FALLBACK';
    fallbacksTriggered?: string[];
  };
}

/**
 * Pure deterministic Fusion Engine.
 * Combines multimodal vision evidence with atmospheric physics & ground telemetry.
 */
export function computeEvidenceScore(input: FusionEngineInput): FusionResult {
  const V = Math.min(Math.max(input.visualScoreV, 0.0), 1.0);
  const D = calculateDistanceAttenuationD(input.distanceKm);
  const S = calculateStationAnomalyS(
    input.pm25Now,
    input.baselineMu,
    input.baselineSigma,
    input.distanceKm
  );
  const W = calculateWindAlignmentW(
    input.windFromDeg,
    input.windSpeedMps,
    input.bearingReportToStationDeg
  );

  // Determine Weight Mode and Dynamic Weight Shift
  let weightMode: WeightMode;
  let weights: FusionWeights;
  let scoreCap = 100.0;

  const hasFireHotspot = input.activeFirmsDetectionsNearReport > 0;
  const isCombustionType =
    input.sourceType === 'STUBBLE' || input.sourceType === 'WASTE_BURNING';

  const fireBonus = hasFireHotspot && isCombustionType ? 10.0 : 0.0;

  if (hasFireHotspot) {
    weightMode = 'SATELLITE_BOOST';
    weights = { wV: 0.40, wS: 0.20, wD: 0.10, wW: 0.10 };
  } else if (input.distanceKm > 5.0 || input.provenance.sensorSource === 'MOCK_FALLBACK' && input.distanceKm > 3.0) {
    weightMode = 'SENSOR_BLINDSPOT';
    weights = { wV: 0.70, wS: 0.00, wD: 0.15, wW: 0.15 };
    scoreCap = 80.0; // Blindspot without sensor confirmation is capped
  } else if (input.distanceKm > 3.0) {
    weightMode = 'SPARSE';
    weights = { wV: 0.50, wS: 0.20, wD: 0.15, wW: 0.15 };
    scoreCap = 90.0;
  } else {
    weightMode = 'OPTIMAL';
    weights = { wV: 0.35, wS: 0.35, wD: 0.15, wW: 0.15 };
    scoreCap = 100.0;
  }

  // Calculate Weighted Sum
  const weightedSum =
    weights.wV * V +
    weights.wS * S +
    weights.wD * D +
    weights.wW * W;

  let rawComposite = weightedSum * 100.0 + fireBonus;

  // Optional cluster boost if ≥ 2 reports nearby in 30m
  const clusterBoostApplied = input.clusterCount && input.clusterCount >= 2 ? 1.15 : 1.0;
  if (clusterBoostApplied > 1.0) {
    rawComposite *= clusterBoostApplied;
  }

  const compositeScore = Math.min(Math.round(Math.min(rawComposite, scoreCap)), 100);

  // Priority classification
  let priorityClass: PriorityClass;
  if (compositeScore >= 75) {
    priorityClass = 'CRITICAL';
  } else if (compositeScore >= 45) {
    priorityClass = 'ELEVATED';
  } else {
    priorityClass = 'LOW';
  }

  // Evidence tier assignment
  let evidenceTier: EvidenceTier;
  if (hasFireHotspot) {
    evidenceTier = 'SATELLITE_CORROBORATED';
  } else if (weights.wS > 0 && S > 0.15 && D > 0.2) {
    evidenceTier = 'VERIFIED';
  } else if (V >= 0.40) {
    evidenceTier = 'VISUAL_ONLY';
  } else {
    evidenceTier = 'UNVERIFIED';
  }

  const components: FusionComponents = {
    V: Number(V.toFixed(3)),
    S: Number(S.toFixed(3)),
    D: Number(D.toFixed(3)),
    W: Number(W.toFixed(3)),
    fireBonus,
    clusterBoost: clusterBoostApplied
  };

  const telemetry: FusionTelemetry = {
    nearestStationId: input.nearestStationId,
    stationName: input.stationName,
    distanceKm: Number(input.distanceKm.toFixed(2)),
    pm25Current: Number(input.pm25Now.toFixed(1)),
    pm25BaselineMu: Number(input.baselineMu.toFixed(1)),
    pm25BaselineSigma: Number(input.baselineSigma.toFixed(1)),
    windSpeedMps: Number(input.windSpeedMps.toFixed(1)),
    windDirectionDeg: Math.round(input.windFromDeg),
    bearingReportToStationDeg: Math.round(input.bearingReportToStationDeg),
    activeFireCount: input.activeFirmsDetectionsNearReport
  };

  const provenance: FusionProvenance = {
    aiModel: input.provenance.aiModel,
    sensorSource: input.provenance.sensorSource,
    weatherSource: input.provenance.weatherSource,
    satelliteSource: input.provenance.satelliteSource,
    fallbacksTriggered: input.provenance.fallbacksTriggered || []
  };

  const formulaString = `R = min(${scoreCap}, 100 × (${weights.wV}×${components.V} + ${weights.wS}×${components.S} + ${weights.wD}×${components.D} + ${weights.wW}×${components.W})) + ${fireBonus} = ${compositeScore}`;

  return {
    compositeScore,
    priorityClass,
    evidenceTier,
    weightMode,
    components,
    weightsApplied: weights,
    telemetry,
    provenance,
    formulaString
  };
}
