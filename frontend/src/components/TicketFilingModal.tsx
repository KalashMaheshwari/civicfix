import React, { useState, useEffect } from 'react';
import { Camera, Navigation, Loader2, X, MapPin, ShieldCheck, RefreshCw, Send } from 'lucide-react';
import { submitComplaintReport } from '../services/api';
import { LiveCameraCapture } from './LiveCameraCapture';
import { reverseGeocode } from '../utils/geocoding';
import { formatErrorMessage } from '../utils/errors';

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
  const [submissionProgress, setSubmissionProgress] = useState<string>('Submitting to Triage...');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);

  // Auto-detect GPS coordinates on modal mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setIsDetectingLocation(true);
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
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleCapturePhoto = (file: File, dataUrl: string) => {
    setSelectedFile(file);
    setPreviewUrl(dataUrl);
    setShowLiveCamera(false);
    setInlineError(null);
    onSuccess('Live site photograph verified with GPS watermark.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      const msg = 'Live camera photograph is required to verify site location.';
      setInlineError(msg);
      onError(msg);
      return;
    }
    setInlineError(null);
    setLoading(true);
    setSubmissionProgress('Submitting to Triage...');

    const timer1 = setTimeout(() => {
      setSubmissionProgress('Connecting to Triage Engine...');
    }, 3500);

    const timer2 = setTimeout(() => {
      setSubmissionProgress('Waking cloud server (cold start), please wait...');
    }, 10000);

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
        const warning = 'Verification Notice: The uploaded image was not recognized as a civic hazard. Please capture a clear photograph of the site.';
        setInlineError(warning);
        onError(warning);
      } else {
        onSuccess(`Ticket lodged successfully! Reference: #CF-${res.incident_id?.substring(0,6).toUpperCase() || 'NEW'}`);
        onClose();
      }
    } catch (err: any) {
      const cleanErr = formatErrorMessage(err, 'Failed to submit report. Please verify connection and try again.');
      setInlineError(cleanErr);
      onError(cleanErr);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 680, 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 16, 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', 
          border: '1px solid var(--border-default, #E2E8F0)' 
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle, #F1F5F9)', background: 'var(--bg-surface, #FFFFFF)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Municipal Dispatch
              </span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Lodge a Civic Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              color: '#64748B',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: 'var(--bg-canvas, #F8FAFC)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Camera Capture Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  Live Site Photograph <span style={{ color: '#DC2626' }}>*</span>
                </label>
                {previewUrl && (
                  <span style={{ fontSize: 11.5, color: '#059669', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    <ShieldCheck size={14} /> GPS Watermark Applied
                  </span>
                )}
              </div>

              {showLiveCamera ? (
                <LiveCameraCapture
                  latitude={latitude}
                  longitude={longitude}
                  address={address}
                  onCapture={handleCapturePhoto}
                  onClose={() => setShowLiveCamera(false)}
                />
              ) : previewUrl ? (
                <div style={{ position: 'relative', width: '100%', height: 230, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#0F172A' }}>
                  <img src={previewUrl} alt="Live Capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setShowLiveCamera(true)}
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <RefreshCw size={13} /> Retake Photo
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setShowLiveCamera(true)}
                  style={{
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: 12,
                    padding: '28px 20px',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary, #0284C7)';
                    e.currentTarget.style.background = '#F0F9FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0F9FF', color: 'var(--primary, #0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={26} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>
                      Capture Live Site Photograph
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, maxWidth: 360 }}>
                      Opens fullscreen camera to capture live photo with verified GPS coordinates & timestamp watermark
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLiveCamera(true);
                    }}
                    style={{
                      marginTop: 4,
                      background: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Camera size={15} />
                    <span>Open Fullscreen Camera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Geolocation & Address */}
            <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  Location & Street Address <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                  style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    color: '#0284C7',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Navigation size={12} className={isDetectingLocation ? 'spin' : ''} />
                  <span>{isDetectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}</span>
                </button>
              </div>

              <div className="input-container">
                <MapPin className="input-icon-left" size={15} color="#64748B" />
                <input
                  type="text"
                  className="form-input has-icon"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Mother Dairy, Sector B Main Market"
                  style={{ borderRadius: 8, fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>GPS Latitude</span>
                  <input
                    type="text"
                    className="form-input"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="28.613939"
                    style={{ borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>GPS Longitude</span>
                  <input
                    type="text"
                    className="form-input"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="77.209021"
                    style={{ borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description / Additional Context */}
            <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <label className="form-label" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                Additional Commentary (Optional)
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe hazard severity, water flow rate, depth of pothole, or landmarks nearby..."
                style={{ borderRadius: 8, fontSize: 13 }}
              />
            </div>

            {/* Inline Error Alert */}
            {inlineError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#991B1B',
                fontSize: 12.5,
                lineHeight: 1.4,
              }}>
                <span style={{ fontWeight: 700 }}>Notice:</span>
                <span>{inlineError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
                style={{ borderRadius: 8, fontSize: 13, padding: '9px 18px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '9px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: loading ? 0.85 : 1,
                }}
              >
                {loading ? <Loader2 className="spin" size={15} /> : <Send size={14} />}
                <span>{loading ? submissionProgress : 'Dispatch Civic Report'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

