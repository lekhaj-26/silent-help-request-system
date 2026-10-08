# Silent Help Request System

An academic/lab real-time assistance web application built with **React.js**, **Vite**, **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

The system allows students to silently request assistance from faculty during classes or lab sessions without causing classroom disruptions.

---

## 🚀 Key Features & Workflow

1. **Minimalist Login Page**:
   - Single clean login screen with Role selector (Student / Faculty), Email, and Password.
   - Quick-fill demo accounts for rapid testing.
2. **Student Dashboard**:
   - Personalized welcome message (`Welcome, Student`).
   - Prominent **NEED HELP** alert button.
   - Modal form with assistance categories:
     - *Technical Issue*
     - *Need Explanation*
     - *Equipment Problem*
     - *Other*
     - Optional short description.
   - Instant success confirmation banner: `"Help request sent successfully."`
   - **My Requests** table displaying Help Type, Description, Request Time, and dynamic status badges (*Waiting*, *In Progress*, *Resolved*).
3. **Faculty Dashboard**:
   - **Pending Help Requests**: Ordered with the **longest waiting request first** (prioritized assistance).
   - Dynamic real-time waiting timer (e.g. `3m waiting`, `12s ago`).
   - Two-stage lifecycle action buttons:
     - **Take Request** → Moves status to `in-progress` (recording `acceptedAt`).
     - **Mark as Resolved** → Moves status to `resolved` (recording `resolvedAt`).
   - **Request History**: Clean record of all resolved requests.

---

## 📁 Project Architecture

```
silent-help-system/
├── client/                     # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── HelpRequestModal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state & persistence
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── FacultyDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js          # REST API communication client
│   │   ├── App.jsx             # React Router routing & Protected Routes
│   │   ├── index.css           # Clean modern CSS design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + Mongoose)
│   ├── config/
│   │   └── db.js               # MongoDB connection using process.env.MONGO_URI
│   ├── controllers/
│   │   ├── authController.js   # Login & user management
│   │   └── requestController.js# Help request CRUD & queue logic
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication
│   ├── models/
│   │   ├── User.js             # User Schema (name, email, password, role)
│   │   └── HelpRequest.js      # HelpRequest Schema (studentId, studentName, helpType, description, status, createdAt, acceptedAt, resolvedAt)
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/login
│   │   └── requestRoutes.js    # /api/requests endpoints
│   ├── .env                    # Environment configuration
│   ├── .env.example
│   ├── seed.js                 # Sample seed script
│   ├── server.js               # Main Express application entry point
│   └── package.json
└── README.md
```

---

## ⚙️ Configuration (.env)

The server configuration is located in `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/silent_help_system
JWT_SECRET=silent_help_request_system_secret_key_2026
```

> **Note**: To connect to your MongoDB Atlas or remote cluster, simply replace the `MONGO_URI` value in `server/.env`.

---

## 🛠️ Running the Application

### 1. Start the Backend Server:
```bash
cd server
npm start
```
The server will run on `http://localhost:5000`.

*(Optional: Run `npm run seed` to populate initial test users and sample requests).*

### 2. Start the Frontend Client:
```bash
cd client
npm run dev
```
The Vite development server will run on `http://localhost:5173`.

---

## 🧪 Demo Credentials

You can use the built-in quick-fill buttons or enter:

- **Student Account**:
  - Email: `student@college.edu`
  - Password: `password123`
  - Role: **Student**

- **Faculty Account**:
  - Email: `faculty@college.edu`
  - Password: `password123`
  - Role: **Faculty**

*(Any new student or faculty account entered on the login screen is automatically registered with the selected role for seamless academic evaluation).*

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login user & return JWT token | No |
| `POST` | `/api/requests` | Create new help request | Yes (Student) |
| `GET` | `/api/requests/my` | Retrieve student's own requests | Yes (Student) |
| `GET` | `/api/requests/active` | Get active requests (ordered by longest waiting first) | Yes (Faculty) |
| `PATCH` | `/api/requests/:id/accept` | Faculty accepts request (`waiting` → `in-progress`) | Yes (Faculty) |
| `PATCH` | `/api/requests/:id/resolve` | Faculty resolves request (`in-progress` → `resolved`) | Yes (Faculty) |
| `GET` | `/api/requests/history` | Retrieve resolved request history | Yes (Faculty) |
