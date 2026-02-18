import apiClient from './apiClient';
import { LLMMetrics } from '@/types/llm';

const generateMockLLMData = (): LLMMetrics => {
  return {
    latency: 500 + Math.floor(Math.random() * 700),
    tokenUsage: 5000 + Math.floor(Math.random() * 20000),
    hallucinationScore: 12,
    toxicityScore: 8,
    piiDetected: false,
  };
};

export const llmService = {
  async getMetrics(): Promise<LLMMetrics> {
    try {
      const response = await apiClient.get<LLMMetrics>('/api/llm/metrics');
      return response.data;
    } catch {
      return generateMockLLMData();
    }
  },
};
