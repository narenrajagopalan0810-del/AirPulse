import { Request, Response } from 'express';
import { z } from 'zod';
import { geminiService } from '../ai/geminiService.js';
import { sensorService } from '../data/sensorService.js';
import { weatherService } from '../data/weatherService.js';
import { fireService } from '../data/fireService.js';
import { computeEvidenceScore } from '../fusion/evidenceEngine.js';
import { calculateBearingDeg, calculateHaversineDistanceKm } from '../fusion/physicsMetrics.js';
import { incidentStore } from '../data/incidentStore.js';
import { sseBus } from '../realtime/sseBus.js';
import { chaosManager } from '../infrastructure/chaosManager.js';
import { IncidentReport } from '../types/index.js';

const processReportSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  imageBase64: z.string().min(20, 'Image data is required'),
  mimeType: z.string().default('image/jpeg'),
  userDescription: z.string().optional(),
  userAudioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
  language: z.enum(['en', 'hi', 'ta']).default('en'),
  regionId: z.string().default('delhi')
});

export async function processReport(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = processReportSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.format()
      });
      return;
    }

    const {
      latitude,
      longitude,
      imageBase64,
      mimeType,
      userDescription,
      userAudioBase64,
      audioMimeType,
      language,
      regionId
    } = parseResult.data;

    const chaos = chaosManager.getState();
    const fallbacksTriggered: string[] = [];

    // 1. Multimodal Evidence Analysis via Gemini 2.5 Flash
    const aiAnalysis = await geminiService.analyzeEvidence(
      imageBase64,
      mimeType,
      userDescription,
      userAudioBase64,
      audioMimeType,
      chaos.killGemini
    );

    if (aiAnalysis.fallbackUsed && aiAnalysis.fallbackReason) {
      fallbacksTriggered.push(aiAnalysis.fallbackReason);
    }

    const geminiResult = aiAnalysis.result;

    // 2. Reject non-pollution or spoofed images
    if (!geminiResult.isValidPollutionImage) {
      res.status(422).json({
        success: false,
        rejected: true,
        reason: 'Image does not contain verifiable environmental emission evidence or was rejected by anti-spoof filter.',
        geminiAnalysis: geminiResult
      });
      return;
    }

    // 3. Parallel Ingestion: Ground Station, Atmospheric Wind, Satellite Hotspots
    const [stationRes, weatherRes, fireRes] = await Promise.all([
      sensorService.getStationReading(latitude, longitude, regionId, chaos.killOpenAQ),
      weatherService.getWeatherData(latitude, longitude, chaos.killWeather),
      fireService.getActiveFiresNear(latitude, longitude, 5.0, chaos.killFirms)
    ]);

    if (stationRes.fallbackUsed && stationRes.fallbackReason) {
      fallbacksTriggered.push(stationRes.fallbackReason);
    }
    if (weatherRes.fallbackUsed && weatherRes.fallbackReason) {
      fallbacksTriggered.push(weatherRes.fallbackReason);
    }
    if (fireRes.fallbackUsed && fireRes.fallbackReason) {
      fallbacksTriggered.push(fireRes.fallbackReason);
    }

    const station = stationRes.data;
    const weather = weatherRes.data;
    const fires = fireRes.fires;

    // 4. Geospatial Physics Calculations
    const distanceKm = calculateHaversineDistanceKm(latitude, longitude, station.latitude, station.longitude);
    const bearingReportToStationDeg = calculateBearingDeg(latitude, longitude, station.latitude, station.longitude);

    // 5. Deterministic Fusion Evidence Computation
    const fusionResults = computeEvidenceScore({
      visualScoreV: geminiResult.visualEvidenceScore,
      sourceType: geminiResult.sourceType,
      distanceKm,
      pm25Now: station.pm25,
      baselineMu: station.baselineMu,
      baselineSigma: station.baselineSigma,
      windFromDeg: weather.windDirectionDeg,
      windSpeedMps: weather.windSpeedMps,
      bearingReportToStationDeg,
      activeFirmsDetectionsNearReport: fires.length,
      nearestStationId: station.stationId,
      stationName: station.name,
      provenance: {
        aiModel: aiAnalysis.fallbackUsed ? 'Deterministic-Lookup' : 'Gemini-2.5-Flash',
        sensorSource: station.source,
        weatherSource: weather.source,
        satelliteSource: fireRes.fallbackUsed ? 'CACHE_FALLBACK' : 'NASA_FIRMS_LIVE',
        fallbacksTriggered
      }
    });

    // 6. Action Brief Synthesis
    const actionBrief = `Priority ${fusionResults.priorityClass} (${fusionResults.compositeScore}/100) — ${geminiResult.sourceType.replace('_', ' ')}. Station '${station.name}' ${distanceKm.toFixed(1)}km away recorded PM2.5 at ${station.pm25.toFixed(0)} µg/m³. Wind: ${weather.windSpeedMps} m/s from ${weather.windDirectionDeg}°. Verified under ${fusionResults.evidenceTier} tier.`;

    // 7. Persist Incident & Dispatch via SSE
    const incident: IncidentReport = {
      id: `inc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      regionId,
      latitude,
      longitude,
      imageUrl: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`,
      userDescription,
      language,
      timestamp: new Date().toISOString(),
      status: 'NEW',
      actionLog: [
        {
          timestamp: new Date().toISOString(),
          action: 'Incident processed & verified by Fusion Engine',
          officer: 'AirPulse AI Engine'
        }
      ],
      geminiAnalysis: geminiResult,
      fusionResults,
      actionBrief
    };

    incidentStore.save(incident);
    sseBus.broadcastIncidentCreated(incident);

    res.status(201).json({
      success: true,
      incident
    });
  } catch (error: any) {
    console.error('Error processing report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing report',
      message: error?.message || 'Unknown error'
    });
  }
}
