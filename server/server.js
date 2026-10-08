const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { getRequests, getUsers } = require('./utils/storage');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration to support Vercel deployments, custom CLIENT_URL, and local development
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (mobile apps, curl, Cloud Run health checks)
    if (!origin) return callback(null, true);

    // If CLIENT_URL is set to '*' or no restriction is specified, allow all origins
    if (process.env.CLIENT_URL === '*' || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    // Match configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Automatically allow any Vercel preview or production deployment (*.vercel.app)
    try {
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (e) {}

    // Allow all in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Default: allow so that newly deployed Vercel frontend URLs communicate smoothly
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Public Endpoint to view stored requests directly in browser
app.get('/api/requests/all', (req, res) => {
  res.json(getRequests());
});

// Public Endpoint to view all backend data (requests + users) directly in browser
app.get('/api/backend-data', (req, res) => {
  const requests = getRequests();
  const users = getUsers().map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json({
    totalRequests: requests.length,
    requests,
    totalUsers: users.length,
    users
  });
});

// Clean HTML page to view all backend data in any browser without tools
app.get('/view-backend', (req, res) => {
  const requests = getRequests();
  const users = getUsers();

  const requestsRows = requests.length
    ? requests
        .map(
          (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.studentName || '-'}</strong></td>
        <td>${r.helpType || '-'}</td>
        <td>${r.description || '<em>None</em>'}</td>
        <td><span class="badge ${r.status}">${r.status}</span></td>
        <td>${r.solution ? `<strong>✓ ${r.solution}</strong>` : '<em>None</em>'}</td>
        <td>${r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
      </tr>`
        )
        .join('')
    : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No requests recorded yet.</td></tr>';

  const usersRows = users.length
    ? users
        .map(
          (u, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
      </tr>`
        )
        .join('')
    : '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No users registered yet.</td></tr>';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Backend Stored Data - Silent Help Request System</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 2rem; }
    .container { max-width: 1060px; margin: 0 auto; }
    h1 { margin-bottom: 0.25rem; font-size: 1.5rem; }
    p { color: #64748b; font-size: 0.9rem; margin-top: 0; margin-bottom: 2rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h2 { font-size: 1.15rem; margin-top: 0; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th { text-align: left; background: #f1f5f9; padding: 0.65rem 0.75rem; color: #475569; font-size: 0.8rem; text-transform: uppercase; }
    td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.75rem; font-weight: 600; border-radius: 9999px; text-transform: capitalize; }
    .badge.waiting { background: #fef3c7; color: #92400e; }
    .badge.in-progress { background: #dbeafe; color: #1e40af; }
    .badge.resolved { background: #dcfce7; color: #166534; }
    .badge.student { background: #e0e7ff; color: #3730a3; }
    .badge.faculty { background: #fce7f3; color: #9d174d; }
    .file-path { background: #f1f5f9; padding: 0.4rem 0.6rem; border-radius: 4px; font-family: monospace; font-size: 0.825rem; }
    .btn { display: inline-block; padding: 0.4rem 0.8rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px; font-size: 0.825rem; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
      <div>
        <h1>Backend Data Viewer</h1>
        <p>Direct view of backend database & persistent JSON storage files</p>
      </div>
      <div>
        <a href="/view-backend" class="btn">🔄 Refresh Data</a>
      </div>
    </div>

    <div class="card">
      <h2>Stored Help Requests (${requests.length})</h2>
      <p style="margin-bottom: 1rem;">File on disk: <span class="file-path">server/data/requests.json</span></p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Student Name</th>
            <th>Help Type</th>
            <th>Description</th>
            <th>Status</th>
            <th>Solution Sent</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>${requestsRows}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Registered Users (${users.length})</h2>
      <p style="margin-bottom: 1rem;">File on disk: <span class="file-path">server/data/users.json</span></p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>${usersRows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`);
});

// App Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Silent Help Request System API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Silent Help Request System Server running on port ${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log(`👁️ Backend Data Viewer: http://localhost:${PORT}/view-backend`);
});
