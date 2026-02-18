import React, { useEffect, useState } from 'react';

interface RiskBreakdown {
  driftImpact: number;
  biasImpact: number;
  piiImpact: number;
  latencyImpact: number;
}

interface RiskUpdatePanelProps {
  oldRisk: number;
  newRisk: number;
  oldBreakdown: RiskBreakdown;
  newBreakdown: RiskBreakdown;
  oldTier: string;
  newTier: string;
}

const RiskUpdatePanel: React.FC<RiskUpdatePanelProps> = ({
  oldRisk,
  newRisk,
  oldBreakdown,
  newBreakdown,
  oldTier,
  newTier,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const delta = newRisk - oldRisk;

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '12px',
      background: '#0A0A0A',
      border: '1px solid #EF4444',
      padding: '12px',
      zIndex: 100,
      minWidth: '280px',
      animation: 'slideIn 0.3s ease-out',
    }}>
      <div style={{
        fontSize: '9px',
        color: '#EF4444',
        textTransform: 'uppercase',
        marginBottom: '8px',
        letterSpacing: '0.5px',
        fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
        fontWeight: 700,
      }}>
        RISK UPDATED
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
          <span style={{ color: '#666666' }}>Drift Impact:</span>
          <span style={{ color: '#F8FAFC' }}>{oldBreakdown.driftImpact} → {newBreakdown.driftImpact}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
          <span style={{ color: '#666666' }}>Bias Impact:</span>
          <span style={{ color: '#F8FAFC' }}>{oldBreakdown.biasImpact} → {newBreakdown.biasImpact}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
          <span style={{ color: '#666666' }}>PII Impact:</span>
          <span style={{ color: '#F8FAFC' }}>{oldBreakdown.piiImpact} → {newBreakdown.piiImpact}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
          <span style={{ color: '#666666' }}>Latency Impact:</span>
          <span style={{ color: '#F8FAFC' }}>{oldBreakdown.latencyImpact} → {newBreakdown.latencyImpact}</span>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #1A1A1A',
        paddingTop: '8px',
        marginTop: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace', marginBottom: '6px' }}>
          <span style={{ color: '#666666' }}>Composite Risk:</span>
          <span style={{ color: delta > 0 ? '#EF4444' : '#22C55E', fontWeight: 700 }}>
            {oldRisk} → {newRisk} ({delta > 0 ? '+' : ''}{delta})
          </span>
        </div>
        
        {oldTier !== newTier && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
            <span style={{ color: '#666666' }}>Tier Changed:</span>
            <span style={{ color: '#F59E0B' }}>{oldTier} → {newTier}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default RiskUpdatePanel;
