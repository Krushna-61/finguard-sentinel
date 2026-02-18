import React from 'react';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, height = 300 }) => {
  return (
    <div style={{
      background: '#1E293B',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #334155',
    }}>
      <h3 style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#F8FAFC',
        marginBottom: '16px',
      }}>
        {title}
      </h3>
      <div style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;
