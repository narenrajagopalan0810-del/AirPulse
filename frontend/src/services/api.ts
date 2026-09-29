import {
  ChaosState,
  IncidentReport,
  RegionConfig,
  ReportStatus,
  SpikeRiskForecast
} from '../types/index.js';

const API_BASE = '/api';

export async function fetchIncidents(regionId?: string): Promise<IncidentReport[]> {
  const url = regionId && regionId !== 'all' ? `${API_BASE}/reports?region=${regionId}` : `${API_BASE}/reports`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  const data = await res.json();
  return data.reports || [];
}

export async function fetchRegions(): Promise<RegionConfig[]> {
  const res = await fetch(`${API_BASE}/regions`);
  if (!res.ok) throw new Error('Failed to fetch regions');
  const data = await res.json();
  return data.regions || [];
}

export async function fetchForecast(regionId: string): Promise<SpikeRiskForecast> {
  const res = await fetch(`${API_BASE}/forecast?region=${regionId}`);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  const data = await res.json();
  return data.forecast;
}

export async function submitReport(payload: {
  latitude: number;
  longitude: number;
  imageBase64: string;
  mimeType?: string;
  userDescription?: string;
  userAudioBase64?: string;
  audioMimeType?: string;
  language?: 'en' | 'hi' | 'ta';
  regionId?: string;
}): Promise<{ success: boolean; incident?: IncidentReport; rejected?: boolean; reason?: string }> {
  const res = await fetch(`${API_BASE}/reports/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function updateAlertStatus(
  id: string,
  status: ReportStatus,
  officer: string,
  note?: string
): Promise<IncidentReport> {
  const res = await fetch(`${API_BASE}/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, officer, note })
  });
  if (!res.ok) throw new Error('Failed to update alert');
  const data = await res.json();
  return data.incident;
}

export async function fetchChaosState(): Promise<ChaosState> {
  const res = await fetch(`${API_BASE}/chaos`);
  if (!res.ok) throw new Error('Failed to fetch chaos state');
  const data = await res.json();
  return data.state;
}

export async function toggleChaos(key: keyof ChaosState): Promise<ChaosState> {
  const res = await fetch(`${API_BASE}/chaos/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  if (!res.ok) throw new Error('Failed to toggle chaos switch');
  const data = await res.json();
  return data.state;
}

export async function resetChaos(): Promise<ChaosState> {
  const res = await fetch(`${API_BASE}/chaos/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset chaos switches');
  const data = await res.json();
  return data.state;
}

export async function triggerSimulation(scenarioId: string): Promise<IncidentReport> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId })
  });
  if (!res.ok) throw new Error('Failed to trigger simulation scenario');
  const data = await res.json();
  return data.incident;
}

/**
 * Subscribes to real-time Server-Sent Events stream from the backend.
 */
export function subscribeToEvents(handlers: {
  onIncidentCreated?: (incident: IncidentReport) => void;
  onIncidentUpdated?: (incident: IncidentReport) => void;
  onChaosChanged?: (state: ChaosState) => void;
  onConnectionChange?: (connected: boolean) => void;
}) {
  const eventSource = new EventSource(`${API_BASE}/events`);

  eventSource.onopen = () => {
    handlers.onConnectionChange?.(true);
  };

  eventSource.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'INCIDENT_CREATED') {
        handlers.onIncidentCreated?.(message.payload);
      } else if (message.type === 'INCIDENT_UPDATED') {
        handlers.onIncidentUpdated?.(message.payload);
      } else if (message.type === 'CHAOS_STATE_CHANGED') {
        handlers.onChaosChanged?.(message.payload);
      }
    } catch {
      // Keepalive or unparseable event
    }
  };

  eventSource.onerror = () => {
    handlers.onConnectionChange?.(false);
  };

  return () => {
    eventSource.close();
  };
}
