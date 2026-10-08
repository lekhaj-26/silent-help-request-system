import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="system-title">
          Silent Help Request System
        </div>
        {user && (
          <div className="user-badge">
            <span className="user-info">
              {user.name}
              <span className="user-role-tag">{user.role}</span>
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              id="logout-btn"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
