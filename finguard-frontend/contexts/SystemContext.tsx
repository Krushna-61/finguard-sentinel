'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MLObservabilityData } from '@/types/ml';
import { LLMMetrics } from '@/types/llm';
import { AuditEntry } from '@/types/governance';
import { mlService } from '@/services/mlService';
import { llmService } from '@/services/llmService';
import { governanceService } from '@/services/governanceService';

interface Incident {
  id: string;
  trigger: string;
  timestamp: string;
  riskBefore: number;
  riskAfter: number;
  events: AuditEntry[];
  rootCause: string;
  riskDelta: number;
}

interface RiskBreakdown {
  driftImpact: number;
  biasImpact: number;
  piiImpact: number;
  latencyImpact: number;
}

interface RiskUpdate {
  oldRisk: number;
  newRisk: number;
  oldBreakdown: RiskBreakdown;
  newBreakdown: RiskBreakdown;
  oldTier: RiskTier;
  newTier: RiskTier;
  timestamp: number;
}

type RiskTier = 'STABLE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

interface SystemState {
  compositeRisk: number;
  riskTier: RiskTier;
  riskBreakdown: RiskBreakdown;
  driftLevel: number;
  driftVolatility: number;
  biasLevel: number;
  biasVariance: number;
  piiDetected: boolean;
  latency: number;
  latencyTrend: number;
  tokenRate: number;
  auditLogs: AuditEntry[];
  incidents: Incident[];
  systemStatus: 'normal' | 'warning' | 'critical';
  mlData: MLObservabilityData | null;
  llmData: LLMMetrics | null;
  alertMessage: string | null;
  riskHistory: number[];
  riskUpdate: RiskUpdate | null;
  systemStabilityScore: number;
  metricConfidence: number;
  complianceFlag: boolean;
  latencyInstability: number;
  triggerDriftSpike: () => void;
  triggerPIIBreach: () => void;
  triggerBiasEscalation: () => void;
  triggerLatencySurge: () => void;
  resetSystem: () => void;
}

