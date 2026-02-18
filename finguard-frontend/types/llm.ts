export interface LLMMetrics {
  latency: number;
  tokenUsage: number;
  hallucinationScore: number;
  toxicityScore: number;
  piiDetected: boolean;
}
