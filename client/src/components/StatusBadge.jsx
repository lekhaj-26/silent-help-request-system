import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s?.toLowerCase()) {
      case 'waiting':
        return 'badge-waiting';
      case 'in-progress':
        return 'badge-in-progress';
      case 'resolved':
        return 'badge-resolved';
      default:
        return 'badge-waiting';
    }
  };

  const formatStatus = (s) => {
    if (!s) return 'Waiting';
    if (s.toLowerCase() === 'in-progress') return 'In Progress';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
