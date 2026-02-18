import React from 'react';

interface StatusBadgeProps {
  status: 'low' | 'medium' | 'high' | 'critical' | 'success' | 'failure' | 'pending' | 'active' | 'inactive' | 'stable' | 'elevated';
  label?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const statusConfig = {
    low: { bg: '#22C55E20', color: '#22C55E', text: label || 'Low' },
    medium: { bg: '#F59E0B20', color: '#F59E0B', text: label || 'Medium' },
    high: { bg: '#FB923C20', color: '#FB923C', text: label || 'High' },
    critical: { bg: '#EF444420', color: '#EF4444', text: label || 'Critical' },
    stable: { bg: '#22C55E20', color: '#22C55E', text: label || 'Stable' },
    elevated: { bg: '#F59E0B20', color: '#F59E0B', text: label || 'Elevated' },
    success: { bg: '#22C55E20', color: '#22C55E', text: label || 'Success' },
    failure: { bg: '#EF444420', color: '#EF4444', text: label || 'Failure' },
    pending: { bg: '#F59E0B20', color: '#F59E0B', text: label || 'Pending' },
    active: { bg: '#22C55E20', color: '#22C55E', text: label || 'Active' },
    inactive: { bg: '#94A3B820', color: '#94A3B8', text: label || 'Inactive' },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: config.bg,
      color: config.color,
    }}>
      {config.text}
    </span>
  );
};

export default React.memo(StatusBadge);
