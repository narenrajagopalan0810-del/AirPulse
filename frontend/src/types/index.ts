export type PriorityClass = 'CRITICAL' | 'ELEVATED' | 'LOW';

export type EvidenceTier = 
  | 'VERIFIED'
  | 'SATELLITE_CORROBORATED'
  | 'VISUAL_ONLY'
  | 'UNVERIFIED';

export type WeightMode = 
  | 'OPTIMAL'
  | 'SPARSE'
  | 'SENSOR_BLINDSPOT'
  | 'SATELLITE_BOOST';

export type SourceType = 
  | 'INDUSTRIAL_STACK'
  | 'WASTE_BURNING'
  | 'CONSTRUCTION_DUST'
  | 'STUBBLE'
  | 'UNCERTAIN';

export type SpoofSuspicion = 'LOW' | 'MEDIUM' | 'HIGH';

export type ReportStatus = 'NEW' | 'ASSIGNED' | 'RESOLVED' | 'FALSE';

export interface MultilingualSummary {
  en: string;
  hi: string;
  ta: string;
}

export interface GeminiAnalysisResult {
  isValidPollutionImage: boolean;
  visualEvidenceScore: number;
  sourceType: SourceType;
  spoofSuspicion: SpoofSuspicion;
  visualContext: string;
  summary: MultilingualSummary;
}

export interface FusionComponents {
  V: number;
  S: number;
  D: number;
  W: number;
  fireBonus: number;
  clusterBoost: number;
}

export interface FusionTelemetry {
  nearestStationId: string;
  stationName: string;
  distanceKm: number;
  pm25Current: number;
  pm25BaselineMu: number;
  pm25BaselineSigma: number;
  windSpeedMps: number;
  windDirectionDeg: number;
  bearingReportToStationDeg: number;
  activeFireCount: number;
}

export interface FusionProvenance {
  aiModel: string;
  sensorSource: 'OPENAQ_LIVE' | 'STATION_CACHE' | 'MOCK_FALLBACK';
  weatherSource: 'OPEN_METEO_LIVE' | 'CLIMATOLOGY_DEFAULT';
  satelliteSource: 'NASA_FIRMS_LIVE' | 'CACHE_FALLBACK';
  fallbacksTriggered: string[];
}

export interface FusionWeights {
  wV: number;
  wS: number;
  wD: number;
  wW: number;
}

export interface FusionResult {
  compositeScore: number;
  priorityClass: PriorityClass;
  evidenceTier: EvidenceTier;
  weightMode: WeightMode;
  components: FusionComponents;
  weightsApplied: FusionWeights;
  telemetry: FusionTelemetry;
  provenance: FusionProvenance;
  formulaString: string;
}

export interface IncidentReport {
  id: string;
  regionId: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  userDescription?: string;
  language: 'en' | 'hi' | 'ta';
  timestamp: string;
  status: ReportStatus;
  assignedOfficer?: string;
  actionLog: Array<{
    timestamp: string;
    action: string;
    officer: string;
    note?: string;
  }>;
  geminiAnalysis: GeminiAnalysisResult;
  fusionResults: FusionResult;
  actionBrief: string;
}

export interface RegionConfig {
  id: string;
  name: string;
  bbox: [number, number, number, number];
  center: [number, number];
  defaultZoom: number;
  primaryLanguages: Array<'en' | 'hi' | 'ta'>;
  stations: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    baselineMu: number;
    baselineSigma: number;
  }>;
}

export interface SpikeRiskForecast {
  regionId: string;
  timestamp: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  compositeRiskScore: number;
  drivers: {
    stagnationIndex: number;
    fireUpwindCount: number;
    forecastPmNormalized: number;
  };
  explanation: string;
  provenance: string;
}

export interface ChaosState {
  killGemini: boolean;
  killOpenAQ: boolean;
  killWeather: boolean;
  killFirms: boolean;
}
