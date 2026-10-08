// Base API URL configuration
// Configured via VITE_API_URL environment variable
// In local development: VITE_API_URL=http://localhost:5000
// In production (Vercel): set VITE_API_URL to your Render backend URL (e.g. https://silent-help-backend.onrender.com)
const envUrl = import.meta.env.VITE_API_URL;
const rawBase = envUrl ? envUrl.trim() : 'http://localhost:5000';
const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : `${rawBase.replace(/\/$/, '')}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async register(name, email, password, role) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  async login(email, password, role) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },

  // Help Requests (Student)
  async createRequest(helpType, description) {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ helpType, description })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit help request');
    }
    return data;
  },

  async getMyRequests() {
    const res = await fetch(`${API_BASE}/requests/my`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to load your requests');
    }
    return data;
  },

  // Help Requests (Faculty)
  async getActiveRequests() {
    const res = await fetch(`${API_BASE}/requests/active`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to load active requests');
    }
    return data;
  },

  async acceptRequest(id) {
    const res = await fetch(`${API_BASE}/requests/${id}/accept`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to accept request');
    }
    return data;
  },

  async resolveRequest(id, solution) {
    const res = await fetch(`${API_BASE}/requests/${id}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ solution: solution || '' })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to resolve request');
    }
    return data;
  },

  async getHistoryRequests() {
    const res = await fetch(`${API_BASE}/requests/history`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to load history');
    }
    return data;
  }
};
