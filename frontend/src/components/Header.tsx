import React from 'react';
import {
  Activity,
  Radio,
  Sliders,
  PlusCircle,
  Wind,
  Map as MapIcon,
  Compass,
  Home
} from 'lucide-react';
import { RegionConfig } from '../types/index.js';
import { soundEffects } from '../services/soundEffects.js';

interface HeaderProps {
  currentTab: 'overview' | 'command';
  onSelectTab: (tab: 'overview' | 'command') => void;
  regions: RegionConfig[];
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
  isSseConnected: boolean;
  onOpenReportModal: () => void;
  onOpenChaosModal: () => void;
  onToggleForecast: () => void;
  showForecast: boolean;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  regions,
  selectedRegionId,
  onSelectRegion,
  isSseConnected,
  onOpenReportModal,
  onOpenChaosModal,
  onToggleForecast,
  showForecast,
  criticalCount
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.75rem',
        background: 'rgba(11, 17, 32, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand & Editorial Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div
          onClick={() => {
            soundEffects.playClick();
            onSelectTab('overview');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Wind size={18} color="#e0f2fe" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#f8fafc'
                }}
              >
                AirPulse
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', fontWeight: 550, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
              Atmospheric Telemetry & Environmental Triage
            </p>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '0.25rem',
            borderRadius: '9px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            onClick={() => {
              soundEffects.playClick();
              onSelectTab('overview');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.48rem 0.95rem',
              borderRadius: '7px',
              fontSize: '0.86rem',
              fontWeight: currentTab === 'overview' ? 700 : 600,
              fontFamily: 'var(--font-sans)',
              border: 'none',
              cursor: 'pointer',
              background: currentTab === 'overview' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
              color: currentTab === 'overview' ? '#bfdbfe' : 'var(--text-secondary)',
              transition: 'all 0.18s ease'
            }}
          >
            <Home size={15} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              onSelectTab('command');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.48rem 0.95rem',
              borderRadius: '7px',
              fontSize: '0.86rem',
              fontWeight: currentTab === 'command' ? 700 : 600,
              fontFamily: 'var(--font-sans)',
              border: 'none',
              cursor: 'pointer',
              background: currentTab === 'command' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
              color: currentTab === 'command' ? '#bfdbfe' : 'var(--text-secondary)',
              transition: 'all 0.18s ease'
            }}
          >
            <MapIcon size={15} />
            <span>Command Center</span>
          </button>
        </div>
      </div>

      {/* Center: Live Telemetry Indicator & Region Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.35rem' }}>
        {/* Calm Connection Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: isSseConnected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${isSseConnected ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isSseConnected ? '#38bdf8' : '#f87171'
            }}
          />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 650,
              fontFamily: 'var(--font-mono)',
              color: isSseConnected ? '#e0f2fe' : '#fca5a5'
            }}
          >
            {isSseConnected ? 'TELEMETRY STREAM ACTIVE' : 'RECONNECTING'}
          </span>
        </div>

        {/* Region Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={15} color="#94a3b8" />
          <select
            value={selectedRegionId}
            onChange={(e) => onSelectRegion(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              padding: '0.42rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          >
            <option value="all">All Monitoring Regions</option>
            {regions.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.name}
              </option>
            ))}
          </select>
        </div>

        {criticalCount > 0 && (
          <div
            className="badge badge-critical"
            style={{ padding: '0.35rem 0.85rem', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 750 }}
          >
            <span>{criticalCount} Critical Events</span>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onToggleForecast}
          className="btn-secondary"
          style={{
            padding: '0.55rem 0.95rem',
            fontSize: '0.85rem',
            fontWeight: 650,
            borderColor: showForecast ? 'var(--blue-accent)' : 'var(--border-subtle)',
            background: showForecast ? 'rgba(37, 99, 235, 0.2)' : 'rgba(23, 37, 68, 0.6)'
          }}
        >
          <Activity size={15} color={showForecast ? '#93c5fd' : '#94a3b8'} />
          <span>Risk Forecast</span>
        </button>

        <button onClick={onOpenReportModal} className="btn-primary" style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem', fontWeight: 750 }}>
          <PlusCircle size={15} />
          <span>Report Incident</span>
        </button>

        <button
          onClick={onOpenChaosModal}
          className="btn-secondary"
          style={{
            padding: '0.55rem 0.95rem',
            fontSize: '0.85rem',
            fontWeight: 650
          }}
          title="Simulation Studio & Fault Injection"
        >
          <Sliders size={15} color="#94a3b8" />
          <span>Simulation Studio</span>
        </button>
      </div>
    </header>
  );
};
