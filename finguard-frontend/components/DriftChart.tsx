'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';
import { DriftDataPoint } from '@/types/ml';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface DriftChartProps {
  data: DriftDataPoint[];
}

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timestamp;
  }
};

const DriftChart: React.FC<DriftChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => formatTimestamp(d.timestamp)),
    datasets: [
      {
        label: 'Drift Score',
        data: data.map(d => d.driftScore),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#3B82F6',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: '#334155' },
        ticks: { color: '#94A3B8', font: { size: 11 } },
      },
      y: {
        grid: { color: '#334155' },
        ticks: { color: '#94A3B8', font: { size: 11 } },
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default React.memo(DriftChart);
