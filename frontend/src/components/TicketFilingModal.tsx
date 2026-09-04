import React, { useState, useEffect } from 'react';
import { Camera, Navigation, Loader2, X, MapPin, FileCheck, ShieldCheck } from 'lucide-react';
import { submitComplaintReport } from '../services/api';
import { LiveCameraCapture } from './LiveCameraCapture';
import { reverseGeocode } from '../utils/geocoding';

interface TicketFilingModalProps {
  citizenId: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  preselectCategory?: string;
}

export const TicketFilingModal: React.FC<TicketFilingModalProps> = ({ citizenId, onSuccess, onError, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showLiveCamera, setShowLiveCamera] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<string>('28.613939');
  const [longitude, setLongitude] = useState<string>('77.209021');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Auto-detect GPS coordinates on modal mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        try {
          const fetchedAddr = await reverseGeocode(lat, lng);
          if (fetchedAddr) setAddress(fetchedAddr);
        } catch {
          // fallback gracefully
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleCapturePhoto = (file: File, dataUrl: string) => {
    setSelectedFile(file);
    setPreviewUrl(dataUrl);
    setShowLiveCamera(false);
    onSuccess('Live site photograph verified with embedded GPS watermark.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      onError('Live camera capture is required to verify site authenticity.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('address', address);
    formData.append('description', description);
    formData.append('citizen_id', citizenId);

    try {
      const res = await submitComplaintReport(formData);
      if (!res.is_civic_issue) {
        onError('Verification Alert: The uploaded image was not identified as a municipal civic hazard. Please capture a clear live photo of the site.');
      } else {
        onSuccess(`Work order filed successfully! Reference: #CF-${res.incident_id?.substring(0,6).toUpperCase() || 'NEW'}`);
        onClose();
      }
    } catch (err: any) {
      onError(err.message || 'Failed to lodge report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740 }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span className="live-pulse-dot" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-verified-fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Official Municipal Dispatch
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Lodge Municipal Infrastructure Issue</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 6, borderRadius: '50%' }}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Reassurance Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--status-progress-bg)', border: '1px solid var(--status-progress-border)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', marginBottom: 16, fontSize: 12.5, color: 'var(--status-progress-fg)' }}>
            <FileCheck size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Authenticity Requirement:</strong> To eliminate fraudulent tickets, photos must be captured <strong>live on site</strong> with verified GPS watermarks.
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Live Camera Capture Only */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Site Camera Feed (Live Capture Only)</span>
                {previewUrl && (
                  <span style={{ fontSize: 11, color: 'var(--status-verified-fg)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    <ShieldCheck size={13} /> GPS Watermark Applied
                  </span>
                )}
              </label>

              {showLiveCamera ? (
                <LiveCameraCapture
                  latitude={latitude}
                  longitude={longitude}
                  address={address}
                  onCapture={handleCapturePhoto}
                  onClose={() => setShowLiveCamera(false)}
                />
              ) : previewUrl ? (
                <div style={{ position: 'relative', width: '100%', height: 240, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                  <img src={previewUrl} alt="Live Capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowLiveCamera(true)}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(15, 23, 42, 0.8)', color: '#FFFFFF', borderColor: 'transparent' }}
                  >
                    <Camera size={13} /> Re-open Live Camera
                  </button>
                </div>
              ) : (
                <div
                  className="dropzone"
                  style={{
                    minHeight: 180,
                    borderColor: 'var(--primary)',
                    background: 'var(--primary-light)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowLiveCamera(true)}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                    }}
                  >
                    <Camera size={26} color="#FFFFFF" />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Tap to Open Live Camera Feed
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 360, textAlign: 'center' }}>
                    Gallery uploads are disabled for municipal accountability. Photos will be watermarked with current GPS and timestamp.
                  </p>
                </div>
              )}
            </div>

            {/* Geolocation Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label className="form-label" style={{ margin: 0 }}>GPS Latitude</label>
                  <button type="button" onClick={detectLocation} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Navigation size={11} /> Auto-Detect GPS
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="28.613939"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">GPS Longitude</label>
                <input
                  type="text"
                  className="form-input"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="77.209021"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Street / Landmark Address</label>
              <div className="input-container">
                <MapPin className="input-icon-left" size={15} />
                <input
                  type="text"
                  className="form-input has-icon"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Mother Dairy, Sector B Main Market"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Additional Context (Optional)</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe hazard severity, water flow rate, depth of pothole, etc."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading && <Loader2 className="spin" size={15} />}
                {loading ? 'Transmitting to Ward Triage...' : 'Dispatch Ticket to MCD'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
