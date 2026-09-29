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
  visualEvidenceScore: number; // V ∈ [0, 1]
  sourceType: SourceType;
  spoofSuspicion: SpoofSuspicion;
  visualContext: string;
  summary: MultilingualSummary;
}

export interface StationData {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  pm25: number;
  baselineMu: number;
  baselineSigma: number;
  lastUpdated: string;
  source: 'OPENAQ_LIVE' | 'STATION_CACHE' | 'MOCK_FALLBACK';
}

export interface WeatherData {
  windSpeedMps: number;
  windDirectionDeg: number; // 0-360 deg: direction wind is blowing FROM
  boundaryLayerHeightMeters?: number;
  relativeHumidity?: number;
  source: 'OPEN_METEO_LIVE' | 'CLIMATOLOGY_DEFAULT';
}

export interface FireDetection {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: 'l' | 'n' | 'h' | number;
  acquiredDate: string;
  distanceKm: number;
}

export interface FusionWeights {
  wV: number;
  wS: number;
  wD: number;
  wW: number;
}

export interface FusionComponents {
  V: number; // Visual score
  S: number; // Ground sensor anomaly
  D: number; // Distance spatial attenuation
  W: number; // Wind alignment
  fireBonus: number; // FIRMS bonus (+10 if applicable)
  clusterBoost: number; // Cluster multiplier if applicable
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

export interface FusionResult {
  compositeScore: number; // R ∈ [0, 100]
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
  userAudioUrl?: string;
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
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  center: [number, number]; // [lat, lng]
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
  compositeRiskScore: number; // 0 - 100
  drivers: {
    stagnationIndex: number; // 0-1
    fireUpwindCount: number;
    forecastPmNormalized: number; // 0-1
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
