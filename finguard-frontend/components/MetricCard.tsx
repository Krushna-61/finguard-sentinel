import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, variant = 'default' }) => {
  const variantColors = {
    default: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  return (
    <div style={{
      background: '#1E293B',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #334155',
    }}>
      <div style={{
        fontSize: '13px',
        color: '#94A3B8',
        marginBottom: '8px',
        fontWeight: 500,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '32px',
        fontWeight: 600,
        color: variantColors[variant],
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
      }}>
        {value}
        {unit && <span style={{ fontSize: '16px', color: '#94A3B8' }}>{unit}</span>}
      </div>
    </div>
  );
};

export default React.memo(MetricCard);
