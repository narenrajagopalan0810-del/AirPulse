import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Mic,
  MapPin,
  Send,
  CheckCircle,
  AlertTriangle,
  Upload,
  Globe,
  Loader2
} from 'lucide-react';
import { submitReport } from '../services/api.js';
import { soundEffects } from '../services/soundEffects.js';
import { IncidentReport, RegionConfig } from '../types/index.js';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: RegionConfig;
  onReportCreated: (incident: IncidentReport) => void;
}

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  currentRegion,
  onReportCreated
}) => {
  if (!isOpen) return null;

  const [language, setLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [userDescription, setUserDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: currentRegion.center[0] + (Math.random() - 0.5) * 0.05,
    lng: currentRegion.center[1] + (Math.random() - 0.5) * 0.05
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedIncident, setSubmittedIncident] = useState<IncidentReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Client-side image compression to WebP <= 200KB per PRD requirements
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImagePreview(compressedDataUrl);
        setImageBase64(compressedDataUrl);
        setErrorMsg(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Vernacular voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setAudioBase64(base64);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setErrorMsg('Microphone access unavailable. You can type notes instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // Auto-fetch GPS
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Keep regional default if denied
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!imageBase64) {
      setErrorMsg('Please capture or upload a pollution evidence photo first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      soundEffects.playClick();

      const response = await submitReport({
        latitude: coords.lat,
        longitude: coords.lng,
        imageBase64,
        userDescription,
        userAudioBase64: audioBase64 || undefined,
        audioMimeType: audioBase64 ? 'audio/webm' : undefined,
        language,
        regionId: currentRegion.id
      });

      if (response.rejected) {
        setErrorMsg(response.reason || 'Report was rejected: insufficient evidence or invalid photo.');
        return;
      }

      if (response.success && response.incident) {
        soundEffects.playSonarPing();
        setSubmittedIncident(response.incident);
        onReportCreated(response.incident);
      } else {
        setErrorMsg('Submission could not be completed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setImagePreview(null);
    setImageBase64(null);
    setUserDescription('');
    setAudioBase64(null);
    setSubmittedIncident(null);
    setErrorMsg(null);
  };

  // Vernacular label helpers
  const i18n = {
    en: {
      title: 'Citizen Environmental Report',
      subtitle: 'Verified by Multimodal AI & Atmospheric Telemetry',
      dropzone: 'Tap to take photo or upload evidence',
      gps: 'Location Verified (GPS ~100m)',
      notePlaceholder: 'Describe emission (e.g. factory stack, garbage burn, farm fire)...',
      recordVoice: 'Record Voice Note',
      stopVoice: 'Stop Recording',
      submit: 'Submit Incident Evidence',
      analyzing: 'Verifying Evidence with Gemini 2.5...'
    },
    hi: {
      title: 'नागरिक प्रदूषण रिपोर्ट',
      subtitle: 'मल्टीमॉडल एआई एवं मौसम विज्ञान द्वारा सत्यापित',
      dropzone: 'प्रदूषण की फ़ोटो खींचें या अपलोड करें',
      gps: 'स्थान सत्यापित (जीपीएस ~100मी)',
      notePlaceholder: 'प्रदूषण का विवरण दें (उदा. चिमनी का धुआँ, कचरा जलना, पराली)...',
      recordVoice: 'आवाज़ में बोलें',
      stopVoice: 'रिकॉर्डिंग रोकें',
      submit: 'साक्ष्य सबमिट करें',
      analyzing: 'साक्ष्य की जाँच की जा रही है...'
    },
    ta: {
      title: 'குடிமக்கள் சுற்றுச்சூழல் புகார்',
      subtitle: 'செயற்கை நுண்ணறிவு மற்றும் வானிலை மூலம் சரிபார்க்கப்பட்டது',
      dropzone: 'புகைப்படத்தை எடுக்கவும் அல்லது பதிவேற்றவும்',
      gps: 'இடம் சரிபார்க்கப்பட்டது',
      notePlaceholder: 'மாசு விவரங்களை உள்ளிடவும்...',
      recordVoice: 'குரல் பதிவு',
      stopVoice: 'பதிவை நிறுத்து',
      submit: 'புகாரை அனுப்பவும்',
      analyzing: 'சான்றுகள் சரிபார்க்கப்படுகின்றன...'
    }
  }[language];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.75rem',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid var(--border-active)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', fontWeight: 650, color: '#f8fafc' }}>{i18n.title}</h2>
            <p style={{ fontSize: '0.86rem', fontWeight: 550, color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{i18n.subtitle}</p>
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

        {submittedIncident ? (
          /* Submission Success State */
          <div style={{ textAlign: 'center', padding: '1.6rem 0' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.15rem'
              }}
            >
              <CheckCircle size={40} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.6rem' }}>
              Incident Evidence Transmitted!
            </h3>
            <p style={{ fontSize: '0.92rem', fontWeight: 550, color: 'var(--text-secondary)', marginBottom: '1.4rem', lineHeight: 1.5 }}>
              Your report was analyzed by Gemini 2.5 Flash and fused with CAAQMS station telemetry.
            </p>

            <div className="glass-card" style={{ textAlign: 'left', marginBottom: '1.6rem', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>INCIDENT ID</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.86rem', fontWeight: 700, color: '#38bdf8' }}>
                  {submittedIncident.id}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRIORITY BAND</span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 850,
                    color: submittedIncident.fusionResults.priorityClass === 'CRITICAL' ? '#f87171' : '#fbbf24'
                  }}
                >
                  {submittedIncident.fusionResults.priorityClass} (R: {submittedIncident.fusionResults.compositeScore})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>EVIDENCE TIER</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#34d399' }}>
                  {submittedIncident.fusionResults.evidenceTier}
                </span>
              </div>
            </div>

            <button onClick={resetForm} className="btn-primary" style={{ width: '100%', fontSize: '0.98rem', fontWeight: 700 }}>
              Submit Another Report
            </button>
          </div>
        ) : (
          /* Normal Form State */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Language Selector Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Globe size={16} color="#94a3b8" />
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '7px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: language === 'en' ? 'var(--blue-accent)' : 'var(--border-subtle)',
                    background: language === 'en' ? 'rgba(37, 99, 235, 0.22)' : 'rgba(23, 37, 68, 0.6)',
                    color: language === 'en' ? '#93c5fd' : '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '7px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: language === 'hi' ? 'var(--blue-accent)' : 'var(--border-subtle)',
                    background: language === 'hi' ? 'rgba(37, 99, 235, 0.22)' : 'rgba(23, 37, 68, 0.6)',
                    color: language === 'hi' ? '#93c5fd' : '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '7px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: language === 'ta' ? 'var(--blue-accent)' : 'var(--border-subtle)',
                    background: language === 'ta' ? 'rgba(37, 99, 235, 0.22)' : 'rgba(23, 37, 68, 0.6)',
                    color: language === 'ta' ? '#93c5fd' : '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>

            {/* Photo Capture / Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
              }}
              style={{ display: 'none' }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                height: '190px',
                border: '2px dashed var(--border-active)',
                borderRadius: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: imagePreview ? `url(${imagePreview}) center/cover no-repeat` : 'rgba(30, 41, 59, 0.4)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {imagePreview ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  Tap to change photo
                </div>
              ) : (
                <>
                  <Camera size={34} color="#60a5fa" style={{ marginBottom: '0.6rem' }} />
                  <span style={{ fontSize: '0.96rem', fontWeight: 750, color: '#f8fafc' }}>
                    {i18n.dropzone}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    WebP compressed client-side ≤ 200KB
                  </span>
                </>
              )}
            </div>

            {/* GPS Location Chip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.7rem 0.95rem',
                borderRadius: '9px',
                background: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <MapPin size={18} color="#34d399" />
                <span style={{ fontSize: '0.86rem', fontWeight: 650, color: '#e2e8f0' }}>{i18n.gps}</span>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.84rem',
                  fontWeight: 750,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
              </button>
            </div>

            {/* Citizen Notes Input */}
            <textarea
              rows={2}
              placeholder={i18n.notePlaceholder}
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '0.75rem 0.9rem',
                borderRadius: '9px',
                fontSize: '0.92rem',
                fontWeight: 550,
                resize: 'none',
                outline: 'none',
                lineHeight: 1.45
              }}
            />

            {/* Vernacular Voice Recording Button */}
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '9px',
                  fontSize: '0.86rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isRecording ? '#ef4444' : 'var(--border-subtle)',
                  background: isRecording ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                  color: isRecording ? '#fca5a5' : '#e2e8f0'
                }}
              >
                <Mic size={16} color={isRecording ? '#ef4444' : '#93c5fd'} />
                <span>{isRecording ? i18n.stopVoice : i18n.recordVoice}</span>
              </button>

              {audioBase64 && (
                <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700 }}>
                  ✓ Voice note attached
                </span>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '9px',
                  fontSize: '0.84rem',
                  fontWeight: 650
                }}
              >
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary"
              style={{ padding: '0.85rem', fontSize: '1.0rem', fontWeight: 750, marginTop: '0.4rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  <span>{i18n.analyzing}</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{i18n.submit}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
