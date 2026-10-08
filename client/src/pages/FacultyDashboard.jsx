import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

const FacultyDashboard = () => {
  const [activeRequests, setActiveRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [solutions, setSolutions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const fetchData = async () => {
    try {
      const [active, history] = await Promise.all([
        api.getActiveRequests(),
        api.getHistoryRequests()
      ]);
      setActiveRequests(active);
      setHistoryRequests(history);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll server every 5 seconds for new or updated requests
    const pollInterval = setInterval(fetchData, 5000);

    // Update waiting time ticker every 5 seconds
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const handleTakeRequest = async (id) => {
    try {
      setActionLoadingId(id);
      await api.acceptRequest(id);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to take request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolveRequest = async (id) => {
    try {
      setActionLoadingId(id);
      const solutionText = solutions[id] || '';
      await api.resolveRequest(id, solutionText);
      setSolutions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to resolve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const calculateWaitingTime = (createdAt) => {
    if (!createdAt) return '-';
    const diffInMs = currentTime - new Date(createdAt).getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    if (diffInMins < 1) {
      const secs = Math.max(1, Math.floor(diffInMs / 1000));
      return `${secs}s ago`;
    }
    if (diffInMins >= 60) {
      const hours = Math.floor(diffInMins / 60);
      const mins = diffInMins % 60;
      return `${hours}h ${mins}m waiting`;
    }
    return `${diffInMins}m waiting`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' (' + date.toLocaleDateString() + ')';
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Section 1: Pending & Active Help Requests */}
        <div className="card">
          <div className="card-header">
            <div>
              <h1 className="card-title" style={{ fontSize: '1.25rem' }}>
                Pending Help Requests
              </h1>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Sorted by longest waiting request first
              </span>
            </div>
            <button
              onClick={fetchData}
              className="btn btn-outline btn-sm"
              id="refresh-faculty-btn"
            >
              Refresh List
            </button>
          </div>

          {isLoading ? (
            <div className="empty-state">Loading active requests...</div>
          ) : activeRequests.length === 0 ? (
            <div className="empty-state">
              ✓ No pending requests. All student assistance requests are resolved!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" id="pending-requests-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Help Type</th>
                    <th>Description</th>
                    <th>Request Time</th>
                    <th>Waiting Time</th>
                    <th>Status</th>
                    <th style={{ minWidth: '220px' }}>Faculty Response / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRequests.map((req, index) => {
                    const isLongest = index === 0;
                    return (
                      <tr key={req._id}>
                        <td style={{ fontWeight: '600' }}>{req.studentName}</td>
                        <td>{req.helpType}</td>
                        <td style={{ color: req.description ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                          {req.description || 'No description provided'}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(req.createdAt)}
                        </td>
                        <td>
                          <span className={`waiting-time ${isLongest ? 'urgent' : ''}`}>
                            {calculateWaitingTime(req.createdAt)}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                        <td>
                          {req.status === 'waiting' && (
                            <button
                              id={`take-btn-${req._id}`}
                              className="btn btn-primary btn-sm"
                              onClick={() => handleTakeRequest(req._id)}
                              disabled={actionLoadingId === req._id}
                            >
                              {actionLoadingId === req._id ? 'Updating...' : 'Take Request'}
                            </button>
                          )}
                          {req.status === 'in-progress' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <textarea
                                className="form-control"
                                id={`solution-input-${req._id}`}
                                placeholder="Type solution for student..."
                                value={solutions[req._id] || ''}
                                onChange={(e) =>
                                  setSolutions({ ...solutions, [req._id]: e.target.value })
                                }
                                rows={2}
                                style={{ fontSize: '0.825rem', padding: '0.4rem 0.5rem', minHeight: '52px' }}
                              />
                              <button
                                id={`resolve-btn-${req._id}`}
                                className="btn btn-success btn-sm"
                                onClick={() => handleResolveRequest(req._id)}
                                disabled={actionLoadingId === req._id}
                              >
                                {actionLoadingId === req._id ? 'Sending...' : 'Send Solution & Resolve'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Request History */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Request History</h2>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Resolved requests & provided solutions
            </span>
          </div>

          {historyRequests.length === 0 ? (
            <div className="empty-state">No resolved requests in history yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" id="history-requests-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Help Type</th>
                    <th>Description</th>
                    <th>Request Time</th>
                    <th>Provided Solution</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRequests.map((req) => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: '500' }}>{req.studentName}</td>
                      <td>{req.helpType}</td>
                      <td style={{ color: req.description ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                        {req.description || 'No description provided'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(req.createdAt)}
                      </td>
                      <td style={{ color: req.solution ? '#15803d' : 'var(--text-subtle)', fontSize: '0.875rem' }}>
                        {req.solution || 'No written solution'}
                      </td>
                      <td>
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
