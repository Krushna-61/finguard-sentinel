'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import RiskGauge from '@/components/RiskGauge';
import AuditTable from '@/components/AuditTable';
import DriftChart from '@/components/DriftChart';
import BiasChart from '@/components/BiasChart';
import RiskSparkline from '@/components/RiskSparkline';
import RiskUpdatePanel from '@/components/RiskUpdatePanel';
import { useSystem } from '@/contexts/SystemContext';

export default function DashboardPage() {
  const { 
    mlData, 
    llmData, 
    compositeRisk, 
    riskTier, 
    riskBreakdown, 
    auditLogs, 
    systemStatus, 
    riskHistory, 
    riskUpdate,
    systemStabilityScore,
    metricConfidence,
    complianceFlag,
  } = useSystem();
  const [animatedRisk, setAnimatedRisk] = useState(compositeRisk);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
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
        setAnimatedRisk(prev => prev + increment);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [compositeRisk, mounted]);

  const getBorderColor = () => {
    if (systemStatus === 'critical') return '#EF4444';
    if (systemStatus === 'warning') return '#F59E0B';
    return '#1A1A1A';
  };

  const getPrimaryDriver = () => {
    // PII always dominates when detected
    if (llmData?.piiDetected) {
      const total = riskBreakdown.driftImpact + riskBreakdown.biasImpact + riskBreakdown.piiImpact + riskBreakdown.latencyImpact || 1;
      const piiContribution = Math.round((riskBreakdown.piiImpact / total) * 100);
      
      // Find secondary driver
      const others = [
        { name: 'Drift Volatility', value: riskBreakdown.driftImpact },
        { name: 'Bias Variance', value: riskBreakdown.biasImpact },
        { name: 'Latency Instability', value: riskBreakdown.latencyImpact },
      ].sort((a, b) => b.value - a.value);
      
      const secondaryContribution = Math.round((others[0].value / total) * 100);
      
      return {
        primary: { name: 'PII Detection', contribution: Math.max(piiContribution, 40), confidence: 95 },
        secondary: { name: others[0].name, contribution: secondaryContribution },
      };
    }
    
    // Normal attribution without PII
    const impacts = [
      { name: 'Drift Volatility', value: riskBreakdown.driftImpact },
      { name: 'Bias Variance', value: riskBreakdown.biasImpact },
      { name: 'Latency Instability', value: riskBreakdown.latencyImpact },
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
    if (riskHistory.length < 3) return { projected: compositeRisk, trend: 'Stabilizing' };
    
    const recent = riskHistory.slice(-10);
    const slope = (recent[recent.length - 1] - recent[0]) / recent.length;
    const projected = Math.max(0, Math.min(100, Math.round(compositeRisk + slope * 5)));
    
    let trend = 'Stabilizing';
    if (slope > 2) trend = 'Escalating';
    else if (slope < -2) trend = 'Recovering';
    
    return { projected, trend };
  };

  const attribution = getPrimaryDriver();
  const projection = getRiskProjection();

  const getMetricColor = (value: number, threshold: number, goodColor: string, badColor: string) => {
    if (!mounted) return goodColor;
    if (compositeRisk >= 80) return '#F59E0B';
    return value < threshold ? badColor : goodColor;
  };

  const getLLMMetricColor = (value: number, threshold: number, goodColor: string, warnColor: string, badColor: string) => {
    if (!mounted) return goodColor;
    if (compositeRisk >= 80) return '#F59E0B';
    if (value > threshold + 20) return badColor;
    if (value > threshold) return warnColor;
    return goodColor;
  };

  return (
    <Layout>
      {riskUpdate && (
        <RiskUpdatePanel
          oldRisk={riskUpdate.oldRisk}
          newRisk={riskUpdate.newRisk}
          oldBreakdown={riskUpdate.oldBreakdown}
          newBreakdown={riskUpdate.newBreakdown}
          oldTier={riskUpdate.oldTier}
          newTier={riskUpdate.newTier}
        />
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '25% 50% 25%',
        gap: '8px',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
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
              <RiskGauge score={mounted ? Math.round(animatedRisk) : compositeRisk} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <StatusBadge status={riskTier.toLowerCase() as any} />
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
                <span style={{ color: riskBreakdown.driftImpact > 50 ? '#EF4444' : '#22C55E' }}>{riskBreakdown.driftImpact}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>BIAS</span>
                <span style={{ color: riskBreakdown.biasImpact > 50 ? '#EF4444' : '#22C55E' }}>{riskBreakdown.biasImpact}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>PII</span>
                <span style={{ color: riskBreakdown.piiImpact > 0 ? '#EF4444' : '#22C55E' }}>{riskBreakdown.piiImpact}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                <span style={{ color: '#666666' }}>LATENCY</span>
                <span style={{ color: riskBreakdown.latencyImpact > 50 ? '#EF4444' : '#22C55E' }}>{riskBreakdown.latencyImpact}</span>
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
              RISK TRAJECTORY — LAST 60s
            </div>
            <RiskSparkline data={riskHistory} />
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
            border: `1px solid ${llmData?.piiDetected ? '#EF4444' : '#1A1A1A'}`,
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
              status={llmData?.piiDetected ? 'failure' : 'success'}
              label={llmData?.piiDetected ? 'DETECTED' : 'CLEAR'}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
          <div style={{
            background: '#0A0A0A',
            border: `1px solid ${systemStatus === 'warning' || systemStatus === 'critical' ? '#EF4444' : '#1A1A1A'}`,
            borderRadius: '0px',
            padding: '10px',
            height: '260px',
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
            <div style={{ height: 'calc(100% - 24px)' }}>
              <DriftChart data={mlData?.drift || []} />
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
            borderRadius: '0px',
            padding: '10px',
            height: '200px',
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
            <div style={{ height: 'calc(100% - 24px)' }}>
              <BiasChart data={mlData?.bias || []} />
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: `1px solid ${mounted && compositeRisk >= 80 ? '#F59E0B' : '#1A1A1A'}`,
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>ML METRICS</span>
              {mounted && compositeRisk >= 80 && (
                <span style={{ fontSize: '8px', color: '#F59E0B' }}>UNDER GOVERNANCE STRESS</span>
              )}
            </div>
            {mounted && complianceFlag && (
              <div style={{
                fontSize: '8px',
                color: '#EF4444',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '4px 6px',
                marginBottom: '8px',
                border: '1px solid #EF4444',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}>
                REGULATORY INCIDENT ACTIVE
              </div>
            )}
            {mounted && (
              <div style={{ 
                fontSize: '8px', 
                color: '#666666', 
                marginBottom: '8px',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}>
                METRIC CONFIDENCE: {Math.round(metricConfidence * 100)}%
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>ACCURACY</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: getMetricColor(mlData?.metrics.accuracy || 0, 0.85, '#22C55E', '#EF4444'), 
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
                }}>
                  {(mlData?.metrics.accuracy || 0).toFixed(3)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>PRECISION</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: getMetricColor(mlData?.metrics.precision || 0, 0.85, '#3B82F6', '#EF4444'), 
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
                }}>
                  {(mlData?.metrics.precision || 0).toFixed(3)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>RECALL</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: getMetricColor(mlData?.metrics.recall || 0, 0.85, '#3B82F6', '#EF4444'), 
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
                }}>
                  {(mlData?.metrics.recall || 0).toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: '#0A0A0A',
            border: `1px solid ${mounted && compositeRisk >= 80 ? '#F59E0B' : '#1A1A1A'}`,
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>LLM METRICS</span>
              {mounted && compositeRisk >= 80 && (
                <span style={{ fontSize: '8px', color: '#F59E0B' }}>UNDER GOVERNANCE STRESS</span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>LATENCY</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: mounted && compositeRisk >= 80 ? '#F59E0B' : (llmData?.latency || 0) > 1000 ? '#EF4444' : '#3B82F6', 
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
                }}>
                  {Math.round(llmData?.latency || 0)}<span style={{ fontSize: '10px', color: '#666666' }}>ms</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOKENS</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                  {llmData?.tokenUsage || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>HALLUCINATION</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: getLLMMetricColor(llmData?.hallucinationScore || 0, 30, '#22C55E', '#F59E0B', '#EF4444'),
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
                }}>
                  {Math.round(llmData?.hallucinationScore || 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOXICITY</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: getLLMMetricColor(llmData?.toxicityScore || 0, 30, '#22C55E', '#F59E0B', '#EF4444'),
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
                }}>
                  {Math.round(llmData?.toxicityScore || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
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
              AUDIT TRAIL
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AuditTable entries={auditLogs.slice(0, 5)} maxHeight={9999} />
            </div>
            <div style={{
              fontSize: '8px',
              color: '#666666',
              textAlign: 'center',
              marginTop: '8px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}>
              LAST 5 ENTRIES — VIEW ALL IN AUDIT
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
