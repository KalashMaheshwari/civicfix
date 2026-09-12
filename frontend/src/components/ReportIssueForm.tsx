import React, { useState, useRef } from 'react';
import { Camera, Navigation, Send, Loader2 } from 'lucide-react';
import { submitComplaintReport } from '../services/api';
import { compressImage } from '../utils/imageCompressor';
import { formatErrorMessage } from '../utils/errors';

interface ReportIssueFormProps {
  citizenId: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export const ReportIssueForm: React.FC<ReportIssueFormProps> = ({ citizenId, onSuccess, onError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('28.613939');
  const [longitude, setLongitude] = useState<string>('77.209021');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setSelectedFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      onError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        onSuccess('GPS coordinates detected.');
      },
      () => {
        onError('Location access denied. Using default coordinates.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      onError('Please attach or capture a photograph of the issue.');
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
        onError('Image rejected: Not identified as a public infrastructure problem.');
      } else if (res.is_duplicate) {
        onSuccess(`Duplicate found nearby. Existing problem priority escalated to ${res.priority_score}/100.`);
      } else {
        onSuccess(`Report filed successfully! Identified category: ${res.detected_category.replace(/_/g, ' ')}`);
      }

      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setAddress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      onError(formatErrorMessage(err, 'Failed to submit report. Please check your submission.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="report-card">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Report a Civic Issue</h2>
          <p className="section-subtitle">
            Photos are automatically analyzed with computer vision and geo-clustered to prevent municipal duplicate tickets.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="report-grid">
          {/* Photo Dropzone */}
          <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <img src={previewUrl} className="dropzone-preview" alt="Issue Preview" />
            ) : (
              <>
                <Camera className="dropzone-icon" size={32} strokeWidth={1.8} />
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  Upload or Capture Photograph
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  JPEG, PNG or WEBP (Max 10MB)
                </div>
              </>
            )}
          </div>

          {/* Form Inputs */}
          <div>
            <div className="form-group">
              <label className="form-label">Location (Coordinates)</label>
              <div className="location-row">
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={detectLocation}>
                  <Navigation size={14} />
                  Detect GPS
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Street Address or Landmark</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ring Road near Metro Pillar 42"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional Context)</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the issue or safety hazards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Loader2 className="spin" size={14} /> : <Send size={14} />}
                {loading ? 'Analyzing with AI...' : 'Submit Issue Report'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};
