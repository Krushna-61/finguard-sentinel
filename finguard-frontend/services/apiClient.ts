import axios, { AxiosError } from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add authentication headers
apiClient.interceptors.request.use(
  (config) => {
    // Add API key if available
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) {
      config.headers['X-API-KEY'] = apiKey;
    }

    // Add JWT token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token on 401
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      
      // Return structured error instead of crashing
      return Promise.reject({
        message: 'Authentication failed',
        status: 401,
        isAuthError: true,
      });
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject({
        message: 'Backend offline',
        status: 0,
        isNetworkError: true,
      });
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface InferenceResult {
  input_text: string;
  inference_results: {
    pii: {
      detected: boolean;
      entities_count: number;
      latency_ms: number;
      error?: string;
    };
    toxicity: {
      score: number;
      latency_ms: number;
      error?: string;
    };
    embeddings: {
      dimension: number;
      latency_ms: number;
      error?: string;
    };
    hallucination: {
      score: number;
      latency_ms: number;
      error?: string;
    };
  };
  inference_wall_clock_ms: number;
  drift_score: number;
  bias_score: number;
  token_usage: number;
  risk_assessment: {
    composite_score: number;
    tier: string;
    breakdown: {
      pii: number;
      toxicity: number;
      bias: number;
      drift: number;
      hallucination: number;
      latency: number;
    };
    triggered_rules: string[];
  };
  all_successful: boolean;
  record_id: string;
}

// API Methods
export const api = {
  // Run inference on text
  async runInference(text: string): Promise<InferenceResult> {
    const response = await apiClient.post<InferenceResult>('/api/test/inference', { text });
    return response.data;
  },

  // Get system health
  async getHealth() {
    const response = await apiClient.get('/');
    return response.data;
  },
};

export default apiClient;
