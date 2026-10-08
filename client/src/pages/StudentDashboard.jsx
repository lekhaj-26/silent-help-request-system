import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import HelpRequestModal from '../components/HelpRequestModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const data = await api.getMyRequests();
      setRequests(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Poll every 6 seconds to keep status updated in real-time
    const interval = setInterval(fetchRequests, 6000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' (' + date.toLocaleDateString() + ')';
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            Welcome, {user?.name || 'Student'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Click below to raise a silent assistance alert for faculty.
          </p>

          <button
            type="button"
            id="need-help-btn"
            className="btn-need-help"
            onClick={() => setIsModalOpen(true)}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✋</span>
            NEED HELP
          </button>
        </div>

        {/* My Requests Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">My Requests</h2>
            <button
              onClick={fetchRequests}
              className="btn btn-outline btn-sm"
              title="Refresh requests"
              id="refresh-student-requests"
            >
              Refresh
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {isLoading ? (
            <div className="empty-state">Loading your requests...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              No help requests submitted yet. Click "NEED HELP" if you need assistance!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" id="student-requests-table">
                <thead>
                  <tr>
                    <th>Help Type</th>
                    <th>Description</th>
                    <th>Request Time</th>
                    <th>Status</th>
                    <th>Faculty Solution</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: '600' }}>{req.helpType}</td>
                      <td style={{ color: req.description ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                        {req.description || 'No description provided'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(req.createdAt)}
                      </td>
                      <td>
                        <StatusBadge status={req.status} />
                      </td>
                      <td>
                        {req.status === 'resolved' ? (
                          <div style={{ color: req.solution ? '#15803d' : 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {req.solution ? (
                              <span>✓ {req.solution}</span>
                            ) : (
                              <span style={{ color: 'var(--text-subtle)' }}>Resolved without note</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '0.825rem', fontStyle: 'italic' }}>
                            {req.status === 'in-progress' ? 'Faculty is reviewing...' : 'Awaiting review...'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <HelpRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequestCreated={fetchRequests}
      />
    </div>
  );
};

export default StudentDashboard;
