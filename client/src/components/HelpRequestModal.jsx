import React, { useState } from 'react';
import { api } from '../services/api';

const HELP_TYPES = [
  'Technical Issue',
  'Need Explanation',
  'Equipment Problem',
  'Other'
];

const HelpRequestModal = ({ isOpen, onClose, onRequestCreated }) => {
  const [helpType, setHelpType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setHelpType('');
    setDescription('');
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!helpType) {
      setErrorMessage('Please select a help type.');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.createRequest(helpType, description);
      setSuccessMessage('Help request sent successfully.');
      setHelpType('');
      setDescription('');
      if (onRequestCreated) {
        onRequestCreated();
      }
      setTimeout(() => {
        setSuccessMessage('');
        handleClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit help request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Request Assistance</h3>
        <p className="modal-description">
          Silently notify faculty that you need assistance at your desk.
        </p>

        {successMessage ? (
          <div className="alert alert-success" id="success-alert">
            ✓ {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="alert alert-error" id="error-alert">
                {errorMessage}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="help-type">
                Help Type
              </label>
              <select
                id="help-type"
                className="form-control"
                value={helpType}
                onChange={(e) => setHelpType(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select type
                </option>
                {HELP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="request-description">
                Short Description
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="request-description"
                  className="form-control"
                  placeholder="Briefly describe what you need help with..."
                  value={description}
                  maxLength={250}
                  onChange={(e) => setDescription(e.target.value.slice(0, 250))}
                  rows={3}
                  style={{ paddingBottom: '1.75rem' }}
                />
                <span
                  id="char-counter"
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    bottom: '0.45rem',
                    fontSize: '0.75rem',
                    color: description.length >= 250 ? 'var(--danger)' : 'var(--text-subtle)',
                    fontWeight: description.length >= 250 ? '600' : '400',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  {description.length}/250
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="send-request-btn"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HelpRequestModal;
