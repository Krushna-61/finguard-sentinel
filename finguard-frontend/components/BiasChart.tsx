'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { BiasMetric } from '@/types/ml';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface BiasChartProps {
  data: BiasMetric[];
}

const BiasChart: React.FC<BiasChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(b => b.category),
    datasets: [
      {
        label: 'Bias Score',
        data: data.map(b => b.biasScore),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { size: 11 } },
      },
      y: {
        grid: { color: '#334155' },
        ticks: { color: '#94A3B8', font: { size: 11 } },
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default React.memo(BiasChart);
