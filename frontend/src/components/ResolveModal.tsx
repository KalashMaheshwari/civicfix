import React, { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { submitResolutionProof } from '../services/api';

interface ResolveModalProps {
  incidentId: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  incidentId,
  onClose,
  onSuccess,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState<string>('Officer Rajesh Kumar (MCD)');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!incidentId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      onError('Please attach a photograph verifying the completed repair.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('official_name', officerName);
    formData.append('resolution_notes', notes);

    try {
      await submitResolutionProof(incidentId, formData);
      onSuccess('Repair proof submitted! Issue is now sent to citizens for YES/NO verification.');
      onClose();
    } catch (err: any) {
      onError(err.message || 'Failed to submit repair proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <h3 className="modal-title">Submit Repair Proof</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">After-Repair Photograph</label>
            <div
              className="dropzone"
              style={{ minHeight: 180 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <img src={previewUrl} className="dropzone-preview" alt="Proof Preview" />
              ) : (
                <>
                  <Camera className="dropzone-icon" size={28} strokeWidth={1.8} />
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    Upload Post-Repair Photo
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Must clearly show restored site
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official / Officer Name</label>
            <input
              type="text"
              className="form-input"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Done / Resolution Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Describe repairs performed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <Loader2 className="spin" size={14} />}
              {loading ? 'Submitting...' : 'Submit for Citizen Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
