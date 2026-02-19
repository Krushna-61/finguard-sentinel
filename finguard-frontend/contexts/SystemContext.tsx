'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { backendService } from '@/services/backendService';

// Types
interface InferenceData {
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
  pii_detected: boolean;
  drift_score: number;
  bias_score: number;
  toxicity_score: number;
  hallucination_score: number;
  latency_ms: number;
  token_usage: number;
  timestamp?: string;
}

interface DriftDataPoint {
  timestamp: string;
  driftScore: number;
}

interface BiasMetric {
  category: string;
  biasScore: number;
}

interface SystemState {
  // Current inference data
  currentInference: InferenceData | null;
  
  // Historical chart data
  driftHistory: DriftDataPoint[];
  biasHistory: BiasMetric[];
  
  // Backend connection status
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  runInference: (text: string) => Promise<void>;
  checkConnection: () => Promise<void>;
  refreshChartData: () => Promise<void>;
}

const SystemContext = createContext<SystemState | undefined>(undefined);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [currentInference, setCurrentInference] = useState<InferenceData | null>(null);
  const [driftHistory, setDriftHistory] = useState<DriftDataPoint[]>([]);
  const [biasHistory, setBiasHistory] = useState<BiasMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chart data from backend
  const refreshChartData = useCallback(async () => {
    try {
      const [drift, bias] = await Promise.all([
        backendService.getDriftHistory(20),
        backendService.getBiasHistory(),
      ]);
      setDriftHistory(drift);
      setBiasHistory(bias);
    } catch (err: any) {
      // Silently fail for chart data - not critical
      console.warn('Failed to fetch chart data:', err.message || err);
    }
  }, []);

  // Check backend connection
  const checkConnection = useCallback(async () => {
    try {
      await backendService.checkHealth();
      setIsConnected(true);
      setError(null);
    } catch (err: any) {
      setIsConnected(false);
      const errorMessage = err.message === 'Backend offline'
        ? 'Backend offline - Start backend server' 
        : err.message === 'Authentication failed'
        ? 'Authentication failed - Check API key'
        : 'Backend connection failed';
      setError(errorMessage);
      console.error('Backend connection failed:', err);
    }
  }, []);

  // Run inference
  const runInference = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await backendService.runInference(text);
      
      // Validate response structure
      if (!result || !result.risk_assessment) {
        throw new Error('Invalid response from backend');
      }
      
      // Transform backend response to our state format - NO FALLBACK DEFAULTS
      const inferenceData: InferenceData = {
        composite_score: result.risk_assessment?.composite_score ?? 0,
        tier: result.risk_assessment?.tier ?? 'STABLE',
        breakdown: result.risk_assessment?.breakdown ?? {
          pii: 0,
          toxicity: 0,
          bias: 0,
          drift: 0,
          hallucination: 0,
          latency: 0,
        },
        triggered_rules: result.risk_assessment?.triggered_rules ?? [],
        pii_detected: result.inference_results?.pii?.detected ?? false,
        drift_score: result.drift_score ?? 0,
        bias_score: result.bias_score ?? 0,
        toxicity_score: result.inference_results?.toxicity?.score ?? 0,
        hallucination_score: result.inference_results?.hallucination?.score ?? 0,
        latency_ms: result.inference_wall_clock_ms ?? 0,
        token_usage: result.token_usage ?? 0,
        timestamp: new Date().toISOString(),
      };
      
      setCurrentInference(inferenceData);
      setIsConnected(true);
    } catch (err: any) {
      let errorMessage = 'Inference failed';
      
      if (err.message === 'Backend offline') {
        errorMessage = 'Backend offline - Cannot run inference';
      } else if (err.message === 'Authentication failed') {
        errorMessage = 'Authentication failed - Check API key';
      } else if (err.response?.status === 429) {
        errorMessage = 'Rate limit exceeded - Please wait';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Inference failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    
    // Poll connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Fetch chart data on mount and refresh every 5 seconds
  useEffect(() => {
    if (isConnected) {
      refreshChartData();
      const interval = setInterval(refreshChartData, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, refreshChartData]);

  // Run initial inference with sample text only if connected
  useEffect(() => {
    if (isConnected && !currentInference && !isLoading) {
      runInference('Sample banking transaction for risk assessment');
    }
  }, [isConnected, currentInference, isLoading, runInference]);

  return (
    <SystemContext.Provider
      value={{
        currentInference,
        driftHistory,
        biasHistory,
        isConnected,
        isLoading,
        error,
        runInference,
        checkConnection,
        refreshChartData,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
