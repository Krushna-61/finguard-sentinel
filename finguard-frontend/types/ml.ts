export interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface DriftDataPoint {
  timestamp: string;
  driftScore: number;
}

export interface BiasMetric {
  category: string;
  biasScore: number;
}

export interface MLObservabilityData {
  metrics: MLMetrics;
  drift: DriftDataPoint[];
  bias: BiasMetric[];
}