const SystemContext = createContext<SystemState | undefined>(undefined);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [mlData, setMLData] = useState<MLObservabilityData | null>(null);
  const [llmData, setLLMData] = useState<LLMMetrics | null>(null);
  const [compositeRisk, setCompositeRisk] = useState(0);
  const [riskTier, setRiskTier] = useState<RiskTier>('STABLE');
  const [riskBreakdown, setRiskBreakdown] = useState<RiskBreakdown>({
    driftImpact: 0,
    biasImpact: 0,
    piiImpact: 0,
    latencyImpact: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [systemStatus, setSystemStatus] = useState<'normal' | 'warning' | 'critical'>('normal');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [driftVolatility, setDriftVolatility] = useState(0);
  const [biasVariance, setBiasVariance] = useState(0);
  const [latencyTrend, setLatencyTrend] = useState(0);
  const [riskHistory, setRiskHistory] = useState<number[]>([]);
  const [riskUpdate, setRiskUpdate] = useState<RiskUpdate | null>(null);
  const [systemStabilityScore, setSystemStabilityScore] = useState(0);
  const [metricConfidence, setMetricConfidence] = useState(1);
  const [complianceFlag, setComplianceFlag] = useState(false);
  const [latencyInstability, setLatencyInstability] = useState(0);
  
  // Baseline values for recovery
  const [baselineMetrics] = useState({
    accuracy: 0.94,
    precision: 0.92,
    recall: 0.91,
    f1Score: 0.915,
    hallucinationScore: 12,
    toxicityScore: 8,
  });

  const calculateRisk = (ml: MLObservabilityData | null, llm: LLMMetrics | null) => {
    if (!ml || !llm) return { risk: 0, breakdown: riskBreakdown };

    // Normalize all metrics to 0-1 scale
    const driftLevel = ml.drift[ml.drift.length - 1]?.driftScore || 0;
    const biasLevel = ml.bias.length > 0 ? ml.bias.reduce((sum, b) => sum + b.biasScore, 0) / ml.bias.length : 0;
    
    const driftScore = Math.min(driftLevel, 1);
    const biasScore = Math.min(biasLevel, 1);
    const latencyScore = Math.min(llm.latency / 2000, 1);
    const piiScore = llm.piiDetected ? 1 : 0;

    // Calculate base risk without PII
    const baseRisk = (driftScore * 0.30) + (biasScore * 0.25) + (latencyScore * 0.15);

    // PII amplifies risk significantly
    let risk: number;
    if (llm.piiDetected) {
      risk = (baseRisk * 1.4) + 0.25;
    } else {
      risk = baseRisk;
    }

    const finalRisk = Math.min(risk, 1) * 100;

    // Calculate individual impacts for breakdown (0-100 scale)
    const driftImpact = Math.round(driftScore * 100);
    const biasImpact = Math.round(biasScore * 100);
    const latencyImpact = Math.round(latencyScore * 100);
    const piiImpact = llm.piiDetected ? 100 : 0;

    return {
      risk: Math.round(finalRisk),
      breakdown: { driftImpact, biasImpact, piiImpact, latencyImpact }
    };
  };

  const getRiskTier = (risk: number, piiDetected: boolean, biasScore: number): RiskTier => {
    // PII detection forces minimum HIGH tier
    if (piiDetected) {
      // PII + high bias = CRITICAL
      if (biasScore > 0.6) return 'CRITICAL';
      return 'HIGH';
    }

    // Standard tier logic without PII
    if (risk <= 30) return 'STABLE';
    if (risk <= 60) return 'ELEVATED';
    if (risk <= 80) return 'HIGH';
    return 'CRITICAL';
  };

  const calculateSystemStability = (
    driftVol: number,
    biasVar: number,
    latencyInst: number
  ): number => {
    // Normalize inputs to 0-1 scale
    const driftVolNormalized = Math.min(driftVol / 0.1, 1);
    const biasVarNormalized = Math.min(biasVar / 0.1, 1);
    const latencyInstNormalized = Math.min(latencyInst / 500, 1);

    // Calculate stability score (higher = more unstable)
    const stability = 
      (driftVolNormalized * 0.4) +
      (biasVarNormalized * 0.35) +
      (latencyInstNormalized * 0.25);

    return Math.max(0, Math.min(1, stability));
  };

  useEffect(() => {
    const fetchData = async () => {
      const [ml, llm, audit] = await Promise.all([
        mlService.getObservabilityData(),
        llmService.getMetrics(),
        governanceService.getAuditLogs(),
      ]);

      setMLData(ml);
      setLLMData(llm);
      
      const { risk, breakdown } = calculateRisk(ml, llm);
      const biasLevel = ml.bias.length > 0 ? ml.bias.reduce((sum, b) => sum + b.biasScore, 0) / ml.bias.length : 0;
      setCompositeRisk(risk);
      setRiskBreakdown(breakdown);
      setRiskTier(getRiskTier(risk, llm.piiDetected, biasLevel));
      setRiskHistory([risk]);
      setAuditLogs(audit.entries);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fluctuateInterval = setInterval(() => {
      setMLData(prev => {
        if (!prev) return prev;
        const newDrift = prev.drift.map(d => ({
          ...d,
          driftScore: Math.max(0, d.driftScore + (Math.random() - 0.5) * 0.01),
        }));
        
        const volatility = newDrift.slice(-5).reduce((sum, d, i, arr) => {
          if (i === 0) return 0;
          return sum + Math.abs(d.driftScore - arr[i-1].driftScore);
        }, 0) / 4;
        setDriftVolatility(volatility);

        return { ...prev, drift: newDrift };
      });

      setLLMData(prev => {
        if (!prev) return prev;
        const newLatency = Math.max(0, prev.latency + (Math.random() - 0.5) * 30);
        const latencyChange = Math.abs(newLatency - prev.latency);
        setLatencyTrend(newLatency - prev.latency);
        setLatencyInstability(prevInst => {
          const newInst = (prevInst * 0.7) + (latencyChange * 0.3);
          return newInst;
        });
        
        return {
          ...prev,
          latency: newLatency,
          tokenUsage: prev.tokenUsage + Math.floor(Math.random() * 8),
        };
      });

      if (mlData && llmData) {
        const { risk, breakdown } = calculateRisk(mlData, llmData);
        const biasLevel = mlData.bias.length > 0 ? mlData.bias.reduce((sum, b) => sum + b.biasScore, 0) / mlData.bias.length : 0;
        setCompositeRisk(risk);
        setRiskBreakdown(breakdown);
        const tier = getRiskTier(risk, llmData.piiDetected, biasLevel);
        setRiskTier(tier);
        setSystemStatus(tier === 'CRITICAL' ? 'critical' : tier === 'HIGH' ? 'warning' : 'normal');
        setRiskHistory(prev => [...prev, risk].slice(-30));
      }
    }, 2000);

    const auditInterval = setInterval(() => {
      const eventTypes = ['Model Deployment', 'Policy Update', 'Access Review', 'Data Validation'];
      const statuses: Array<'success' | 'failure' | 'pending'> = ['success', 'success', 'success'];
      
      const newEntry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date().toISOString(),
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: statuses[Math.floor(Math.random() * statuses.length)],
      };

      setAuditLogs(prev => [newEntry, ...prev].slice(0, 50));
    }, 6000);

    // Degradation Engine - runs every 2 seconds
    const degradationInterval = setInterval(() => {
      // Calculate current stability score
      const stability = calculateSystemStability(driftVolatility, biasVariance, latencyInstability);
      setSystemStabilityScore(stability);
      setMetricConfidence(1 - stability);

      // Get normalized metrics for compound event detection
      const driftNormalized = mlData?.drift[mlData.drift.length - 1]?.driftScore || 0;
      const biasNormalized = mlData?.bias && mlData.bias.length > 0 
        ? mlData.bias.reduce((sum, b) => sum + b.biasScore, 0) / mlData.bias.length 
        : 0;
      const latencyNormalized = (llmData?.latency || 0) / 2000;

      // Calculate decay multiplier for compound events
      let decayMultiplier = 1;
      if (driftNormalized > 0.7 && biasNormalized > 0.6) {
        decayMultiplier = 1.5;
      }
      if (driftNormalized + biasNormalized + latencyNormalized > 2) {
        decayMultiplier = 2;
      }

      // Apply degradation if system is unstable
      if (stability > 0.6) {
        const effectiveStability = stability * decayMultiplier;
        let degradationStarted = false;

        setMLData(prev => {
          if (!prev) return prev;
          
          const newMetrics = { ...prev.metrics };
          
          // Degrade ML metrics (not affected by PII)
          newMetrics.accuracy = Math.max(0.75, prev.metrics.accuracy - (0.002 * effectiveStability));
          newMetrics.precision = Math.max(0.75, prev.metrics.precision - (0.0015 * effectiveStability));
          newMetrics.recall = Math.max(0.75, prev.metrics.recall - (0.002 * effectiveStability));
          newMetrics.f1Score = Math.max(0.75, prev.metrics.f1Score - (0.001 * effectiveStability));

          if (prev.metrics.accuracy !== newMetrics.accuracy) {
            degradationStarted = true;
          }

          return { ...prev, metrics: newMetrics };
        });

        setLLMData(prev => {
          if (!prev) return prev;
          
          // Degrade LLM metrics
          const newHallucination = Math.min(100, prev.hallucinationScore + (1 * effectiveStability));
          const newToxicity = Math.min(100, prev.toxicityScore + (0.5 * effectiveStability));

          return {
            ...prev,
            hallucinationScore: newHallucination,
            toxicityScore: newToxicity,
          };
        });

        // Log degradation event once
        if (degradationStarted && stability > 0.7) {
          const degradationEntry: AuditEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timestamp: new Date().toISOString(),
            eventType: 'Performance Degradation',
            hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            status: 'failure',
          };
          setAuditLogs(prev => {
            if (prev[0]?.eventType === 'Performance Degradation') return prev;
            return [degradationEntry, ...prev].slice(0, 50);
          });
        }
      }

      // Apply recovery if system is stable
      if (stability < 0.4) {
        let recoveryStarted = false;

        setMLData(prev => {
          if (!prev) return prev;
          
          const newMetrics = { ...prev.metrics };
          
          // Recover ML metrics toward baseline
          newMetrics.accuracy = Math.min(baselineMetrics.accuracy, prev.metrics.accuracy + 0.001);
          newMetrics.precision = Math.min(baselineMetrics.precision, prev.metrics.precision + 0.001);
          newMetrics.recall = Math.min(baselineMetrics.recall, prev.metrics.recall + 0.001);
          newMetrics.f1Score = Math.min(baselineMetrics.f1Score, prev.metrics.f1Score + 0.001);

          if (prev.metrics.accuracy !== newMetrics.accuracy) {
            recoveryStarted = true;
          }

          return { ...prev, metrics: newMetrics };
        });

        setLLMData(prev => {
          if (!prev) return prev;
          
          // Recover LLM metrics toward baseline
          const newHallucination = Math.max(baselineMetrics.hallucinationScore, prev.hallucinationScore - 0.5);
          const newToxicity = Math.max(baselineMetrics.toxicityScore, prev.toxicityScore - 0.3);

          return {
            ...prev,
            hallucinationScore: newHallucination,
            toxicityScore: newToxicity,
          };
        });

        // Log recovery event once
        if (recoveryStarted && stability < 0.3) {
          const recoveryEntry: AuditEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timestamp: new Date().toISOString(),
            eventType: 'Stability Recovery Initiated',
            hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            status: 'success',
          };
          setAuditLogs(prev => {
            if (prev[0]?.eventType === 'Stability Recovery Initiated') return prev;
            return [recoveryEntry, ...prev].slice(0, 50);
          });
        }
      }
    }, 2000);

    return () => {
      clearInterval(fluctuateInterval);
      clearInterval(auditInterval);
      clearInterval(degradationInterval);
    };
  }, [mlData, llmData, driftVolatility, biasVariance, latencyInstability, baselineMetrics]);

  const createIncident = (trigger: string, riskBefore: number, events: AuditEntry[], rootCause: string) => {
    const riskDelta = compositeRisk - riskBefore;
    const incident: Incident = {
      id: `incident-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      trigger,
      timestamp: new Date().toISOString(),
      riskBefore,
      riskAfter: compositeRisk,
      events,
      rootCause,
      riskDelta,
    };
    setIncidents(prev => [incident, ...prev].slice(0, 20));
  };

  const addAuditEntry = (eventType: string, status: 'success' | 'failure' | 'pending') => {
    const newEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      eventType,
      hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status,
    };
    setAuditLogs(prev => [newEntry, ...prev].slice(0, 50));
    return newEntry;
  };

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const triggerDriftSpike = () => {
    const oldRisk = compositeRisk;
    const oldBreakdown = { ...riskBreakdown };
    const oldTier = riskTier;
    const events: AuditEntry[] = [];
    
    setMLData(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        drift: prev.drift.map(d => ({
          ...d,
          driftScore: Math.min(0.95, d.driftScore + 0.25),
        })),
      };
      
      const { risk, breakdown } = calculateRisk(updated, llmData);
      const biasLevel = updated.bias && updated.bias.length > 0 ? updated.bias.reduce((sum, b) => sum + b.biasScore, 0) / updated.bias.length : 0;
      setCompositeRisk(risk);
      setRiskBreakdown(breakdown);
      const tier = getRiskTier(risk, llmData?.piiDetected || false, biasLevel);
      setRiskTier(tier);
      setSystemStatus(tier === 'CRITICAL' ? 'critical' : tier === 'HIGH' ? 'warning' : 'normal');
      setRiskHistory(prev => [...prev, risk].slice(-30));
      
      setRiskUpdate({
        oldRisk,
        newRisk: risk,
        oldBreakdown,
        newBreakdown: breakdown,
        oldTier,
        newTier: tier,
        timestamp: Date.now(),
      });
      setTimeout(() => setRiskUpdate(null), 6000);
      
      return updated;
    });

    events.push(addAuditEntry('Drift Anomaly Detected', 'failure'));
    events.push(addAuditEntry('Risk Recalculated', 'pending'));
    events.push(addAuditEntry('Alert Issued', 'success'));
    events.push(addAuditEntry('Monitoring Escalation', 'pending'));

    createIncident('Drift Spike', oldRisk, events, 'Drift Volatility');
    showAlert('SYSTEM ALERT — DRIFT SPIKE DETECTED');
  };

  const triggerPIIBreach = () => {
    const oldRisk = compositeRisk;
    const oldBreakdown = { ...riskBreakdown };
    const oldTier = riskTier;
    const events: AuditEntry[] = [];

    // Set compliance flag for regulatory incident
    setComplianceFlag(true);

    setLLMData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, piiDetected: true };
      
      const { risk, breakdown } = calculateRisk(mlData, updated);
      const biasLevel = mlData?.bias && mlData.bias.length > 0 ? mlData.bias.reduce((sum, b) => sum + b.biasScore, 0) / mlData.bias.length : 0;
      setCompositeRisk(risk);
      setRiskBreakdown(breakdown);
      const tier = getRiskTier(risk, updated.piiDetected, biasLevel);
      setRiskTier(tier);
      setSystemStatus(tier === 'CRITICAL' ? 'critical' : tier === 'HIGH' ? 'warning' : 'normal');
      setRiskHistory(prev => [...prev, risk].slice(-30));
      
      setRiskUpdate({
        oldRisk,
        newRisk: risk,
        oldBreakdown,
        newBreakdown: breakdown,
        oldTier,
        newTier: tier,
        timestamp: Date.now(),
      });
      setTimeout(() => setRiskUpdate(null), 6000);
      
      return updated;
    });

    events.push(addAuditEntry('PII Exposure Detected', 'failure'));
    events.push(addAuditEntry('Risk Recalculated', 'pending'));
    events.push(addAuditEntry('Compliance Flag Raised', 'failure'));
    events.push(addAuditEntry('Alert Issued', 'success'));

    createIncident('PII Breach', oldRisk, events, 'PII Detection');
    showAlert('SYSTEM ALERT — PII BREACH DETECTED');
  };

  const triggerBiasEscalation = () => {
    const oldRisk = compositeRisk;
    const oldBreakdown = { ...riskBreakdown };
    const oldTier = riskTier;
    const events: AuditEntry[] = [];

    setMLData(prev => {
      if (!prev) return prev;
      const newBias = prev.bias.map(b => ({
        ...b,
        biasScore: Math.min(0.95, b.biasScore + 0.30),
      }));
      
      const variance = newBias.reduce((sum, b, i) => {
        if (i === 0) return 0;
        return sum + Math.abs(b.biasScore - newBias[i-1].biasScore);
      }, 0) / (newBias.length - 1);
      setBiasVariance(variance);

      const updated = { ...prev, bias: newBias };
      
      const { risk, breakdown } = calculateRisk(updated, llmData);
      const biasLevel = updated.bias.length > 0 ? updated.bias.reduce((sum, b) => sum + b.biasScore, 0) / updated.bias.length : 0;
      setCompositeRisk(risk);
      setRiskBreakdown(breakdown);
      const tier = getRiskTier(risk, llmData?.piiDetected || false, biasLevel);
      setRiskTier(tier);
      setSystemStatus(tier === 'CRITICAL' ? 'critical' : tier === 'HIGH' ? 'warning' : 'normal');
      setRiskHistory(prev => [...prev, risk].slice(-30));
      
      setRiskUpdate({
        oldRisk,
        newRisk: risk,
        oldBreakdown,
        newBreakdown: breakdown,
        oldTier,
        newTier: tier,
        timestamp: Date.now(),
      });
      setTimeout(() => setRiskUpdate(null), 6000);
      
      return updated;
    });

    events.push(addAuditEntry('Bias Escalation Detected', 'failure'));
    events.push(addAuditEntry('Risk Recalculated', 'pending'));
    events.push(addAuditEntry('Monitoring Escalation', 'pending'));

    createIncident('Bias Escalation', oldRisk, events, 'Bias Variance');
    showAlert('SYSTEM ALERT — BIAS ESCALATION DETECTED');
  };

  const triggerLatencySurge = () => {
    const oldRisk = compositeRisk;
    const oldBreakdown = { ...riskBreakdown };
    const oldTier = riskTier;
    const events: AuditEntry[] = [];

    setLLMData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, latency: prev.latency + 900 };
      
      const { risk, breakdown } = calculateRisk(mlData, updated);
      const biasLevel = mlData?.bias && mlData.bias.length > 0 ? mlData.bias.reduce((sum, b) => sum + b.biasScore, 0) / mlData.bias.length : 0;
      setCompositeRisk(risk);
      setRiskBreakdown(breakdown);
      const tier = getRiskTier(risk, updated.piiDetected, biasLevel);
      setRiskTier(tier);
      setSystemStatus(tier === 'CRITICAL' ? 'critical' : tier === 'HIGH' ? 'warning' : 'normal');
      setRiskHistory(prev => [...prev, risk].slice(-30));
      
      setRiskUpdate({
        oldRisk,
        newRisk: risk,
        oldBreakdown,
        newBreakdown: breakdown,
        oldTier,
        newTier: tier,
        timestamp: Date.now(),
      });
      setTimeout(() => setRiskUpdate(null), 6000);
      
      return updated;
    });

    events.push(addAuditEntry('Latency Surge Detected', 'failure'));
    events.push(addAuditEntry('Risk Recalculated', 'pending'));
    events.push(addAuditEntry('Performance Alert', 'failure'));

    createIncident('Latency Surge', oldRisk, events, 'Latency Instability');
    showAlert('SYSTEM ALERT — LATENCY SURGE DETECTED');
  };

  const resetSystem = async () => {
    const oldRisk = compositeRisk;
    const oldBreakdown = { ...riskBreakdown };
    const oldTier = riskTier;
    const events: AuditEntry[] = [];

    const [ml, llm] = await Promise.all([
      mlService.getObservabilityData(),
      llmService.getMetrics(),
    ]);

    setMLData(ml);
    setLLMData(llm);
    
    const { risk, breakdown } = calculateRisk(ml, llm);
    const biasLevel = ml.bias.length > 0 ? ml.bias.reduce((sum, b) => sum + b.biasScore, 0) / ml.bias.length : 0;
    setCompositeRisk(risk);
    setRiskBreakdown(breakdown);
    const tier = getRiskTier(risk, llm.piiDetected, biasLevel);
    setRiskTier(tier);
    setSystemStatus('normal');
    setDriftVolatility(0);
    setBiasVariance(0);
    setLatencyTrend(0);
    setLatencyInstability(0);
    setSystemStabilityScore(0);
    setMetricConfidence(1);
    setComplianceFlag(false);
    setRiskHistory([risk]);

    setRiskUpdate({
      oldRisk,
      newRisk: risk,
      oldBreakdown,
      newBreakdown: breakdown,
      oldTier,
      newTier: tier,
      timestamp: Date.now(),
    });
    setTimeout(() => setRiskUpdate(null), 6000);

    events.push(addAuditEntry('System Reset Initiated', 'success'));
    events.push(addAuditEntry('Metrics Normalized', 'success'));
    events.push(addAuditEntry('Risk Tier Reset', 'success'));

    createIncident('System Reset', oldRisk, events, 'Manual Reset');
    showAlert('SYSTEM RESET COMPLETE');
  };

  const driftLevel = mlData?.drift[mlData.drift.length - 1]?.driftScore || 0;
  const biasLevel = (mlData?.bias && mlData.bias.length > 0) ? mlData.bias.reduce((sum, b) => sum + b.biasScore, 0) / mlData.bias.length : 0;
  const tokenRate = llmData ? Math.round(llmData.tokenUsage / 60) : 0;

  return (
    <SystemContext.Provider
      value={{
        compositeRisk,
        riskTier,
        riskBreakdown,
        driftLevel,
        driftVolatility,
        biasLevel,
        biasVariance,
        piiDetected: llmData?.piiDetected || false,
        latency: llmData?.latency || 0,
        latencyTrend,
        tokenRate,
        auditLogs,
        incidents,
        systemStatus,
        mlData,
        llmData,
        alertMessage,
        riskHistory,
        riskUpdate,
        systemStabilityScore,
        metricConfidence,
        complianceFlag,
        latencyInstability,
        triggerDriftSpike,
        triggerPIIBreach,
        triggerBiasEscalation,
        triggerLatencySurge,
        resetSystem,
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
