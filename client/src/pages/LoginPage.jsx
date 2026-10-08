import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegistering && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);

      if (isRegistering) {
        // Create account and store in database
        await api.register(name, email, password, role);
        setIsRegistering(false);
        setEmail('');
        setPassword('');
        setName('');
        setSuccess('Account created successfully! Please enter your email and password to log in.');

        // Auto-dismiss alert message after 4 seconds
        setTimeout(() => {
          setSuccess('');
        }, 4000);
      } else {
        // Log in to existing account
        const user = await login(email, password, role);

        if (user.role === 'faculty') {
          navigate('/faculty');
        } else {
          navigate('/student');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">
          {isRegistering ? 'Create Account' : 'Silent Help System'}
        </h1>
        <p className="login-subtitle">
          {isRegistering
            ? `Register as a new ${role} to get started`
            : 'Sign in to request or manage lab assistance'}
        </p>

        {error && (
          <div className="alert alert-error" id="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" id="auth-success">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selector Tabs (Student / Faculty) */}
          <div className="form-group">
            <label className="form-label">Select Role</label>
            <div className="role-tabs">
              <button
                type="button"
                className={`role-tab-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}
                id="role-student-btn"
              >
                Student
              </button>
              <button
                type="button"
                className={`role-tab-btn ${role === 'faculty' ? 'active' : ''}`}
                onClick={() => setRole('faculty')}
                id="role-faculty-btn"
              >
                Faculty
              </button>
            </div>
          </div>

          {/* Full Name Field (when registering) */}
          {isRegistering && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className="form-control"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegistering}
              />
            </div>
          )}

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            {isLoading
              ? isRegistering
                ? 'Creating Account...'
                : 'Signing In...'
              : isRegistering
              ? 'Create Account'
              : 'Login'}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          {isRegistering ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                id="switch-to-login"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                id="switch-to-register"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Create an account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
