import apiClient from './apiClient';
import { MLObservabilityData } from '@/types/ml';

const generateMockMLData = (): MLObservabilityData => {
  const now = Date.now();
  const drift = Array.from({ length: 20 }, (_, i) => ({
    timestamp: new Date(now - (19 - i) * 300000).toISOString(),
    driftScore: 0.02 + Math.random() * 0.06,
  }));

  return {
    metrics: {
      accuracy: 0.94 + Math.random() * 0.04,
      precision: 0.92 + Math.random() * 0.05,
      recall: 0.91 + Math.random() * 0.06,
      f1Score: 0.93 + Math.random() * 0.04,
    },
    drift,
    bias: [
      { category: 'Gender', biasScore: 0.05 + Math.random() * 0.10 },
      { category: 'Age', biasScore: 0.08 + Math.random() * 0.08 },
      { category: 'Geography', biasScore: 0.06 + Math.random() * 0.09 },
      { category: 'Income', biasScore: 0.07 + Math.random() * 0.11 },
    ],
  };
};

export const mlService = {
  async getObservabilityData(): Promise<MLObservabilityData> {
    try {
      const response = await apiClient.get<MLObservabilityData>('/api/ml/observability');
      return response.data;
    } catch {
      return generateMockMLData();
    }
  },
};
