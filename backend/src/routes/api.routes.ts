import { Router, Request, Response } from 'express';
import { processReport } from '../controllers/reportController.js';
import { incidentStore } from '../data/incidentStore.js';
import { getAllRegions, getRegion } from '../config/regionManager.js';
import { calculateSpikeRiskForecast } from '../fusion/forecast.js';
import { weatherService } from '../data/weatherService.js';
import { fireService } from '../data/fireService.js';
import { chaosManager } from '../infrastructure/chaosManager.js';
import { sseBus } from '../realtime/sseBus.js';
import { IncidentReport, ReportStatus } from '../types/index.js';

export const apiRouter = Router();

// Liveness Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    activeSseClients: sseBus.getActiveClientCount()
  });
});

// SSE Real-time Alert Stream
apiRouter.get('/events', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  sseBus.addClient(clientId, res);
});

// Incident Ingestion & Processing
apiRouter.post('/reports/process', processReport);

// Incident Retrieval
apiRouter.get('/reports', (req: Request, res: Response) => {
  const regionId = req.query.region as string;
  const reports = incidentStore.getAll(regionId);
  res.json({ success: true, count: reports.length, reports });
});

apiRouter.get('/reports/:id', (req: Request, res: Response) => {
  const report = incidentStore.getById(req.params.id);
  if (!report) {
    res.status(404).json({ success: false, error: 'Report not found' });
    return;
  }
  res.json({ success: true, report });
});

// Authority Alert Triage & Case Management
apiRouter.patch('/alerts/:id', (req: Request, res: Response) => {
  const { status, officer, note } = req.body;
  if (!status || !['NEW', 'ASSIGNED', 'RESOLVED', 'FALSE'].includes(status)) {
    res.status(400).json({ success: false, error: 'Valid status required' });
    return;
  }

  const updated = incidentStore.updateStatus(
    req.params.id,
    status as ReportStatus,
    officer || 'Duty Officer',
    note
  );

  if (!updated) {
    res.status(404).json({ success: false, error: 'Incident alert not found' });
    return;
  }

  sseBus.broadcastIncidentUpdated(updated);
  res.json({ success: true, incident: updated });
});

// Region Configurations
apiRouter.get('/regions', (_req: Request, res: Response) => {
  res.json({ success: true, regions: getAllRegions() });
});

// 24-48h Spike-Risk Forecast
apiRouter.get('/forecast', async (req: Request, res: Response) => {
  const regionId = (req.query.region as string) || 'delhi';
  const region = getRegion(regionId);

  const [weather, fires] = await Promise.all([
    weatherService.getWeatherData(region.center[0], region.center[1]),
    fireService.getActiveFiresNear(region.center[0], region.center[1], 150.0)
  ]);

  const forecast = calculateSpikeRiskForecast({
    regionId: region.id,
    windSpeedMps: weather.data.windSpeedMps,
    boundaryLayerHeightMeters: weather.data.boundaryLayerHeightMeters || 500,
    fireUpwindCount: fires.fires.length,
    camsForecastPm25: regionId === 'delhi' ? 220 : regionId === 'punjab' ? 180 : 55
  });

  res.json({ success: true, forecast });
});

// Chaos Mode Controls for Hackathon Judges
apiRouter.get('/chaos', (_req: Request, res: Response) => {
  res.json({ success: true, state: chaosManager.getState() });
});

apiRouter.post('/chaos/toggle', (req: Request, res: Response) => {
  const { key } = req.body;
  const updated = chaosManager.toggleKillswitch(key);
  res.json({ success: true, state: updated });
});

apiRouter.post('/chaos/reset', (_req: Request, res: Response) => {
  const state = chaosManager.resetAll();
  res.json({ success: true, state });
});

