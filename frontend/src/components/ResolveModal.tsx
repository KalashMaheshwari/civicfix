import React, { useState } from 'react';
import { Camera, X, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { submitResolutionProof, formatImageUrl } from '../services/api';
import { LiveCameraCapture } from './LiveCameraCapture';
import { formatErrorMessage } from '../utils/errors';
import type { Incident } from '../types/incident';

interface ResolveModalProps {
  incident: Incident | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  incident,
  onClose,
  onSuccess,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showLiveCamera, setShowLiveCamera] = useState<boolean>(false);
  const [officerName, setOfficerName] = useState<string>('Er. Rajesh Kumar (MCD Zone 4)');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!incident) return null;

  const handleCapturePhoto = (file: File, dataUrl: string) => {
    setSelectedFile(file);
    setPreviewUrl(dataUrl);
    setShowLiveCamera(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      onError('Live camera capture is required to verify completed repair authenticity.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('official_name', officerName);
    formData.append('resolution_notes', notes);

    try {
      await submitResolutionProof(incident.id, formData);
      onSuccess('Repair proof logged! The work order is now routed to Ward-04 citizens for sign-off verification.');
      onClose();
    } catch (err: any) {
      onError(formatErrorMessage(err, 'Failed to submit repair proof. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const primarySrc = formatImageUrl(incident.primary_image_url);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              #CF-{incident.id.substring(0, 6).toUpperCase()} &bull; OFFICIAL RESOLUTION EVIDENCE
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              Log Completed Infrastructure Repair
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 6, borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, padding: 20, maxHeight: '80vh', overflowY: 'auto' }}>
          
          {/* Left Column: Citizen Photo & Details */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="var(--status-open-fg)" /> Citizen Report Site Photo
            </div>
            <div style={{ width: '100%', height: 160, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', overflow: 'hidden', border: '1px solid var(--border-default)', marginBottom: 12 }}>
              {primarySrc ? (
                <img src={primarySrc} alt="Issue" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No initial photo recorded</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>{incident.category.replace(/_/g, ' ')}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <MapPin size={13} color="var(--status-ward-fg)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{incident.address || 'Ward-04 Location'}</span>
              </div>
              {incident.description && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: 8, borderRadius: 'var(--radius-xs)', marginTop: 4 }}>
                  "{incident.description}"
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Resolution Evidence Form with Live Camera */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>After-Repair Proof (Live Capture Only)</span>
                {previewUrl && (
                  <span style={{ fontSize: 11, color: 'var(--status-verified-fg)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    <ShieldCheck size={13} /> GPS Watermark Applied
                  </span>
                )}
              </label>

              {showLiveCamera ? (
                <LiveCameraCapture
                  latitude={incident.latitude?.toString() || '28.613939'}
                  longitude={incident.longitude?.toString() || '77.209021'}
                  address={incident.address || 'MCD Ward-04 Repair Site'}
                  onCapture={handleCapturePhoto}
                  onClose={() => setShowLiveCamera(false)}
                />
              ) : previewUrl ? (
                <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                  <img src={previewUrl} alt="Repair Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowLiveCamera(true)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(15, 23, 42, 0.8)', color: '#FFFFFF', borderColor: 'transparent' }}
                  >
                    <Camera size={13} /> Re-open Live Camera
                  </button>
                </div>
              ) : (
                <div
                  className="dropzone"
                  style={{
                    minHeight: 140,
                    borderColor: 'var(--status-verified-fg)',
                    background: 'var(--status-verified-bg)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowLiveCamera(true)}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'var(--status-verified-fg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Camera size={22} color="#FFFFFF" />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Open Live Camera to Record Repair Proof
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Proof is watermarked with GPS coordinates and verified by residents
                  </p>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Supervising Official Name</label>
              <input
                type="text"
                className="form-input"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="e.g. Er. Rajesh Kumar (MCD Zone 4)"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Engineering Repair Notes</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe asphalt mix used, pipe replaced, wiring secured, etc."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: '#059669', borderColor: '#059669' }}>
                {loading && <Loader2 className="spin" size={14} />}
                {loading ? 'Submitting Proof...' : 'Log Fix for Citizen Sign-Off'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
