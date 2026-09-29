import React from 'react';
import { SpikeRiskForecast } from '../types/index.js';
import { Activity, AlertTriangle, Wind, Flame, CloudFog, X } from 'lucide-react';

interface RiskForecastPanelProps {
  forecast: SpikeRiskForecast | null;
  onClose: () => void;
}

export const RiskForecastPanel: React.FC<RiskForecastPanelProps> = ({ forecast, onClose }) => {
  if (!forecast) return null;

  const isHigh = forecast.riskLevel === 'HIGH';
  const isMed = forecast.riskLevel === 'MEDIUM';
  const riskColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '4.5rem',
        right: '440px',
        width: '340px',
        padding: '1.25rem',
        zIndex: 40,
        border: `1px solid ${riskColor}`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px ${riskColor}33`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={20} color={riskColor} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
              48h Atmospheric Risk Forecast
            </h3>
            <span style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--text-secondary)' }}>
              Region: {forecast.regionId.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.3rem'
          }}
        >
          <X size={17} />
        </button>
      </div>

      {/* Risk Level Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.7rem 0.95rem',
          borderRadius: '9px',
          background: `${riskColor}22`,
          border: `1px solid ${riskColor}55`,
          marginBottom: '1rem'
        }}
      >
        <span style={{ fontSize: '0.92rem', fontWeight: 850, color: riskColor, letterSpacing: '0.02em' }}>
          {forecast.riskLevel} SMOG TRAPPING RISK
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>
          {forecast.compositeRiskScore}/100
        </span>
      </div>

      <p style={{ fontSize: '0.88rem', fontWeight: 550, color: '#e2e8f0', lineHeight: 1.5, marginBottom: '1rem' }}>
        {forecast.explanation}
      </p>

      {/* Driver Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 650 }}>
          <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wind size={13} /> Stagnation / Boundary Layer
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 750, color: '#38bdf8' }}>
            {(forecast.drivers.stagnationIndex * 100).toFixed(0)}%
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 650 }}>
          <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Flame size={13} /> Upwind Thermal Fires (&lt;200km)
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 750, color: '#f59e0b' }}>
            {forecast.drivers.fireUpwindCount} Hotspots
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 650 }}>
          <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CloudFog size={13} /> CAMS Ambient Forecast
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 750, color: '#a78bfa' }}>
            {(forecast.drivers.forecastPmNormalized * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', fontWeight: 550, color: '#94a3b8', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', lineHeight: 1.4 }}>
        <em>* Atmospheric dispersion model estimate based on Open-Meteo & NASA FIRMS. Not a direct PM2.5 measurement.</em>
      </div>
    </div>
  );
};