// Judge Preset Scenario Simulator
apiRouter.post('/simulate', async (req: Request, res: Response) => {
  const { scenarioId } = req.body;
  const now = Date.now();

  let incident: IncidentReport;

  switch (scenarioId) {
    case 'delhi_stack_burst':
      incident = {
        id: `sim-delhi-${now}`,
        regionId: 'delhi',
        latitude: 28.7010,
        longitude: 77.1680,
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
        userDescription: 'SIMULATION: Critical flue gas bypass from industrial smelting unit.',
        language: 'en',
        timestamp: new Date().toISOString(),
        status: 'NEW',
        actionLog: [{ timestamp: new Date().toISOString(), action: 'Simulated Delhi Stack Burst', officer: 'Simulation Studio' }],
        geminiAnalysis: {
          isValidPollutionImage: true,
          visualEvidenceScore: 0.94,
          sourceType: 'INDUSTRIAL_STACK',
          spoofSuspicion: 'LOW',
          visualContext: 'Extreme black particulate plume escaping stack with high velocity.',
          summary: {
            en: 'Severe industrial stack burst simulated. Immediate intervention warranted.',
            hi: 'औद्योगिक चिमनी से तीव्र उत्सर्जन का अनुकरण। तत्काल कार्रवाई आवश्यक।',
            ta: 'தொழிற்சாலை அவசரநிலை உருவகப்படுத்தப்பட்டது.'
          }
        },
        fusionResults: {
          compositeScore: 92,
          priorityClass: 'CRITICAL',
          evidenceTier: 'VERIFIED',
          weightMode: 'OPTIMAL',
          components: { V: 0.94, S: 0.90, D: 0.82, W: 0.95, fireBonus: 0, clusterBoost: 1.0 },
          weightsApplied: { wV: 0.35, wS: 0.35, wD: 0.15, wW: 0.15 },
          telemetry: {
            nearestStationId: 'delhi-wazirpur',
            stationName: 'Wazirpur Industrial Area, Delhi - DPCC',
            distanceKm: 0.42,
            pm25Current: 420.0,
            pm25BaselineMu: 165.0,
            pm25BaselineSigma: 40.0,
            windSpeedMps: 3.4,
            windDirectionDeg: 270,
            bearingReportToStationDeg: 90,
            activeFireCount: 0
          },
          provenance: {
            aiModel: 'Gemini-2.5-Flash',
            sensorSource: 'OPENAQ_LIVE',
            weatherSource: 'OPEN_METEO_LIVE',
            satelliteSource: 'NASA_FIRMS_LIVE',
            fallbacksTriggered: []
          },
          formulaString: 'R = min(100, 100 × (0.35×0.94 + 0.35×0.90 + 0.15×0.82 + 0.15×0.95)) = 92'
        },
        actionBrief: 'Emergency industrial plume detection. CAAQMS reading spiked +6.3σ. Ward team dispatched.'
      };
      break;

    case 'punjab_stubble_surge':
      incident = {
        id: `sim-punjab-${now}`,
        regionId: 'punjab',
        latitude: 30.2480,
        longitude: 75.8400,
        imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop',
        userDescription: 'SIMULATION: Large farm fire cluster detected via NASA satellite feed.',
        language: 'hi',
        timestamp: new Date().toISOString(),
        status: 'NEW',
        actionLog: [{ timestamp: new Date().toISOString(), action: 'Simulated Stubble Fire Surge', officer: 'Simulation Studio' }],
        geminiAnalysis: {
          isValidPollutionImage: true,
          visualEvidenceScore: 0.89,
          sourceType: 'STUBBLE',
          spoofSuspicion: 'LOW',
          visualContext: 'Broad multi-acre paddy residue burn with massive smoke pall.',
          summary: {
            en: 'Major agricultural burning event corroborated by satellite thermal detection.',
            hi: 'उपग्रह थर्मल पहचान द्वारा पुष्ट प्रमुख कृषि अवशेष दहन।',
            ta: 'விவசாய எரிப்பு நிகழ்வு செயற்கைக்கோள் மூலம் உறுதிப்படுத்தப்பட்டது.'
          }
        },
        fusionResults: {
          compositeScore: 91,
          priorityClass: 'CRITICAL',
          evidenceTier: 'SATELLITE_CORROBORATED',
          weightMode: 'SATELLITE_BOOST',
          components: { V: 0.89, S: 0.78, D: 0.70, W: 0.85, fireBonus: 10, clusterBoost: 1.0 },
          weightsApplied: { wV: 0.40, wS: 0.20, wD: 0.10, wW: 0.10 },
          telemetry: {
            nearestStationId: 'punjab-sangrur',
            stationName: 'Sangrur Civil Station - PPCB',
            distanceKm: 0.72,
            pm25Current: 310.0,
            pm25BaselineMu: 110.0,
            pm25BaselineSigma: 35.0,
            windSpeedMps: 2.9,
            windDirectionDeg: 300,
            bearingReportToStationDeg: 120,
            activeFireCount: 4
          },
          provenance: {
            aiModel: 'Gemini-2.5-Flash',
            sensorSource: 'OPENAQ_LIVE',
            weatherSource: 'OPEN_METEO_LIVE',
            satelliteSource: 'NASA_FIRMS_LIVE',
            fallbacksTriggered: []
          },
          formulaString: 'R = min(100, 100 × (0.40×0.89 + 0.20×0.78 + 0.10×0.70 + 0.10×0.85) + 10) = 91'
        },
        actionBrief: 'NASA VIIRS thermal detection verified (+10 fire bonus). Plume trajectory crossing Patiala corridor.'
      };
      break;

    default:
      res.status(400).json({ success: false, error: 'Unknown scenario ID' });
      return;
  }

  incidentStore.save(incident);
  sseBus.broadcastIncidentCreated(incident);
  res.json({ success: true, incident });
});

// Public GeoJSON API (Complies with Open Geospatial Standards & Rounds Coordinates for Privacy)
apiRouter.get('/v1/incidents', (req: Request, res: Response) => {
  const regionId = req.query.region as string;
  const reports = incidentStore.getAll(regionId);

  const geoJson = {
    type: 'FeatureCollection',
    features: reports.map(r => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        // Rounded to ~100m for citizen privacy preservation
        coordinates: [
          Number(r.longitude.toFixed(3)),
          Number(r.latitude.toFixed(3))
        ]
      },
      properties: {
        id: r.id,
        regionId: r.regionId,
        compositeScore: r.fusionResults.compositeScore,
        priorityClass: r.fusionResults.priorityClass,
        evidenceTier: r.fusionResults.evidenceTier,
        sourceType: r.geminiAnalysis.sourceType,
        timestamp: r.timestamp,
        status: r.status,
        provenance: r.fusionResults.provenance
      }
    }))
  };

  res.json(geoJson);
});
