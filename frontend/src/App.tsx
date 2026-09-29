import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { HeroLanding } from './components/HeroLanding.js';
import { MapView } from './components/MapView.js';
import { IncidentList } from './components/IncidentList.js';
import { IncidentDetailModal } from './components/IncidentDetailModal.js';
import { FusionDebugModal } from './components/FusionDebugModal.js';
import { CitizenReportModal } from './components/CitizenReportModal.js';
import { JudgeChaosStudio } from './components/JudgeChaosStudio.js';
import { RiskForecastPanel } from './components/RiskForecastPanel.js';
import { ParticleBackground } from './components/ParticleBackground.js';
import {
  fetchIncidents,
  fetchRegions,
  fetchForecast,
  fetchChaosState,
  subscribeToEvents
} from './services/api.js';
import { soundEffects } from './services/soundEffects.js';
import {
  ChaosState,
  IncidentReport,
  RegionConfig,
  SpikeRiskForecast
} from './types/index.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'command'>('overview');
  const [regions, setRegions] = useState<RegionConfig[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('delhi');
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);

  // Modals & Panels
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChaosModalOpen, setIsChaosModalOpen] = useState(false);
  const [debugIncident, setDebugIncident] = useState<IncidentReport | null>(null);
  const [forecast, setForecast] = useState<SpikeRiskForecast | null>(null);
  const [showForecast, setShowForecast] = useState(false);

  // System & Connection State
  const [isSseConnected, setIsSseConnected] = useState(false);
  const [chaosState, setChaosState] = useState<ChaosState>({
    killGemini: false,
    killOpenAQ: false,
    killWeather: false,
    killFirms: false
  });

  // Current active region config
  const currentRegion: RegionConfig =
    regions.find((r) => r.id === selectedRegionId) ||
    regions[0] || {
      id: 'delhi',
      name: 'Delhi NCR, India',
      bbox: [76.84, 28.4, 77.35, 28.88],
      center: [28.6139, 77.209],
      defaultZoom: 12,
      primaryLanguages: ['en', 'hi'],
      stations: []
    };

  // Weather telemetry for the map (derived from latest incident or region default)
  const currentWindSpeed = incidents[0]?.fusionResults.telemetry.windSpeedMps || 3.2;
  const currentWindDirection = incidents[0]?.fusionResults.telemetry.windDirectionDeg || 270;

  // Initial Data Ingestion
  useEffect(() => {
    async function init() {
      try {
        const [regs, initialIncidents, initialChaos] = await Promise.all([
          fetchRegions(),
          fetchIncidents(selectedRegionId),
          fetchChaosState()
        ]);
        setRegions(regs);
        setIncidents(initialIncidents);
        setChaosState(initialChaos);
      } catch (err) {
        console.error('Initialization failed:', err);
      }
    }
    init();
  }, []);

  // Update incidents & forecast when region changes
  useEffect(() => {
    async function loadRegionData() {
      try {
        const list = await fetchIncidents(selectedRegionId);
        setIncidents(list);
        if (selectedRegionId !== 'all') {
          const fc = await fetchForecast(selectedRegionId);
          setForecast(fc);
        }
      } catch (err) {
        console.error('Failed to load region data:', err);
      }
    }
    loadRegionData();
  }, [selectedRegionId]);

  // Real-time Server-Sent Events Subscription
  useEffect(() => {
    const unsubscribe = subscribeToEvents({
      onConnectionChange: (connected) => setIsSseConnected(connected),
      onIncidentCreated: (newIncident) => {
        setIncidents((prev) => [newIncident, ...prev]);

        // If Critical priority, trigger high-tech sonar alert
        if (newIncident.fusionResults.priorityClass === 'CRITICAL') {
          soundEffects.playSonarPing();
        }
      },
      onIncidentUpdated: (updatedIncident) => {
        setIncidents((prev) =>
          prev.map((item) => (item.id === updatedIncident.id ? updatedIncident : item))
        );
        if (selectedIncident?.id === updatedIncident.id) {
          setSelectedIncident(updatedIncident);
        }
      },
      onChaosChanged: (newChaos) => {
        setChaosState(newChaos);
      }
    });

    return () => unsubscribe();
  }, [selectedIncident]);

  const criticalCount = incidents.filter(
    (inc) => inc.fusionResults.priorityClass === 'CRITICAL' && inc.status !== 'RESOLVED'
  ).length;

  return (
    <div className="app-viewport">
      {/* React Bits Cyber Particle Background */}
      <ParticleBackground interactive={true} />

      {/* Tactical Status & Action Header */}
      <Header
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        regions={regions}
        selectedRegionId={selectedRegionId}
        onSelectRegion={setSelectedRegionId}
        isSseConnected={isSseConnected}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenChaosModal={() => setIsChaosModalOpen(true)}
        onToggleForecast={() => setShowForecast(!showForecast)}
        showForecast={showForecast}
        criticalCount={criticalCount}
      />

      {/* Body View Switching: Hero Landing vs Live Command Center */}
      {activeTab === 'overview' ? (
        <HeroLanding
          onLaunchCommand={() => setActiveTab('command')}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenChaosModal={() => setIsChaosModalOpen(true)}
          onOpenFusionDebug={() => {
            if (incidents.length > 0) {
              setDebugIncident(incidents[0]);
            }
          }}
        />
      ) : (
        <main className="main-content" style={{ zIndex: 10 }}>
          {/* Left: GIS Map View with Particle Wind Streamlines & Pulse Markers */}
          <MapView
            region={currentRegion}
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
            windSpeedMps={currentWindSpeed}
            windDirectionDeg={currentWindDirection}
          />

          {/* Right: Real-time Incident Triage Kanban & Feed */}
          <IncidentList
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
            onOpenFusionDebug={setDebugIncident}
          />

          {/* Floating Atmospheric Risk Forecast Card */}
          {showForecast && (
            <RiskForecastPanel forecast={forecast} onClose={() => setShowForecast(false)} />
          )}
        </main>
      )}

      {/* Incident Detail & Triage Enforcement Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={(updated) => {
            setSelectedIncident(updated);
            setIncidents((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          }}
          onOpenFusionDebug={(inc) => {
            setSelectedIncident(null);
            setDebugIncident(inc);
          }}
        />
      )}

      {/* The Glass-Box /fusion-debug Mathematical Audit Modal */}
      {debugIncident && (
        <FusionDebugModal incident={debugIncident} onClose={() => setDebugIncident(null)} />
      )}

      {/* Citizen Vernacular PWA Reporting Modal */}
      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentRegion={currentRegion}
        onReportCreated={(newInc) => {
          setSelectedRegionId(newInc.regionId);
          setSelectedIncident(newInc);
          setActiveTab('command');
        }}
      />

      {/* Judge Chaos Studio & Preset Simulator */}
      <JudgeChaosStudio
        isOpen={isChaosModalOpen}
        onClose={() => setIsChaosModalOpen(false)}
        chaosState={chaosState}
        onChaosChanged={setChaosState}
        onSimulationTriggered={(newInc) => {
          setSelectedRegionId(newInc.regionId);
          setSelectedIncident(newInc);
          setActiveTab('command');
        }}
      />
    </div>
  );
};
