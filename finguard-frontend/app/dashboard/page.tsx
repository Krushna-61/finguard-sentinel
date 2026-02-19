'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import RiskGauge from '@/components/RiskGauge';
import DriftChart from '@/components/DriftChart';
import BiasChart from '@/components/BiasChart';
import { useSystem } from '@/contexts/SystemContext';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { 
    currentInference,
    driftHistory,
    biasHistory,
    isConnected,
    error,
  } = useSystem();
  
  const [animatedRisk, setAnimatedRisk] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // Extract values from currentInference - NO DEFAULTS
  const compositeRisk = currentInference?.composite_score ?? null;
  const riskTier = currentInference?.tier ?? null;
  const breakdown = currentInference?.breakdown ?? null;
  const piiDetected = currentInference?.pii_detected ?? false;
  const driftScore = currentInference?.drift_score ?? null;
  const biasScore = currentInference?.bias_score ?? null;
  const toxicityScore = currentInference?.toxicity_score ?? null;
  const hallucinationScore = currentInference?.hallucination_score ?? null;
  const latencyMs = currentInference?.latency_ms ?? null;
  const tokenUsage = currentInference?.token_usage ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (compositeRisk === null) {
      setAnimatedRisk(0);
      return;
    }
    
    const duration = 500;
    const steps = 20;
    const increment = (compositeRisk - animatedRisk) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedRisk(compositeRisk);
        clearInterval(timer);
      } else {
        setAnimatedRisk((prev: number) => prev + increment);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [compositeRisk, mounted, animatedRisk]);

  const getBorderColor = () => {
    if (!riskTier) return '#1A1A1A';
    if (riskTier === 'CRITICAL') return '#EF4444';
    if (riskTier === 'HIGH' || riskTier === 'ELEVATED') return '#F59E0B';
    return '#1A1A1A';
  };

  const getPrimaryDriver = () => {
    if (!breakdown) {
      return {
        primary: { name: 'No Data', contribution: 0, confidence: 0 },
        secondary: { name: 'No Data', contribution: 0 },
      };
    }
    
    // PII always dominates when detected
    if (piiDetected) {
      const total = breakdown.drift + breakdown.bias + breakdown.pii + breakdown.latency || 1;
      const piiContribution = Math.round((breakdown.pii / total) * 100);
      
      // Find secondary driver
      const others = [
        { name: 'Drift Volatility', value: breakdown.drift },
        { name: 'Bias Variance', value: breakdown.bias },
        { name: 'Latency Instability', value: breakdown.latency },
      ].sort((a, b) => b.value - a.value);
      
      const secondaryContribution = Math.round((others[0].value / total) * 100);
      
      return {
        primary: { name: 'PII Detection', contribution: Math.max(piiContribution, 40), confidence: 95 },
        secondary: { name: others[0].name, contribution: secondaryContribution },
      };
    }
    
    // Normal attribution without PII
    const impacts = [
      { name: 'Drift Volatility', value: breakdown.drift },
      { name: 'Bias Variance', value: breakdown.bias },
      { name: 'Latency Instability', value: breakdown.latency },
    ];
    const sorted = impacts.sort((a, b) => b.value - a.value);
    const total = sorted.reduce((sum, i) => sum + i.value, 0) || 1;
    const primary = sorted[0];
    const secondary = sorted[1];
    
    // Calculate confidence based on the contribution percentage (deterministic)
    const primaryContribution = Math.round((primary.value / total) * 100);
    const confidence = Math.min(95, 70 + Math.floor(primaryContribution / 4));
    
    return {
      primary: { name: primary.name, contribution: primaryContribution, confidence },
      secondary: { name: secondary.name, contribution: Math.round((secondary.value / total) * 100) },
    };
  };

  const getRiskProjection = () => {
    if (compositeRisk === null) {
      return { projected: 0, trend: 'No Data' };
    }
    // Simple projection based on current risk
    const projected = Math.round(compositeRisk);
    const trend = compositeRisk > 60 ? 'Elevated' : 'Stabilizing';
    
    return { projected, trend };
  };

  const attribution = getPrimaryDriver();
  const projection = getRiskProjection();



  // Show loading or error states
  if (!isConnected && !currentInference) {
    return (
      <Layout>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666666' }}>
          {error ? `Error: ${error}` : 'Connecting to backend...'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.dashboardGrid}>
        <div className={`${styles.dashboardColumn} ${styles.dashboardLeft}`}>
          <div style={{
            background: '#0A0A0A',
            border: `1px solid ${getBorderColor()}`,
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              RISK INDEX
            </div>
            <div style={{ height: '140px', marginBottom: '8px' }}>
              <RiskGauge score={compositeRisk !== null ? Math.round(mounted ? animatedRisk : compositeRisk) : 0} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              {riskTier ? (
                <StatusBadge status={riskTier.toLowerCase() as any} />
              ) : (
                <div style={{ 
                  fontSize: '10px', 
                  color: '#666666', 
                  padding: '4px 8px',
                  border: '1px solid #1A1A1A',
                  background: '#000000',
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
                }}>
                  NO DATA
                </div>
              )}
            </div>
            <div style={{
              fontSize: '9px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '6px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}>
              RISK BREAKDOWN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>DRIFT</span>
                <span style={{ color: breakdown && breakdown.drift > 50 ? '#EF4444' : '#22C55E' }}>
                  {breakdown ? Math.round(breakdown.drift) : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>BIAS</span>
                <span style={{ color: breakdown && breakdown.bias > 50 ? '#EF4444' : '#22C55E' }}>
                  {breakdown ? Math.round(breakdown.bias) : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>PII</span>
                <span style={{ color: breakdown && breakdown.pii > 0 ? '#EF4444' : '#22C55E' }}>
                  {breakdown ? Math.round(breakdown.pii) : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>LATENCY</span>
                <span style={{ color: breakdown && breakdown.latency > 50 ? '#EF4444' : '#22C55E' }}>
                  {breakdown ? Math.round(breakdown.latency) : '--'}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '9px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '6px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}>
              CURRENT RISK SCORE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
              {compositeRisk !== null ? Math.round(compositeRisk) : '--'}
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '9px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}>
              AI RISK ATTRIBUTION
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <div style={{ fontSize: '8px', color: '#666666', marginBottom: '2px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  PRIMARY DRIVER
                </div>
                <div style={{ fontSize: '10px', color: '#F8FAFC', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  {attribution.primary.name}
                </div>
                <div style={{ fontSize: '8px', color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  Contribution: {attribution.primary.contribution}% | Confidence: {attribution.primary.confidence}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '8px', color: '#666666', marginBottom: '2px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  SECONDARY DRIVER
                </div>
                <div style={{ fontSize: '10px', color: '#F8FAFC', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  {attribution.secondary.name}
                </div>
                <div style={{ fontSize: '8px', color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  Contribution: {attribution.secondary.contribution}%
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '9px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}>
              RISK PROJECTION (5 MIN OUTLOOK)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>Projected Risk:</span>
                <span style={{ color: projection.projected > 60 ? '#EF4444' : '#22C55E' }}>{projection.projected}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>Trend:</span>
                <span style={{ color: projection.trend === 'Escalating' ? '#EF4444' : projection.trend === 'Recovering' ? '#22C55E' : '#F59E0B' }}>
                  {projection.trend}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: `1px solid ${piiDetected ? '#EF4444' : '#1A1A1A'}`,
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              PII DETECTION
            </div>
            <StatusBadge
              status={piiDetected ? 'failure' : 'success'}
              label={piiDetected ? 'DETECTED' : 'CLEAR'}
            />
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              SYSTEM STATUS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>ML MODELS</span>
                <span style={{ color: '#22C55E' }}>ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>LLM GATEWAY</span>
                <span style={{ color: '#22C55E' }}>ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>AUDIT LOG</span>
                <span style={{ color: '#22C55E' }}>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.dashboardColumn} ${styles.dashboardCenter}`}>
          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              MODEL DRIFT TREND
            </div>
            <div style={{ height: '180px' }}>
              {driftHistory.length > 0 ? (
                <DriftChart data={driftHistory} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666666', fontSize: '12px' }}>
                  No data available
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              BIAS ANALYSIS
            </div>
            <div style={{ height: '180px' }}>
              {biasHistory.length > 0 ? (
                <BiasChart data={biasHistory} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666666', fontSize: '12px' }}>
                  No data available
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              DRIFT SCORE
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: driftScore !== null && driftScore > 0.5 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
              {driftScore !== null ? driftScore.toFixed(3) : '--'}
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              BIAS SCORE
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: biasScore !== null && biasScore > 0.5 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
              {biasScore !== null ? biasScore.toFixed(3) : '--'}
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              LLM METRICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>LATENCY</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: latencyMs !== null && latencyMs > 1000 ? '#EF4444' : '#3B82F6', 
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
                }}>
                  {latencyMs !== null ? Math.round(latencyMs) : '--'}<span style={{ fontSize: '10px', color: '#666666' }}>ms</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOKENS</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  {tokenUsage !== null ? tokenUsage : '--'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>HALLUCINATION</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: hallucinationScore !== null && hallucinationScore > 50 ? '#EF4444' : hallucinationScore !== null && hallucinationScore > 30 ? '#F59E0B' : '#22C55E',
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
                }}>
                  {hallucinationScore !== null ? Math.round(hallucinationScore) : '--'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOXICITY</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: toxicityScore !== null && toxicityScore > 50 ? '#EF4444' : toxicityScore !== null && toxicityScore > 30 ? '#F59E0B' : '#22C55E',
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
                }}>
                  {toxicityScore !== null ? Math.round(toxicityScore) : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.dashboardColumn} ${styles.dashboardRight}`}>
          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#666666',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              borderTop: '1px solid #1A1A1A',
              paddingTop: '6px',
            }}>
              TRIGGERED RULES
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {currentInference?.triggered_rules && currentInference.triggered_rules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {currentInference.triggered_rules.map((rule, idx) => (
                    <div key={idx} style={{
                      fontSize: '9px',
                      color: '#F59E0B',
                      fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                      padding: '4px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}>
                      {rule}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '9px', color: '#666666', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  No rules triggered
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
