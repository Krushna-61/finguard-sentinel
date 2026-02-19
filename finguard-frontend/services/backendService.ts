import apiClient from './apiClient';

// Backend API Response Types
export interface InferenceRecord {
  id: string;
  input_hash: string;
  token_usage: number;
  latency_ms: number;
  drift_score: number;
  bias_score: number;
  toxicity_score: number;
  hallucination_score: number;
  composite_score: number;
  tier: string;
  pii_detected: boolean;
  triggered_rules: {
    rules: string[];
    breakdown: {
      pii: number;
      toxicity: number;
      bias: number;
      drift: number;
      hallucination: number;
      latency: number;
    };
    embedding: number[];
  };
  timestamp: string;
}

export interface SystemHealth {
  message: string;
  status: string;
  version: string;
  environment: string;
}

export interface DriftDataPoint {
  timestamp: string;
  driftScore: number;
}

export interface BiasMetric {
  category: string;
  biasScore: number;
}

export interface DriftHistoryResponse {
  has_data: boolean;
  data: DriftDataPoint[];
}

export interface BiasHistoryResponse {
  has_data: boolean;
  data: BiasMetric[];
}

// Backend Service
export const backendService = {
  // Run inference
  async runInference(text: string) {
    try {
      const response = await apiClient.post('/api/test/inference', { text });
      return response.data;
    } catch (error: any) {
      if (error.isNetworkError) {
        throw new Error('Backend offline');
      }
      if (error.isAuthError) {
        throw new Error('Authentication failed');
      }
      throw error;
    }
  },

  // Check backend health
  async checkHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get<SystemHealth>('/');
      return response.data;
    } catch (error: any) {
      if (error.isNetworkError) {
        throw new Error('Backend offline');
      }
      throw error;
    }
  },

  // Get drift history - returns empty if no data
  async getDriftHistory(limit: number = 20): Promise<DriftDataPoint[]> {
    try {
      const response = await apiClient.get<DriftHistoryResponse>(`/api/system/drift-history?limit=${limit}`);
      return response.data.has_data ? response.data.data : [];
    } catch (error: any) {
      console.warn('Drift history endpoint not available:', error.message);
      return [];
    }
  },

  // Get bias history - returns empty if no data
  async getBiasHistory(): Promise<BiasMetric[]> {
    try {
      const response = await apiClient.get<BiasHistoryResponse>('/api/system/bias-history');
      return response.data.has_data ? response.data.data : [];
    } catch (error: any) {
      console.warn('Bias history endpoint not available:', error.message);
      return [];
    }
  },

  // Get latest inference records (for dashboard data)
  async getLatestInferences(limit: number = 20) {
    // This would need a backend endpoint to fetch recent inferences
    // For now, we'll rely on the inference endpoint
    return [];
  },
};

