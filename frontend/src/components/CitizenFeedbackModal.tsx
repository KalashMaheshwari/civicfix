import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface CitizenFeedbackModalProps {
  incidentId: string | null;
  onClose: () => void;
  onSubmitFeedback: (incidentId: string, isFixed: boolean, comment: string, file: File | undefined) => Promise<void>;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  incidentId,
  onClose,
  onSubmitFeedback,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!incidentId) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setSelectedFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please attach a photograph showing the unrestored or incomplete repair.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmitFeedback(incidentId, false, comment, selectedFile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit dispute audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <ShieldAlert size={14} color="var(--status-open-fg)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-open-fg)', textTransform: 'uppercase' }}>
                Citizen Quality Audit
              </span>
            </div>
            <h3 className="modal-title">Escalate Incomplete Repair</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 13, lineHeight: 1.45 }}>
            Residents hold final sign-off authority. If the official repair is defective or incomplete, attach a photo to reject the repair and automatically escalate the work order to the Zonal Chief Engineer.
          </p>

          {error && (
            <div style={{ background: 'var(--status-open-bg)', color: 'var(--status-open-fg)', padding: '8px 12px', borderRadius: 'var(--radius-xs)', marginBottom: 14, fontSize: 12.5, border: '1px solid var(--status-open-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Current Site Photograph (Required Proof)</label>
              <div
                className="dropzone"
                style={{
                  minHeight: 140,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-canvas)'
                }}
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
                  <img src={previewUrl} alt="Preview" className="dropzone-preview" />
                ) : (
                  <>
                    <Camera className="dropzone-icon" size={24} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Upload evidence of defective work
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reason for Dispute</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Explain what is still broken, defective materials, or hazards left behind..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-peach" disabled={loading}>
                {loading && <Loader2 className="spin" size={14} />}
                {loading ? 'Submitting Dispute...' : 'Reject & Reopen Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
