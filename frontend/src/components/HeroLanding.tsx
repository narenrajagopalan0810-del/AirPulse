import React, { useState } from 'react';
import {
  ArrowRight,
  Wind,
  Cpu,
  Radio,
  Sliders,
  CheckCircle,
  ExternalLink,
  Camera,
  Activity,
  Layers,
  Compass,
  FileCheck
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects.js';

interface HeroLandingProps {
  onLaunchCommand: () => void;
  onOpenReportModal: () => void;
  onOpenChaosModal: () => void;
  onOpenFusionDebug: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onLaunchCommand,
  onOpenReportModal,
  onOpenChaosModal,
  onOpenFusionDebug
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      badge: '01 / Reporting',
      title: 'Citizen Vernacular Reporting',
      icon: <Camera size={20} color="#38bdf8" />,
      desc: 'Citizens capture hyper-local emissions in under three taps. The platform accepts spoken reports in Hindi, Tamil, and English, applying client-side WebP compression and tamper-resistant GPS metadata extraction.',
      highlight: '3-Tap Capture · Vernacular Voice · Location Verification'
    },
    {
      id: 2,
      badge: '02 / Evidence Analysis',
      title: 'Multimodal Visual Verification',
      icon: <Cpu size={20} color="#60a5fa" />,
      desc: 'Multimodal vision models inspect submitted imagery for authentic combustion plumes, flame signatures, and industrial stacks. Digital screen re-photographing and spoofing artifacts are filtered out before scoring.',
      highlight: 'Anti-Spoof Screening · Structured Schemas · Multilingual Context'
    },
    {
      id: 3,
      badge: '03 / Telemetry Fusion',
      title: 'Atmospheric Transport & Dispersion Physics',
      icon: <Wind size={20} color="#93c5fd" />,
      desc: 'Rather than estimating particulate levels from camera pixels, deterministic equations fuse the nearest station z-score anomaly with spatial distance attenuation, wind transport vectors, and satellite thermal detections.',
      highlight: 'Deterministic Mathematics · Zero Pixel-PM2.5 Hallucination'
    },
    {
      id: 4,
      badge: '04 / Triage Dispatch',
      title: 'Sub-Second Enforcement Case Management',
      icon: <Radio size={20} color="#60a5fa" />,
      desc: 'Live telemetry updates are broadcast to the command interface in under two seconds. Municipal officers receive concise action briefs, complete mathematical provenance, and one-click dispatch controls.',
      highlight: 'Sub-2s SSE Dispatch · Auditory Signals · Case Management'
    }
  ];

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: 'calc(100vh - 70px)',
        overflowY: 'auto',
        padding: '3rem 2rem 5rem',
        maxWidth: '1180px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4.5rem'
      }}
    >
      {/* 1. Hero Main Section - Claude-like Editorial Hierarchy */}
      <section style={{ textAlign: 'center', maxWidth: '880px', margin: '1rem auto 0' }}>
        {/* Subtle Category Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            borderRadius: '9999px',
            background: 'rgba(37, 99, 235, 0.1)',
            border: '1px solid rgba(96, 165, 250, 0.25)',
            marginBottom: '1.75rem'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#93c5fd',
              letterSpacing: '0.04em'
            }}
          >
            AIRPULSE · ATMOSPHERIC TELEMETRY SYSTEM
          </span>
        </div>

        {/* Editorial Serif Display Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            marginBottom: '1.5rem',
            color: '#f8fafc'
          }}
        >
          Clear, verifiable evidence for <br />
          <span style={{ fontStyle: 'italic', color: '#93c5fd' }}>
            environmental enforcement.
          </span>
        </h1>

        {/* Thoughtful, Grounded Subhead */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.05rem, 1.7vw, 1.22rem)',
            color: '#cbd5e1',
            lineHeight: 1.7,
            maxWidth: '780px',
            margin: '0 auto 2.5rem',
            fontWeight: 500
          }}
        >
          Official continuous monitoring stations are kilometers apart, leaving municipal teams blind to localized industrial leaks, open waste combustion, and crop fires.
          <strong style={{ color: '#f8fafc', fontWeight: 700 }}> AirPulse</strong> fuses citizen reports with atmospheric transport physics and satellite thermal feeds to turn uncorroborated alerts into verifiable, regulatory actions.
        </p>

        {/* Restrained Button Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.85rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => {
              soundEffects.playClick();
              onLaunchCommand();
            }}
            className="btn-primary"
            style={{
              padding: '0.85rem 1.8rem',
              fontSize: '0.98rem',
              fontWeight: 650,
              borderRadius: '11px'
            }}
          >
            <span>Launch Command Center</span>
            <ArrowRight size={17} />
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenReportModal();
            }}
            className="btn-secondary"
            style={{
              padding: '0.85rem 1.6rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: '11px'
            }}
          >
            <Camera size={17} color="#60a5fa" />
            <span>Submit Citizen Report</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenChaosModal();
            }}
            className="btn-secondary"
            style={{
              padding: '0.85rem 1.4rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: '11px'
            }}
          >
            <Sliders size={17} color="#94a3b8" />
            <span>Simulation Studio</span>
          </button>
        </div>
      </section>

      {/* 2. Key Metrics Bar - Grounded in Science */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.6rem 1.35rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>
            ≤ 15s
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
            Verification Latency
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 500 }}>
            Ingestion, validation, and spatial fusion
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.6rem 1.35rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
            100%
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
            Provenance Traceability
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 500 }}>
            Every output explicitly labeled by provider
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.6rem 1.35rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            0%
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
            Pixel Estimation
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 500 }}>
            No unvalidated PM2.5 guesses from images
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.6rem 1.35rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#bfdbfe', fontFamily: 'var(--font-mono)' }}>
            3
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
            Monitoring Regions
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 500 }}>
            Delhi NCR, Punjab Agricultural, Chennai
          </div>
        </div>
      </section>

      {/* 3. The 4-Step Scientific Pipeline */}
      <section className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-provenance" style={{ marginBottom: '0.6rem' }}>
            ARCHITECTURE OVERVIEW
          </span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 500, color: '#f8fafc' }}>
            The AirPulse Verification Pipeline
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            From field observation to verified dispatch in four deliberate stages.
          </p>
        </div>

        {/* Step Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem'
          }}
        >
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                soundEffects.playClick();
                setActiveStep(idx);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeStep === idx ? 'var(--blue-accent)' : 'var(--border-subtle)',
                background: activeStep === idx ? 'rgba(37, 99, 235, 0.16)' : 'rgba(15, 23, 42, 0.4)',
                color: activeStep === idx ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ opacity: activeStep === idx ? 1 : 0.65 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '0.78rem', color: activeStep === idx ? '#93c5fd' : 'var(--text-secondary)', fontWeight: 700 }}>
                  {s.badge}
                </div>
                <div style={{ fontSize: '0.90rem', fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title.split(' ')[0]}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Stage Spotlight Card */}
        <div
          className="glass-card"
          style={{
            padding: '2.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '2.25rem',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid var(--border-medium)'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                color: '#93c5fd',
                fontWeight: 750,
                letterSpacing: '0.03em'
              }}
            >
              STAGE {steps[activeStep].badge}
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 650, color: '#f8fafc', marginTop: '0.35rem', marginBottom: '0.85rem' }}>
              {steps[activeStep].title}
            </h3>
            <p style={{ fontSize: '0.98rem', fontWeight: 550, color: '#cbd5e1', lineHeight: 1.65, marginBottom: '1.4rem' }}>
              {steps[activeStep].desc}
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.16)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                color: '#e0f2fe',
                fontSize: '0.84rem',
                fontWeight: 650,
                fontFamily: 'var(--font-mono)'
              }}
            >
              <CheckCircle size={15} color="#60a5fa" />
              <span>{steps[activeStep].highlight}</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(11, 17, 32, 0.95)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ fontSize: '0.80rem', color: '#cbd5e1', fontWeight: 750, letterSpacing: '0.04em' }}>
              DATA SOURCES & CONTRACTS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Visual Verification:</span>
              <span style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Gemini Multimodal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Meteorology:</span>
              <span style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Open-Meteo API</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Thermal Satellites:</span>
              <span style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>NASA FIRMS VIIRS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ground Monitoring:</span>
              <span style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>OpenAQ CAAQMS</span>
            </div>
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenFusionDebug();
              }}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '0.45rem', fontSize: '0.84rem', fontWeight: 700, justifyContent: 'center' }}
            >
              <span>Inspect Mathematical Model</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Grounded Scientific Comparison Matrix */}
      <section className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 650, color: '#f8fafc' }}>
            System Methodology Comparison
          </h2>
          <p style={{ fontSize: '0.90rem', fontWeight: 550, color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            How AirPulse compares against common heuristic approaches.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.90rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#cbd5e1', fontSize: '0.92rem', fontWeight: 750 }}>
                <th style={{ padding: '0.9rem 1.15rem' }}>Methodological Dimension</th>
                <th style={{ padding: '0.9rem 1.15rem', color: '#94a3b8' }}>Uncalibrated Pixel Estimation</th>
                <th style={{ padding: '0.9rem 1.15rem', color: '#93c5fd' }}>AirPulse Deterministic Fusion</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(71, 98, 143, 0.22)' }}>
                <td style={{ padding: '1rem 1.15rem', fontWeight: 750, color: '#f8fafc' }}>Particulate Measurement</td>
                <td style={{ padding: '1rem 1.15rem', color: '#94a3b8', fontWeight: 550 }}>Attempts to guess PM2.5 numbers from 2D pixel colors.</td>
                <td style={{ padding: '1rem 1.15rem', color: '#e0f2fe', fontWeight: 600 }}>Separates visual confidence (V) from official station z-score anomalies (S).</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(71, 98, 143, 0.22)' }}>
                <td style={{ padding: '1rem 1.15rem', fontWeight: 750, color: '#f8fafc' }}>Atmospheric Transport</td>
                <td style={{ padding: '1rem 1.15rem', color: '#94a3b8', fontWeight: 550 }}>Ignores wind velocity and boundary layer height.</td>
                <td style={{ padding: '1rem 1.15rem', color: '#e0f2fe', fontWeight: 600 }}>Applies Haversine distance decay (D) and cosine wind transport vectors (W).</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(71, 98, 143, 0.22)' }}>
                <td style={{ padding: '1rem 1.15rem', fontWeight: 750, color: '#f8fafc' }}>Network Resilience</td>
                <td style={{ padding: '1rem 1.15rem', color: '#94a3b8', fontWeight: 550 }}>Unchecked dependencies that fail under network latency.</td>
                <td style={{ padding: '1rem 1.15rem', color: '#e0f2fe', fontWeight: 600 }}>Circuit breakers with graceful dynamic weight shifting.</td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 1.15rem', fontWeight: 750, color: '#f8fafc' }}>Public Verification</td>
                <td style={{ padding: '1rem 1.15rem', color: '#94a3b8', fontWeight: 550 }}>Opaque scores with no reproducible math.</td>
                <td style={{ padding: '1rem 1.15rem', color: '#e0f2fe', fontWeight: 600 }}>Transparent formula inspection (/fusion-debug) with 100% provenance labels.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
