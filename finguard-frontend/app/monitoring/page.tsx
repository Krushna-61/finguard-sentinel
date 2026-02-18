'use client';

import Layout from '@/components/Layout';
import DriftChart from '@/components/DriftChart';
import BiasChart from '@/components/BiasChart';
import { useSystem } from '@/contexts/SystemContext';

export default function MonitoringPage() {
  const { 
    mlData, 
    llmData, 
    driftLevel, 
    biasLevel, 
    driftVolatility, 
    biasVariance, 
    latencyTrend, 
    systemStatus,
    systemStabilityScore,
    metricConfidence,
    latencyInstability,
  } = useSystem();

  const getBorderColor = () => {
    if (systemStatus === 'critical') return '#EF4444';
    if (systemStatus === 'warning') return '#F59E0B';
    return '#1A1A1A';
  };

  const getLatencyStability = () => {
    const absChange = Math.abs(latencyInstability);
    if (absChange > 200) return { label: 'Unstable', color: '#EF4444' };
    if (absChange > 100) return { label: 'Fluctuating', color: '#F59E0B' };
    return { label: 'Stable', color: '#22C55E' };
  };

  const getDriftVolatilityTrend = () => {
    if (driftVolatility > 0.05) return { arrow: '↑', color: '#EF4444', delta: '+' + (driftVolatility * 100).toFixed(1) + '%' };
    if (driftVolatility > 0.02) return { arrow: '↗', color: '#F59E0B', delta: '+' + (driftVolatility * 100).toFixed(1) + '%' };
    return { arrow: '→', color: '#22C55E', delta: (driftVolatility * 100).toFixed(1) + '%' };
  };

  const getBiasVarianceDelta = () => {
    if (biasVariance > 0.05) return { arrow: '↑', color: '#EF4444', delta: '+' + (biasVariance * 100).toFixed(1) + '%' };
    if (biasVariance > 0.02) return { arrow: '↗', color: '#F59E0B', delta: '+' + (biasVariance * 100).toFixed(1) + '%' };
    return { arrow: '→', color: '#22C55E', delta: (biasVariance * 100).toFixed(1) + '%' };
  };

  const latencyStability = getLatencyStability();

  return (
    <Layout>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        height: 'calc(100vh - 56px)',
        overflow: 'auto',
      }}>
        <div style={{
          background: '#0A0A0A',
          border: `1px solid ${getBorderColor()}`,
          borderRadius: '0px',
          padding: '12px',
          height: '400px',
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
            MODEL DRIFT MONITORING
          </div>
          <div style={{ height: 'calc(100% - 24px)' }}>
            <DriftChart data={mlData?.drift || []} />
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
          height: '400px',
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
            BIAS DISTRIBUTION
          </div>
          <div style={{ height: 'calc(100% - 24px)' }}>
            <BiasChart data={mlData?.bias || []} />
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            borderTop: '1px solid #1A1A1A',
            paddingTop: '6px',
          }}>
            ML PERFORMANCE METRICS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>ACCURACY</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {(mlData?.metrics.accuracy || 0).toFixed(4)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>PRECISION</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {(mlData?.metrics.precision || 0).toFixed(4)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>RECALL</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {(mlData?.metrics.recall || 0).toFixed(4)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>F1 SCORE</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {(mlData?.metrics.f1Score || 0).toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            borderTop: '1px solid #1A1A1A',
            paddingTop: '6px',
          }}>
            LLM PERFORMANCE METRICS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>LATENCY</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {Math.round(llmData?.latency || 0)}<span style={{ fontSize: '14px', color: '#666666' }}>ms</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOKEN USAGE</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {llmData?.tokenUsage || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>HALLUCINATION SCORE</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: (llmData?.hallucinationScore || 0) > 50 ? '#F59E0B' : '#22C55E',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
              }}>
                {llmData?.hallucinationScore || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOXICITY SCORE</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: (llmData?.toxicityScore || 0) > 50 ? '#EF4444' : '#22C55E',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
              }}>
                {llmData?.toxicityScore || 0}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: `1px solid ${systemStabilityScore > 0.6 ? '#F59E0B' : '#1A1A1A'}`,
          borderRadius: '0px',
          padding: '12px',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            borderTop: '1px solid #1A1A1A',
            paddingTop: '6px',
          }}>
            SYSTEM STABILITY ENGINE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>STABILITY SCORE</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 700, 
                color: systemStabilityScore > 0.6 ? '#EF4444' : systemStabilityScore > 0.4 ? '#F59E0B' : '#22C55E', 
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
              }}>
                {(systemStabilityScore * 100).toFixed(1)}
              </div>
              <div style={{ fontSize: '8px', color: '#666666', marginTop: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {systemStabilityScore > 0.6 ? 'DEGRADATION ACTIVE' : systemStabilityScore > 0.4 ? 'MONITORING' : 'RECOVERY MODE'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>METRIC CONFIDENCE</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: metricConfidence < 0.5 ? '#EF4444' : metricConfidence < 0.7 ? '#F59E0B' : '#22C55E', 
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
              }}>
                {(metricConfidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            borderTop: '1px solid #1A1A1A',
            paddingTop: '6px',
          }}>
            VOLATILITY ANALYSIS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>DRIFT VOLATILITY TREND</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 700, 
                  color: getDriftVolatilityTrend().color, 
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
                }}>
                  {getDriftVolatilityTrend().arrow}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: getDriftVolatilityTrend().color, fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                    {getDriftVolatilityTrend().delta}
                  </div>
                  <div style={{ fontSize: '8px', color: '#666666', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                    VOLATILITY CHANGE
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>BIAS VARIANCE DELTA</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 700, 
                  color: getBiasVarianceDelta().color, 
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
                }}>
                  {getBiasVarianceDelta().arrow}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: getBiasVarianceDelta().color, fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                    {getBiasVarianceDelta().delta}
                  </div>
                  <div style={{ fontSize: '8px', color: '#666666', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                    VARIANCE CHANGE
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>LATENCY INSTABILITY INDEX</div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 700, 
                color: latencyInstability > 200 ? '#EF4444' : latencyInstability > 100 ? '#F59E0B' : '#22C55E', 
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
              }}>
                {latencyInstability.toFixed(1)}
              </div>
              <div style={{ fontSize: '8px', color: '#666666', marginTop: '2px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {latencyInstability > 200 ? 'UNSTABLE' : latencyInstability > 100 ? 'FLUCTUATING' : 'STABLE'}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
          gridColumn: 'span 2',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            borderTop: '1px solid #1A1A1A',
            paddingTop: '6px',
          }}>
            HEALTH MATRIX
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>DRIFT VOLATILITY</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: driftVolatility > 0.02 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {(driftVolatility * 100).toFixed(3)}%
                <span style={{ fontSize: '12px', marginLeft: '4px' }}>
                  {driftVolatility > 0.02 ? '↑' : '→'}
                </span>
              </div>
              <div style={{ fontSize: '8px', color: '#666666', marginTop: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                CURRENT: {(driftLevel * 100).toFixed(2)}%
              </div>
            </div>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>BIAS VARIANCE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: biasVariance > 0.05 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {(biasVariance * 100).toFixed(3)}%
                <span style={{ fontSize: '12px', marginLeft: '4px' }}>
                  {biasVariance > 0.05 ? '↑' : '→'}
                </span>
              </div>
              <div style={{ fontSize: '8px', color: '#666666', marginTop: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                CURRENT: {(biasLevel * 100).toFixed(2)}%
              </div>
            </div>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>LATENCY STABILITY</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: latencyStability.color, fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {latencyStability.label}
              </div>
              <div style={{ fontSize: '8px', color: '#666666', marginTop: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                DELTA: {latencyTrend > 0 ? '+' : ''}{latencyTrend.toFixed(1)}ms
              </div>
              <div style={{ fontSize: '8px', color: '#666666', marginTop: '2px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                CURRENT: {Math.round(llmData?.latency || 0)}ms
              </div>
            </div>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>PII STATUS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: llmData?.piiDetected ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {llmData?.piiDetected ? 'DETECTED' : 'CLEAR'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
