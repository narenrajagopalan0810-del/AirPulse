import React, { useState } from 'react';
import { IncidentReport, PriorityClass, ReportStatus } from '../types/index.js';
import {
  AlertCircle,
  Clock,
  ExternalLink,
  Flame,
  Filter,
  ShieldCheck,
  Building2,
  Tractor,
  Trash2,
  HardHat
} from 'lucide-react';

interface IncidentListProps {
  incidents: IncidentReport[];
  selectedIncident: IncidentReport | null;
  onSelectIncident: (incident: IncidentReport) => void;
  onOpenFusionDebug: (incident: IncidentReport) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onOpenFusionDebug
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredIncidents = incidents.filter((inc) => {
    if (filterPriority !== 'all' && inc.fusionResults.priorityClass !== filterPriority) {
      return false;
    }
    if (filterStatus !== 'all' && inc.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'INDUSTRIAL_STACK':
        return <Building2 size={16} color="#38bdf8" />;
      case 'STUBBLE':
        return <Tractor size={16} color="#f59e0b" />;
      case 'WASTE_BURNING':
        return <Trash2 size={16} color="#ef4444" />;
      case 'CONSTRUCTION_DUST':
        return <HardHat size={16} color="#eab308" />;
      default:
        return <AlertCircle size={16} color="#94a3b8" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(11, 15, 23, 0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(51, 65, 85, 0.4)',
        overflow: 'hidden'
      }}
    >
      {/* Triage Feed Header */}
      <div
        style={{
          padding: '1.15rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-serif)' }}>Incident Triage Feed</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
              Ranked by Evidence Confidence (R-Score)
            </p>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#93c5fd',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px'
            }}
          >
            {filteredIncidents.length} Records
          </span>
        </div>

        {/* Quick Filter Bar */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Filter size={15} color="#94a3b8" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              color: '#f1f5f9',
              border: '1px solid var(--border-subtle)',
              padding: '0.4rem 0.65rem',
              borderRadius: '7px',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical (R ≥ 75)</option>
            <option value="ELEVATED">Elevated (R 45-74)</option>
            <option value="LOW">Low (R &lt; 45)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              color: '#f1f5f9',
              border: '1px solid var(--border-subtle)',
              padding: '0.4rem 0.65rem',
              borderRadius: '7px',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <option value="all">All Statuses</option>
            <option value="NEW">New Alert</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incident Cards Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No incidents match active filters</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const isCritical = incident.fusionResults.priorityClass === 'CRITICAL';
            const isElevated = incident.fusionResults.priorityClass === 'ELEVATED';

            const accentColor = isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#10b981';

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className="glass-card"
                style={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${accentColor}`,
                  background: isSelected ? 'rgba(30, 41, 59, 0.98)' : 'rgba(23, 32, 54, 0.82)',
                  boxShadow: isSelected ? `0 0 18px ${isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.3)'}` : undefined,
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Top Card Bar: Score + Typology + Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getSourceIcon(incident.geminiAnalysis.sourceType)}
                    <span style={{ fontSize: '0.94rem', fontWeight: 750, color: '#f8fafc' }}>
                      {incident.geminiAnalysis.sourceType.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.80rem', fontWeight: 550, color: 'var(--text-secondary)' }}>
                      <Clock size={13} />
                      <span>{getTimeAgo(incident.timestamp)}</span>
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.95rem',
                        fontWeight: 850,
                        color: accentColor,
                        background: isCritical ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                        border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '5px'
                      }}
                    >
                      R: {incident.fusionResults.compositeScore}
                    </span>
                  </div>
                </div>

                {/* Summary brief snippet */}
                <p style={{ fontSize: '0.88rem', fontWeight: 550, color: '#e2e8f0', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {incident.geminiAnalysis.summary.en}
                </p>

                {/* Badges & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(71, 98, 143, 0.3)' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '5px',
                        fontWeight: 700,
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        color: '#38bdf8'
                      }}
                    >
                      {incident.fusionResults.evidenceTier}
                    </span>

                    <span
                      style={{
                        fontSize: '0.76rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '5px',
                        fontWeight: 750,
                        background: incident.status === 'NEW' ? 'rgba(239, 68, 68, 0.22)' : incident.status === 'ASSIGNED' ? 'rgba(59, 130, 246, 0.22)' : 'rgba(16, 185, 129, 0.22)',
                        color: incident.status === 'NEW' ? '#fca5a5' : incident.status === 'ASSIGNED' ? '#93c5fd' : '#6ee7b7'
                      }}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFusionDebug(incident);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#93c5fd',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>/debug</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
