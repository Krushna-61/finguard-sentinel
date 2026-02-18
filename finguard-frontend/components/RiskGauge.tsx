'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

interface RiskGaugeProps {
  score: number;
  label?: string;
}

const getRiskColor = (score: number): string => {
  if (score <= 30) return '#22C55E';
  if (score <= 60) return '#F59E0B';
  if (score <= 85) return '#FB923C';
  return '#EF4444';
};

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, label }) => {
  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [getRiskColor(score), '#0F172A'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Doughnut data={data} options={options} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: 700,
          color: getRiskColor(score),
        }}>
          {score}
        </div>
        {label && (
          <div style={{
            fontSize: '10px',
            color: '#6B7280',
            marginTop: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(RiskGauge);
