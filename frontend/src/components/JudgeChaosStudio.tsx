import React, { useState } from 'react';
import {
  X,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  ShieldAlert,
  Flame,
  Building2,
  Tractor,
  HardHat,
  Cpu,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { ChaosState, IncidentReport } from '../types/index.js';
import { toggleChaos, resetChaos, triggerSimulation } from '../services/api.js';
import { soundEffects } from '../services/soundEffects.js';

interface JudgeChaosStudioProps {
  isOpen: boolean;
  onClose: () => void;
  chaosState: ChaosState;
  onChaosChanged: (state: ChaosState) => void;
  onSimulationTriggered: (incident: IncidentReport) => void;
}

export const JudgeChaosStudio: React.FC<JudgeChaosStudioProps> = ({
  isOpen,
  onClose,
  chaosState,
  onChaosChanged,
  onSimulationTriggered
}) => {
  if (!isOpen) return null;

  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);

  const handleToggle = async (key: keyof ChaosState) => {
    soundEffects.playClick();
    const updated = await toggleChaos(key);
    onChaosChanged(updated);
  };

  const handleReset = async () => {
    soundEffects.playClick();
    const updated = await resetChaos();
    onChaosChanged(updated);
  };

  const handleSimulate = async (scenarioId: string) => {
    try {
      setLoadingScenario(scenarioId);
      soundEffects.playClick();
      const incident = await triggerSimulation(scenarioId);
      soundEffects.playSonarPing();
      onSimulationTriggered(incident);
    } catch (err) {
      console.error('Failed to trigger simulation:', err);
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 0 35px rgba(239, 68, 68, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.6rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sliders size={20} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
                Simulation Studio & Fault Injection
              </h2>
            </div>
            <p style={{ fontSize: '0.86rem', fontWeight: 550, color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Evaluate deterministic scenarios and test live API resilience
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-subtle)',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <X size={19} />
          </button>
        </div>

        {/* 1. Preset Scenarios Section */}
        <div style={{ marginBottom: '1.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Zap size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              1. Deterministic Demonstration Scenarios
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Scenario 1: Delhi */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.05rem 1.15rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Building2 size={24} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 750, color: '#f8fafc' }}>
                    Delhi Wazirpur Factory Stack Leak
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 550, color: '#cbd5e1', marginTop: '0.2rem' }}>
                    Extreme stack emission | Sensor 0.42km downwind | R = 92 (Verified)
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSimulate('delhi_stack_burst')}
                disabled={loadingScenario !== null}
                className="btn-primary"
                style={{ padding: '0.5rem 0.95rem', fontSize: '0.84rem', fontWeight: 750 }}
              >
                <Play size={14} />
                <span>Simulate Flare</span>
              </button>
            </div>

            {/* Scenario 2: Punjab */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.05rem 1.15rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Tractor size={24} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 750, color: '#f8fafc' }}>
                    Punjab Sangrur Stubble Fire Surge
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 550, color: '#cbd5e1', marginTop: '0.2rem' }}>
                    NASA VIIRS satellite thermal corroborated | R = 91 (+10 Fire Bonus)
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSimulate('punjab_stubble_surge')}
                disabled={loadingScenario !== null}
                className="btn-primary"
                style={{ padding: '0.5rem 0.95rem', fontSize: '0.84rem', fontWeight: 750, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <Play size={14} />
                <span>Simulate Stubble</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Chaos Engineering Killswitches */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#ef4444" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                2. Live Circuit-Breaker Fault Injections
              </h3>
            </div>

            <button
              onClick={handleReset}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              <RotateCcw size={14} />
              <span>Reset All</span>
            </button>
          </div>

          <p style={{ fontSize: '0.84rem', fontWeight: 550, color: '#cbd5e1', marginBottom: '1.1rem', lineHeight: 1.5 }}>
            Toggle off external APIs to test graceful degradation, dynamic weight shifting, and deterministic fallback heuristics in real time.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
            {/* Kill Gemini */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.05rem',
                border: chaosState.killGemini ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                background: chaosState.killGemini ? 'rgba(239, 68, 68, 0.16)' : 'rgba(30, 41, 59, 0.65)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 750, color: '#f8fafc' }}>Kill Gemini 2.5</div>
                <div style={{ fontSize: '0.80rem', fontWeight: 600, color: chaosState.killGemini ? '#fca5a5' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {chaosState.killGemini ? 'Fallback Heuristic Active' : 'Live AI Vision'}
                </div>
              </div>
              <button
                onClick={() => handleToggle('killGemini')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  background: chaosState.killGemini ? '#ef4444' : 'rgba(51, 65, 85, 0.85)',
                  color: '#fff'
                }}
              >
                {chaosState.killGemini ? 'KILLED' : 'ACTIVE'}
              </button>
            </div>

            {/* Kill OpenAQ */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.05rem',
                border: chaosState.killOpenAQ ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                background: chaosState.killOpenAQ ? 'rgba(239, 68, 68, 0.16)' : 'rgba(30, 41, 59, 0.65)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 750, color: '#f8fafc' }}>Kill OpenAQ Sensors</div>
                <div style={{ fontSize: '0.80rem', fontWeight: 600, color: chaosState.killOpenAQ ? '#fca5a5' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {chaosState.killOpenAQ ? 'Weight Shift to Visual' : 'Live Stations'}
                </div>
              </div>
              <button
                onClick={() => handleToggle('killOpenAQ')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  background: chaosState.killOpenAQ ? '#ef4444' : 'rgba(51, 65, 85, 0.85)',
                  color: '#fff'
                }}
              >
                {chaosState.killOpenAQ ? 'KILLED' : 'ACTIVE'}
              </button>
            </div>

            {/* Kill Weather */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.05rem',
                border: chaosState.killWeather ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                background: chaosState.killWeather ? 'rgba(239, 68, 68, 0.16)' : 'rgba(30, 41, 59, 0.65)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 750, color: '#f8fafc' }}>Kill Open-Meteo</div>
                <div style={{ fontSize: '0.80rem', fontWeight: 600, color: chaosState.killWeather ? '#fca5a5' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {chaosState.killWeather ? 'Calm Wind (W=0.5)' : 'Live Atmospheric'}
                </div>
              </div>
              <button
                onClick={() => handleToggle('killWeather')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  background: chaosState.killWeather ? '#ef4444' : 'rgba(51, 65, 85, 0.85)',
                  color: '#fff'
                }}
              >
                {chaosState.killWeather ? 'KILLED' : 'ACTIVE'}
              </button>
            </div>

            {/* Kill FIRMS */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.05rem',
                border: chaosState.killFirms ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                background: chaosState.killFirms ? 'rgba(239, 68, 68, 0.16)' : 'rgba(30, 41, 59, 0.65)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 750, color: '#f8fafc' }}>Kill NASA FIRMS</div>
                <div style={{ fontSize: '0.80rem', fontWeight: 600, color: chaosState.killFirms ? '#fca5a5' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {chaosState.killFirms ? 'Zero Thermal Fire Bonus' : 'Live Satellite VIIRS'}
                </div>
              </div>
              <button
                onClick={() => handleToggle('killFirms')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  background: chaosState.killFirms ? '#ef4444' : 'rgba(51, 65, 85, 0.85)',
                  color: '#fff'
                }}
              >
                {chaosState.killFirms ? 'KILLED' : 'ACTIVE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
