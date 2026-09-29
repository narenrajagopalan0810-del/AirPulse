import { IncidentReport, ReportStatus } from '../types/index.js';

export class IncidentStore {
  private incidents: Map<string, IncidentReport> = new Map();

  constructor() {
    this.seedInitialIncidents();
  }

  getAll(regionId?: string): IncidentReport[] {
    const list = Array.from(this.incidents.values());
    if (!regionId || regionId === 'all') {
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return list
      .filter(inc => inc.regionId.toLowerCase() === regionId.toLowerCase())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getById(id: string): IncidentReport | undefined {
    return this.incidents.get(id);
  }

  save(incident: IncidentReport): IncidentReport {
    this.incidents.set(incident.id, incident);
    return incident;
  }

  updateStatus(
    id: string,
    status: ReportStatus,
    officer: string,
    note?: string
  ): IncidentReport | null {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    incident.status = status;
    incident.assignedOfficer = officer;
    incident.actionLog.push({
      timestamp: new Date().toISOString(),
      action: `Status transitioned to ${status}`,
      officer,
      note
    });

    this.incidents.set(id, incident);
    return incident;
  }

  private seedInitialIncidents() {
    const now = Date.now();

    // 1. Delhi Wazirpur Industrial Stack (Critical Red)
    const delhiIncident: IncidentReport = {
      id: 'inc-delhi-001',
      regionId: 'delhi',
      latitude: 28.6980,
      longitude: 77.1620,
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
      userDescription: 'Heavy dark black emissions pouring from electroplating factory stack behind residential block.',
      language: 'en',
      timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
      status: 'NEW',
      actionLog: [
        {
          timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
          action: 'Incident created via Citizen Vernacular PWA',
          officer: 'System Automation'
        }
      ],
      geminiAnalysis: {
        isValidPollutionImage: true,
        visualEvidenceScore: 0.92,
        sourceType: 'INDUSTRIAL_STACK',
        spoofSuspicion: 'LOW',
        visualContext: 'High-density opaque black emission column escaping from unscrubbed industrial flue. Plume displays high thermal velocity.',
        summary: {
          en: 'Severe industrial stack emission observed. Dense particulate column drifting north-east.',
          hi: 'औद्योगिक चिमनी से अत्यधिक काला धुआँ निकल रहा है। सघन कण उत्तर-पूर्व की ओर बढ़ रहे हैं।',
          ta: 'தொழிற்சாலை புகைக்குழாயிலிருந்து அதிக அடர்த்தியான புகை வெளியேறுகிறது.'
        }
      },
      fusionResults: {
        compositeScore: 89,
        priorityClass: 'CRITICAL',
        evidenceTier: 'VERIFIED',
        weightMode: 'OPTIMAL',
        components: {
          V: 0.92,
          S: 0.88,
          D: 0.74,
          W: 0.91,
          fireBonus: 0,
          clusterBoost: 1.0
        },
        weightsApplied: { wV: 0.35, wS: 0.35, wD: 0.15, wW: 0.15 },
        telemetry: {
          nearestStationId: 'delhi-wazirpur',
          stationName: 'Wazirpur Industrial Area, Delhi - DPCC',
          distanceKm: 0.62,
          pm25Current: 385.0,
          pm25BaselineMu: 165.0,
          pm25BaselineSigma: 40.0,
          windSpeedMps: 3.2,
          windDirectionDeg: 260,
          bearingReportToStationDeg: 85,
          activeFireCount: 0
        },
        provenance: {
          aiModel: 'Gemini-2.5-Flash',
          sensorSource: 'OPENAQ_LIVE',
          weatherSource: 'OPEN_METEO_LIVE',
          satelliteSource: 'NASA_FIRMS_LIVE',
          fallbacksTriggered: []
        },
        formulaString: 'R = min(100, 100 × (0.35×0.92 + 0.35×0.88 + 0.15×0.74 + 0.15×0.91)) = 89'
      },
      actionBrief: 'High-priority industrial enforcement required. Plume alignment verified against Wazirpur CAAQMS sensor spike (+5.5σ). Deploy Ward 14 inspection team immediately.'
    };

    // 2. Punjab Sangrur Stubble Fire (Critical Red, Satellite Corroborated)
    const punjabIncident: IncidentReport = {
      id: 'inc-punjab-002',
      regionId: 'punjab',
      latitude: 30.2510,
      longitude: 75.8360,
      imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop',
      userDescription: 'खेतों में पराली जलाई जा रही है, बहुत तेज़ धुआँ फैल रहा है और सड़क पर विजिबिलिटी कम हो गई है।',
      language: 'hi',
      timestamp: new Date(now - 75 * 60 * 1000).toISOString(),
      status: 'ASSIGNED',
      assignedOfficer: 'Inspector Harpreet Singh (PPCB)',
      actionLog: [
        {
          timestamp: new Date(now - 75 * 60 * 1000).toISOString(),
          action: 'Incident registered via Hindi voice reporting',
          officer: 'System Automation'
        },
        {
          timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
          action: 'Status transitioned to ASSIGNED',
          officer: 'Inspector Harpreet Singh',
          note: 'Field patrol dispatched with fire mitigation vehicle.'
        }
      ],
      geminiAnalysis: {
        isValidPollutionImage: true,
        visualEvidenceScore: 0.88,
        sourceType: 'STUBBLE',
        spoofSuspicion: 'LOW',
        visualContext: 'Agricultural field burning along extensive perimeter. Thick white-grey smoke covering rural highway.',
        summary: {
          en: 'Extensive agricultural crop residue burning detected across multiple acre plots.',
          hi: 'खेतों में व्यापक पराली जलाने की पुष्टि हुई है। धुआँ राज्य राजमार्ग की ओर बढ़ रहा है।',
          ta: 'விவசாய பயிர் கழிவுகள் எரிக்கப்படுவது கண்டறியப்பட்டது.'
        }
      },
      fusionResults: {
        compositeScore: 88,
        priorityClass: 'CRITICAL',
        evidenceTier: 'SATELLITE_CORROBORATED',
        weightMode: 'SATELLITE_BOOST',
        components: {
          V: 0.88,
          S: 0.75,
          D: 0.65,
          W: 0.82,
          fireBonus: 10,
          clusterBoost: 1.0
        },
        weightsApplied: { wV: 0.40, wS: 0.20, wD: 0.10, wW: 0.10 },
        telemetry: {
          nearestStationId: 'punjab-sangrur',
          stationName: 'Sangrur Civil Station - PPCB',
          distanceKm: 0.85,
          pm25Current: 290.0,
          pm25BaselineMu: 110.0,
          pm25BaselineSigma: 35.0,
          windSpeedMps: 2.8,
          windDirectionDeg: 310,
          bearingReportToStationDeg: 125,
          activeFireCount: 2
        },
        provenance: {
          aiModel: 'Gemini-2.5-Flash',
          sensorSource: 'OPENAQ_LIVE',
          weatherSource: 'OPEN_METEO_LIVE',
          satelliteSource: 'NASA_FIRMS_LIVE',
          fallbacksTriggered: []
        },
        formulaString: 'R = min(100, 100 × (0.40×0.88 + 0.20×0.75 + 0.10×0.65 + 0.10×0.82) + 10) = 88'
      },
      actionBrief: 'Corroborated by NASA FIRMS VIIRS satellite thermal detection (342K). Plume moving toward Sangrur urban cluster. Water tanker intervention recommended.'
    };

    // 3. Chennai Guindy Construction Dust (Elevated Orange)
    const chennaiIncident: IncidentReport = {
      id: 'inc-chennai-003',
      regionId: 'chennai',
      latitude: 13.0080,
      longitude: 80.2040,
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=800&auto=format&fit=crop',
      userDescription: 'Major unpaved demolition site generating massive particulate dust plumes across pedestrian walkway.',
      language: 'en',
      timestamp: new Date(now - 120 * 60 * 1000).toISOString(),
      status: 'RESOLVED',
      assignedOfficer: 'Officer Ramesh Kumar (TNPCB)',
      actionLog: [
        {
          timestamp: new Date(now - 120 * 60 * 1000).toISOString(),
          action: 'Incident registered',
          officer: 'System Automation'
        },
        {
          timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
          action: 'Status transitioned to RESOLVED',
          officer: 'Officer Ramesh Kumar',
          note: 'Issued mandatory water sprinkling notice. Construction site compliant.'
        }
      ],
      geminiAnalysis: {
        isValidPollutionImage: true,
        visualEvidenceScore: 0.68,
        sourceType: 'CONSTRUCTION_DUST',
        spoofSuspicion: 'LOW',
        visualContext: 'Demolition dust envelope with visible backhoe excavator. High suspended fugitive dust.',
        summary: {
          en: 'Uncontrolled fugitive construction dust affecting local air quality along pedestrian corridor.',
          hi: 'अनियंत्रित निर्माण धूल से पैदल मार्ग पर वायु गुणवत्ता प्रभावित हो रही है।',
          ta: 'கட்டுமான தூசி காரணமாக உள்ளூர் காற்று தரம் பாதிக்கப்பட்டுள்ளது.'
        }
      },
      fusionResults: {
        compositeScore: 62,
        priorityClass: 'ELEVATED',
        evidenceTier: 'VERIFIED',
        weightMode: 'OPTIMAL',
        components: {
          V: 0.68,
          S: 0.60,
          D: 0.88,
          W: 0.50,
          fireBonus: 0,
          clusterBoost: 1.0
        },
        weightsApplied: { wV: 0.35, wS: 0.35, wD: 0.15, wW: 0.15 },
        telemetry: {
          nearestStationId: 'chennai-guindy',
          stationName: 'Guindy Industrial Area - TNPCB',
          distanceKm: 0.28,
          pm25Current: 84.0,
          pm25BaselineMu: 48.0,
          pm25BaselineSigma: 15.0,
          windSpeedMps: 0.9,
          windDirectionDeg: 120,
          bearingReportToStationDeg: 210,
          activeFireCount: 0
        },
        provenance: {
          aiModel: 'Gemini-2.5-Flash',
          sensorSource: 'OPENAQ_LIVE',
          weatherSource: 'OPEN_METEO_LIVE',
          satelliteSource: 'NASA_FIRMS_LIVE',
          fallbacksTriggered: []
        },
        formulaString: 'R = min(100, 100 × (0.35×0.68 + 0.35×0.60 + 0.15×0.88 + 0.15×0.50)) = 62'
      },
      actionBrief: 'Elevated localized particulate suspension. Calm wind condition (0.9 m/s) limiting spatial dispersion. Anti-smog gun recommended.'
    };

    this.incidents.set(delhiIncident.id, delhiIncident);
    this.incidents.set(punjabIncident.id, punjabIncident);
    this.incidents.set(chennaiIncident.id, chennaiIncident);
  }
}

export const incidentStore = new IncidentStore();
