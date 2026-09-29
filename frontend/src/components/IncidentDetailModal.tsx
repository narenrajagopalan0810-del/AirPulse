import React, { useState } from 'react';
import { IncidentReport, ReportStatus } from '../types/index.js';
import {
  X,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  FileText,
  Flame,
  Globe,
  MapPin,
  Send,
  UserCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { updateAlertStatus } from '../services/api.js';
import { soundEffects } from '../services/soundEffects.js';

interface IncidentDetailModalProps {
  incident: IncidentReport | null;
  onClose: () => void;
  onIncidentUpdated: (updated: IncidentReport) => void;
  onOpenFusionDebug: (incident: IncidentReport) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onIncidentUpdated,
  onOpenFusionDebug
}) => {
  if (!incident) return null;

  const [activeLang, setActiveLang] = useState<'en' | 'hi' | 'ta'>('en');
  const [officerName, setOfficerName] = useState('Officer R. Sharma');
  const [actionNote, setActionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fusionResults, geminiAnalysis } = incident;
  const isCritical = fusionResults.priorityClass === 'CRITICAL';
  const isElevated = fusionResults.priorityClass === 'ELEVATED';
  const accentColor = isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#10b981';

  const handleStatusTransition = async (status: ReportStatus) => {
    try {
      setIsSubmitting(true);
      soundEffects.playClick();
      const updated = await updateAlertStatus(
        incident.id,
        status,
        officerName,
        actionNote || `Status changed to ${status} via Command Center`
      );
      onIncidentUpdated(updated);
      setActionNote('');
    } catch (err) {
      console.error('Failed to update incident status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        zIndex: 90,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.75rem',
          background: 'rgba(11, 15, 23, 0.96)',
          borderLeft: `6px solid ${accentColor}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.25rem',
                fontWeight: 900,
                color: accentColor,
                background: isCritical ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                border: `1px solid ${accentColor}`,
                padding: '0.35rem 0.8rem',
                borderRadius: '8px'
              }}
            >
              R-SCORE: {fusionResults.compositeScore}
            </span>

            <span
              className={`badge ${isCritical ? 'badge-critical' : isElevated ? 'badge-elevated' : 'badge-low'}`}
              style={{ fontSize: '0.88rem', fontWeight: 800, padding: '0.35rem 0.85rem' }}
            >
              {fusionResults.priorityClass} PRIORITY
            </span>

            <span className="badge badge-provenance" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              {fusionResults.evidenceTier}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => onOpenFusionDebug(incident)}
              className="btn-secondary"
              style={{ padding: '0.5rem 0.95rem', fontSize: '0.86rem', fontWeight: 650, borderColor: 'var(--blue-accent)' }}
            >
              <span>Inspect Math (/debug)</span>
            </button>

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
        </div>

        {/* Two Column Layout: Visual Evidence & Telemetry */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(290px, 350px) 1fr', gap: '1.6rem', marginBottom: '1.6rem' }}>
          {/* Left: Incident Image & Visual Verification */}
          <div>
            <div
              style={{
                width: '100%',
                height: '250px',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <img
                src={incident.imageUrl}
                alt="Pollution evidence"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '0.6rem',
                  left: '0.6rem',
                  background: 'rgba(11, 15, 23, 0.88)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  color: '#38bdf8'
                }}
              >
                V-SCORE: {fusionResults.components.V} | {geminiAnalysis.sourceType}
              </div>
            </div>

            {incident.userDescription && (
              <div style={{ marginTop: '0.85rem', padding: '0.85rem', borderRadius: '9px', background: 'rgba(30, 41, 59, 0.65)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.02em' }}>CITIZEN NOTE</div>
                <p style={{ fontSize: '0.90rem', fontWeight: 550, color: '#f1f5f9', fontStyle: 'italic', lineHeight: 1.45 }}>
                  "{incident.userDescription}"
                </p>
              </div>
            )}
          </div>

          {/* Right: Bilingual Brief & Physical Telemetry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Action Brief Banner */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '11px',
                padding: '1.1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f87171', fontSize: '0.84rem', fontWeight: 850, marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
                <Flame size={15} />
                <span>OFFICIAL ACTION BRIEF</span>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 550, color: '#f8fafc', lineHeight: 1.55 }}>
                {incident.actionBrief}
              </p>
            </div>

            {/* Trilingual Synthesized Summaries */}
            <div className="glass-card" style={{ padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <Globe size={15} />
                  <span>MULTILINGUAL EVIDENCE BRIEF</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {(['en', 'hi', 'ta'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      style={{
                        background: activeLang === lang ? 'var(--blue-primary)' : 'rgba(23, 37, 68, 0.75)',
                        color: activeLang === lang ? '#fff' : '#94a3b8',
                        border: 'none',
                        padding: '0.22rem 0.6rem',
                        borderRadius: '5px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '0.94rem', fontWeight: 550, color: '#f8fafc', lineHeight: 1.55 }}>
                {geminiAnalysis.summary[activeLang] || geminiAnalysis.summary.en}
              </p>
            </div>

            {/* Physical Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
              <div className="glass-card" style={{ padding: '0.9rem' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>CAAQMS STATION</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 750, color: '#f8fafc', marginTop: '0.25rem' }}>
                  {fusionResults.telemetry.stationName.split(',')[0]}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 650, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                  {fusionResults.telemetry.pm25Current} µg/m³ ({fusionResults.telemetry.distanceKm} km away)
                </div>
              </div>

              <div className="glass-card" style={{ padding: '0.9rem' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>WIND TRANSPORT VECTOR</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 750, color: '#f8fafc', marginTop: '0.25rem' }}>
                  {fusionResults.telemetry.windSpeedMps} m/s @ {fusionResults.telemetry.windDirectionDeg}° FROM
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 650, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                  Bearing report→station: {fusionResults.telemetry.bearingReportToStationDeg}°
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authority Case Management & Triage Workflow */}
        <div style={{ background: 'rgba(15, 23, 42, 0.88)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.15rem', marginBottom: '1.4rem' }}>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 750, color: '#f8fafc', marginBottom: '0.85rem' }}>
            Authority Incident Triage & Enforcement Actions
          </h4>

          <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Officer Name"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.90rem',
                fontWeight: 550,
                flex: '1 1 200px'
              }}
            />
            <input
              type="text"
              placeholder="Action note / enforcement dispatch log..."
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.90rem',
                fontWeight: 550,
                flex: '2 1 300px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <button
              onClick={() => handleStatusTransition('ASSIGNED')}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ flex: 1, borderColor: '#3b82f6', color: '#93c5fd', fontSize: '0.92rem', fontWeight: 700 }}
            >
              <UserCheck size={17} />
              <span>Assign Officer</span>
            </button>

            <button
              onClick={() => handleStatusTransition('RESOLVED')}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ flex: 1, borderColor: '#10b981', color: '#6ee7b7', fontSize: '0.92rem', fontWeight: 700 }}
            >
              <CheckCircle size={17} />
              <span>Resolve Incident</span>
            </button>

            <button
              onClick={() => handleStatusTransition('FALSE')}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ flex: 1, borderColor: '#64748b', color: '#cbd5e1', fontSize: '0.92rem', fontWeight: 700 }}
            >
              <XCircle size={17} />
              <span>Mark False</span>
            </button>
          </div>
        </div>

        {/* Action Audit Trail */}
        <div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 800, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Action Audit Log
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {incident.actionLog.map((log, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '7px',
                  background: 'rgba(30, 41, 59, 0.55)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span style={{ color: '#e2e8f0' }}>
                  {log.action} <span style={{ color: '#94a3b8' }}>({log.officer})</span>
                </span>
                <span style={{ color: '#94a3b8' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
