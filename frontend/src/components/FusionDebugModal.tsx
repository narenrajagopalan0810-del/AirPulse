import React from 'react';
import { IncidentReport } from '../types/index.js';
import { X, Cpu, Gauge, Compass, Satellite, CheckCircle, AlertTriangle } from 'lucide-react';

interface FusionDebugModalProps {
  incident: IncidentReport | null;
  onClose: () => void;
}

export const FusionDebugModal: React.FC<FusionDebugModalProps> = ({ incident, onClose }) => {
  if (!incident) return null;

  const { fusionResults, geminiAnalysis } = incident;
  const { components, weightsApplied, telemetry, provenance } = fusionResults;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          background: 'rgba(11, 15, 23, 0.95)',
          border: '1px solid var(--border-active)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Cpu size={22} color="#60a5fa" />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', fontWeight: 650, color: '#f8fafc' }}>
                Mathematical Telemetry Model (/debug)
              </h2>
            </div>
            <p style={{ fontSize: '0.86rem', fontWeight: 550, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Transparent decomposition of Evidence Confidence Score (R-Score)
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(23, 37, 68, 0.65)',
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

        {/* The Glass-Box Formula Callout */}
        <div
          style={{
            background: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid rgba(96, 165, 250, 0.35)',
            borderRadius: '11px',
            padding: '1.15rem',
            marginBottom: '1.6rem'
          }}
        >
          <div style={{ fontSize: '0.80rem', color: '#93c5fd', fontWeight: 750, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
            EVIDENCE FUSION EQUATION (SUBSTITUTED VALUES)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc', wordBreak: 'break-all', lineHeight: 1.5 }}>
            {fusionResults.formulaString}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.84rem', fontWeight: 600, color: '#cbd5e1' }}>
            <span>Weight Mode: <strong style={{ color: '#f8fafc', fontWeight: 750 }}>{fusionResults.weightMode}</strong></span>
            <span>Evidence Tier: <strong style={{ color: '#93c5fd', fontWeight: 750 }}>{fusionResults.evidenceTier}</strong></span>
            <span>Priority: <strong style={{ color: fusionResults.priorityClass === 'CRITICAL' ? '#f87171' : '#fbbf24', fontWeight: 800 }}>{fusionResults.priorityClass}</strong></span>
          </div>
        </div>

        {/* The 4 Decomposed Dimension Bars: V, S, D, W */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginBottom: '1.6rem' }}>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 750, color: '#f8fafc' }}>
            Multi-Source Corroboration Dimensions
          </h3>

          {/* V: Gemini Visual Evidence */}
          <div className="glass-card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-provenance">Gemini 2.5 Flash</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>V (Visual Evidence Score)</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 750, color: '#93c5fd' }}>
                {components.V} × {weightsApplied.wV} = {(components.V * weightsApplied.wV).toFixed(3)}
              </span>
            </div>
            <div style={{ height: '9px', background: 'rgba(23, 37, 68, 0.85)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${components.V * 100}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 550, color: '#cbd5e1', marginTop: '0.5rem', lineHeight: 1.45 }}>
              {geminiAnalysis.visualContext}
            </p>
          </div>

          {/* S: Ground Sensor Anomaly */}
          <div className="glass-card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-provenance">{provenance.sensorSource}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>S (Station Z-Score Anomaly)</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 750, color: '#38bdf8' }}>
                {components.S} × {weightsApplied.wS} = {(components.S * weightsApplied.wS).toFixed(3)}
              </span>
            </div>
            <div style={{ height: '9px', background: 'rgba(30, 41, 59, 0.85)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${components.S * 100}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 650, color: '#94a3b8', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              S = clamp(({telemetry.pm25Current} - {telemetry.pm25BaselineMu}) / (3 × {telemetry.pm25BaselineSigma}), 0, 1) = {components.S}
            </div>
          </div>

          {/* D: Spatial Distance Attenuation */}
          <div className="glass-card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-provenance">Geodesic Haversine</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>D (Distance Attenuation)</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 750, color: '#a78bfa' }}>
                {components.D} × {weightsApplied.wD} = {(components.D * weightsApplied.wD).toFixed(3)}
              </span>
            </div>
            <div style={{ height: '9px', background: 'rgba(30, 41, 59, 0.85)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${components.D * 100}%`, height: '100%', background: 'linear-gradient(90deg, #818cf8, #a78bfa)' }} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 650, color: '#94a3b8', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              D = exp(-{telemetry.distanceKm} km / 2.0) = {components.D} (Station: {telemetry.stationName})
            </div>
          </div>

          {/* W: Atmospheric Wind Alignment */}
          <div className="glass-card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-provenance">{provenance.weatherSource}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>W (Wind-to-Station Alignment)</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 750, color: '#34d399' }}>
                {components.W} × {weightsApplied.wW} = {(components.W * weightsApplied.wW).toFixed(3)}
              </span>
            </div>
            <div style={{ height: '9px', background: 'rgba(30, 41, 59, 0.85)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${components.W * 100}%`, height: '100%', background: 'linear-gradient(90deg, #34d399, #10b981)' }} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 650, color: '#94a3b8', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              Wind: {telemetry.windSpeedMps} m/s from {telemetry.windDirectionDeg}° | Bearing report→station: {telemetry.bearingReportToStationDeg}°
            </div>
          </div>

          {/* Satellite Bonus if present */}
          {components.fireBonus > 0 && (
            <div className="glass-card" style={{ padding: '1.1rem', borderColor: 'rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Satellite size={18} color="#ef4444" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f87171' }}>NASA FIRMS Satellite Thermal Bonus</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.98rem', fontWeight: 900, color: '#ef4444' }}>
                  +10 Points Applied
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 550, color: '#cbd5e1', marginTop: '0.5rem' }}>
                {telemetry.activeFireCount} active thermal fire detection(s) corroborated within 5 km of the incident location.
              </p>
            </div>
          )}
        </div>

        {/* Provenance Audit Checklist */}
        <div style={{ marginTop: '1.4rem', paddingTop: '1.15rem', borderTop: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Active Data Provenance & Fallback Audit
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 650, color: '#f1f5f9' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>AI Engine: <strong style={{ color: '#93c5fd' }}>{provenance.aiModel}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 650, color: '#f1f5f9' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Sensor Feed: <strong style={{ color: '#38bdf8' }}>{provenance.sensorSource}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 650, color: '#f1f5f9' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Weather Feed: <strong style={{ color: '#34d399' }}>{provenance.weatherSource}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 650, color: '#f1f5f9' }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Satellite: <strong style={{ color: '#fbbf24' }}>{provenance.satelliteSource}</strong></span>
            </div>
          </div>

          {provenance.fallbacksTriggered.length > 0 && (
            <div style={{ marginTop: '0.9rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.84rem', fontWeight: 800 }}>
                <AlertTriangle size={15} />
                <span>Graceful Resilience Fallbacks Active:</span>
              </div>
              <ul style={{ paddingLeft: '1.35rem', marginTop: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#fde68a' }}>
                {provenance.fallbacksTriggered.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
