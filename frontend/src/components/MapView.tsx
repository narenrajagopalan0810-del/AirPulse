import React, { useRef, useEffect, useState } from 'react';
import { IncidentReport, RegionConfig } from '../types/index.js';
import { Layers, Wind, Flame, Eye, Compass } from 'lucide-react';

interface MapViewProps {
  region: RegionConfig;
  incidents: IncidentReport[];
  selectedIncident: IncidentReport | null;
  onSelectIncident: (incident: IncidentReport) => void;
  windSpeedMps: number;
  windDirectionDeg: number;
}

export const MapView: React.FC<MapViewProps> = ({
  region,
  incidents,
  selectedIncident,
  onSelectIncident,
  windSpeedMps,
  windDirectionDeg
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showWindLayer, setShowWindLayer] = useState(true);
  const [showFirmsLayer, setShowFirmsLayer] = useState(true);
  const [showStationsLayer, setShowStationsLayer] = useState(true);

  // Animated particles state for wind stream lines
  const particlesRef = useRef<Array<{ x: number; y: number; life: number; speed: number }>>([]);

  // Coordinate projection from lat/lng to canvas pixels
  const projectCoords = (lat: number, lng: number, width: number, height: number) => {
    const [minLng, minLat, maxLng, maxLat] = region.bbox;
    const padding = 60;
    const availWidth = width - padding * 2;
    const availHeight = height - padding * 2;

    const x = padding + ((lng - minLng) / (maxLng - minLng)) * availWidth;
    // Invert Y because latitude goes South -> North
    const y = height - (padding + ((lat - minLat) / (maxLat - minLat)) * availHeight);

    return { x, y };
  };

  // Setup wind particles
  useEffect(() => {
    const particles: Array<{ x: number; y: number; life: number; speed: number }> = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * 1000,
        y: Math.random() * 800,
        life: Math.random(),
        speed: 1.5 + Math.random() * (windSpeedMps || 2)
      });
    }
    particlesRef.current = particles;
  }, [region.id, windSpeedMps]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear & draw dark tactical grid background
      ctx.fillStyle = '#080e1a';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle geospatial grid
      ctx.strokeStyle = 'rgba(56, 92, 148, 0.15)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw region bounding polygon outline
      const [minLng, minLat, maxLng, maxLat] = region.bbox;
      const p1 = projectCoords(minLat, minLng, width, height);
      const p2 = projectCoords(minLat, maxLng, width, height);
      const p3 = projectCoords(maxLat, maxLng, width, height);
      const p4 = projectCoords(maxLat, minLng, width, height);

      ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Render Wind Streamlines Particles
      if (showWindLayer) {
        // Wind direction is reported as FROM deg. Plume travels TOWARD (deg + 180).
        const windTowardRad = ((windDirectionDeg + 180) * Math.PI) / 180.0;
        const dx = Math.sin(windTowardRad);
        const dy = -Math.cos(windTowardRad); // Canvas Y is inverted

        ctx.fillStyle = 'rgba(96, 165, 250, 0.45)';
        for (const p of particlesRef.current) {
          p.x += dx * p.speed;
          p.y += dy * p.speed;
          p.life -= 0.008;

          // Respawn
          if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.life = 1.0;
          }

          const alpha = Math.sin(p.life * Math.PI) * 0.5;
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + dx * 16, p.y + dy * 16);
          ctx.stroke();
        }
      }

      // 3. Render Ground Monitoring Stations (CAAQMS)
      if (showStationsLayer && region.stations) {
        for (const station of region.stations) {
          const { x, y } = projectCoords(station.lat, station.lng, width, height);

          // Station base marker
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.beginPath();
          ctx.arc(x, y, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
          ctx.stroke();

          // Station Label
          ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(`CAAQMS: ${station.name.split(',')[0]}`, x + 14, y - 6);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.fillText(`μ: ${station.baselineMu} | σ: ${station.baselineSigma}`, x + 14, y + 9);
        }
      }

      // 4. Render Incidents
      const now = Date.now();
      for (const incident of incidents) {
        const { x, y } = projectCoords(incident.latitude, incident.longitude, width, height);
        const isSelected = selectedIncident?.id === incident.id;
        const isCritical = incident.fusionResults.priorityClass === 'CRITICAL';
        const isElevated = incident.fusionResults.priorityClass === 'ELEVATED';

        const color = isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#10b981';

        // Animated Radar concentric ripple for Critical incidents
        if (isCritical) {
          const pulse = (now % 2000) / 2000;
          const radius = 12 + pulse * 28;
          ctx.strokeStyle = `rgba(239, 68, 68, ${1 - pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Selection highlight ring
        if (isSelected) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 22, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Outer glow circle
        ctx.fillStyle = isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Core marker pin
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Score Badge
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 12, y - 20, 42, 20);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 12, y - 20, 42, 20);

        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.fillStyle = color;
        ctx.fillText(`R${incident.fusionResults.compositeScore}`, x + 16, y - 6);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [region, incidents, selectedIncident, showWindLayer, showFirmsLayer, showStationsLayer, windDirectionDeg, windSpeedMps]);

  // Click on map to select nearest incident
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let closest: IncidentReport | null = null;
    let minDist = 30; // 30px click radius

    for (const incident of incidents) {
      const { x, y } = projectCoords(incident.latitude, incident.longitude, canvas.width, canvas.height);
      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist < minDist) {
        minDist = dist;
        closest = incident;
      }
    }

    if (closest) {
      onSelectIncident(closest);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={1000}
        height={700}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
          background: '#07090e'
        }}
      />

      {/* Floating Tactical Layer Toggles */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          padding: '0.65rem 0.9rem',
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        <button
          onClick={() => setShowWindLayer(!showWindLayer)}
          className="btn-secondary"
          style={{
            padding: '0.45rem 0.8rem',
            fontSize: '0.84rem',
            fontWeight: 650,
            background: showWindLayer ? 'rgba(37, 99, 235, 0.25)' : 'rgba(23, 37, 68, 0.6)',
            borderColor: showWindLayer ? 'var(--blue-accent)' : 'var(--border-subtle)'
          }}
        >
          <Wind size={15} color={showWindLayer ? '#93c5fd' : '#94a3b8'} />
          <span>Wind Flow ({windSpeedMps} m/s)</span>
        </button>

        <button
          onClick={() => setShowStationsLayer(!showStationsLayer)}
          className="btn-secondary"
          style={{
            padding: '0.45rem 0.8rem',
            fontSize: '0.84rem',
            fontWeight: 650,
            background: showStationsLayer ? 'rgba(37, 99, 235, 0.25)' : 'rgba(23, 37, 68, 0.6)',
            borderColor: showStationsLayer ? 'var(--blue-accent)' : 'var(--border-subtle)'
          }}
        >
          <Layers size={15} color={showStationsLayer ? '#93c5fd' : '#94a3b8'} />
          <span>CAAQMS Stations</span>
        </button>

        <button
          onClick={() => setShowFirmsLayer(!showFirmsLayer)}
          className="btn-secondary"
          style={{
            padding: '0.45rem 0.8rem',
            fontSize: '0.84rem',
            fontWeight: 650,
            background: showFirmsLayer ? 'rgba(239, 68, 68, 0.2)' : 'rgba(23, 37, 68, 0.6)',
            borderColor: showFirmsLayer ? 'rgba(239, 68, 68, 0.45)' : 'var(--border-subtle)'
          }}
        >
          <Flame size={15} color={showFirmsLayer ? '#f87171' : '#94a3b8'} />
          <span>FIRMS Hotspots</span>
        </button>
      </div>

      {/* Atmospheric Wind Telemetry HUD */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Compass size={22} color="#93c5fd" style={{ transform: `rotate(${windDirectionDeg}deg)` }} />
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>ATMOSPHERIC VECTOR</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.94rem', fontWeight: 750, color: '#f8fafc' }}>
              {windSpeedMps} m/s @ {windDirectionDeg}° FROM
            </div>
          </div>
        </div>

        <div style={{ height: '28px', width: '1px', background: 'var(--border-subtle)' }} />

        <div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>ACTIVE INCIDENTS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.94rem', fontWeight: 800, color: '#f59e0b' }}>
            {incidents.length} Telemetry Pins
          </div>
        </div>
      </div>
    </div>
  );
};
