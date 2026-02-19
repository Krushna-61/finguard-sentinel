'use client';

import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import DriftChart from '@/components/DriftChart';
import BiasChart from '@/components/BiasChart';
import { useSystem } from '@/contexts/SystemContext';
import styles from './monitoring.module.css';

export default function MonitoringPage() {
  const { 
    currentInference,
    driftHistory,
    biasHistory,
    isConnected,
    error,
  } = useSystem();

  // Extract values from currentInference - NO DEFAULTS
  const driftScore = currentInference?.drift_score ?? null;
  const biasScore = currentInference?.bias_score ?? null;
  const toxicityScore = currentInference?.toxicity_score ?? null;
  const hallucinationScore = currentInference?.hallucination_score ?? null;
  const latencyMs = currentInference?.latency_ms ?? null;
  const tokenUsage = currentInference?.token_usage ?? null;
  const piiDetected = currentInference?.pii_detected ?? false;
  const riskTier = currentInference?.tier ?? null;

  const getBorderColor = () => {
    if (!riskTier) return '#1A1A1A';
    if (riskTier === 'CRITICAL') return '#EF4444';
    if (riskTier === 'HIGH' || riskTier === 'ELEVATED') return '#F59E0B';
    return '#1A1A1A';
  };

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
      <div className={styles.monitoringGrid}>
        {/* Drift Chart */}
        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
        }}
        className={styles.monitoringFullWidth}
        >
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
            MODEL DRIFT TREND
          </div>
          <div style={{ height: '200px' }}>
            {driftHistory.length > 0 ? (
              <DriftChart data={driftHistory} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666666', fontSize: '12px' }}>
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Bias Chart */}
        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
        }}
        className={styles.monitoringFullWidth}
        >
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
            BIAS ANALYSIS
          </div>
          <div style={{ height: '200px' }}>
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
          border: `1px solid ${getBorderColor()}`,
          borderRadius: '0px',
          padding: '12px',
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
          <div style={{ fontSize: '48px', fontWeight: 700, color: driftScore !== null && driftScore > 0.5 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
            {driftScore !== null ? driftScore.toFixed(3) : '--'}
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '8px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
            {driftScore !== null && driftScore > 0.5 ? 'HIGH DRIFT DETECTED' : driftScore !== null ? 'WITHIN NORMAL RANGE' : 'NO DATA'}
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
            marginBottom: '8px',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            borderTop: '1px solid #1A1A1A',
            paddingTop: '6px',
          }}>
            BIAS SCORE
          </div>
          <div style={{ fontSize: '48px', fontWeight: 700, color: biasScore !== null && biasScore > 0.5 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
            {biasScore !== null ? biasScore.toFixed(3) : '--'}
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '8px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
            {biasScore !== null && biasScore > 0.5 ? 'HIGH BIAS DETECTED' : biasScore !== null ? 'WITHIN NORMAL RANGE' : 'NO DATA'}
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
              <div style={{ fontSize: '24px', fontWeight: 700, color: latencyMs !== null && latencyMs > 1000 ? '#EF4444' : '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {latencyMs !== null ? Math.round(latencyMs) : '--'}<span style={{ fontSize: '14px', color: '#666666' }}>ms</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOKEN USAGE</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {tokenUsage !== null ? tokenUsage : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>HALLUCINATION SCORE</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: hallucinationScore !== null && hallucinationScore > 50 ? '#F59E0B' : '#22C55E',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
              }}>
                {hallucinationScore !== null ? Math.round(hallucinationScore) : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>TOXICITY SCORE</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: toxicityScore !== null && toxicityScore > 50 ? '#EF4444' : '#22C55E',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace'
              }}>
                {toxicityScore !== null ? Math.round(toxicityScore) : '--'}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: `1px solid ${piiDetected ? '#EF4444' : '#1A1A1A'}`,
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
            PII DETECTION STATUS
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 700, 
            color: piiDetected ? '#EF4444' : '#22C55E', 
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
          }}>
            {piiDetected ? 'DETECTED' : 'CLEAR'}
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '8px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
            {piiDetected ? 'REGULATORY INCIDENT ACTIVE' : 'NO PII EXPOSURE'}
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
            SYSTEM TIER
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 700, 
            color: riskTier === 'CRITICAL' ? '#EF4444' : riskTier === 'HIGH' || riskTier === 'ELEVATED' ? '#F59E0B' : riskTier ? '#22C55E' : '#666666', 
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' 
          }}>
            {riskTier || 'NO DATA'}
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '12px',
        }}
        className={styles.monitoringFullWidth}
        >
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
            CURRENT METRICS SUMMARY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>DRIFT</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: driftScore !== null && driftScore > 0.5 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {driftScore !== null ? driftScore.toFixed(3) : '--'}
              </div>
            </div>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>BIAS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: biasScore !== null && biasScore > 0.5 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {biasScore !== null ? biasScore.toFixed(3) : '--'}
              </div>
            </div>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>LATENCY</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: latencyMs !== null && latencyMs > 1000 ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {latencyMs !== null ? Math.round(latencyMs) : '--'}ms
              </div>
            </div>
            <div style={{ background: '#000000', padding: '12px', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: '9px', color: '#666666', marginBottom: '4px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>PII STATUS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: piiDetected ? '#EF4444' : '#22C55E', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                {piiDetected ? 'DETECTED' : 'CLEAR'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
