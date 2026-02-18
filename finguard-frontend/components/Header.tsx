'use client';

import { useState, useEffect } from 'react';
import { useSystem } from '@/contexts/SystemContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [uptime, setUptime] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { 
    riskTier,
    alertMessage,
    complianceFlag,
    triggerDriftSpike,
    triggerPIIBreach,
    triggerBiasEscalation,
    triggerLatencySurge,
    resetSystem 
  } = useSystem();

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toISOString().substring(11, 19));

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toISOString().substring(11, 19));
    }, 1000);

    const uptimeInterval = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (riskTier === 'CRITICAL') return '#EF4444';
    if (riskTier === 'HIGH') return '#EF4444';
    if (riskTier === 'ELEVATED') return '#F59E0B';
    return '#22C55E';
  };

  const getHeaderBg = () => {
    if (riskTier === 'CRITICAL') return 'linear-gradient(to right, #EF4444 0%, #000000 100%)';
    return '#000000';
  };

  const getPulseSpeed = () => {
    if (riskTier === 'CRITICAL') return '0.5s';
    if (riskTier === 'HIGH') return '1s';
    return '2s';
  };

  return (
    <>
      {(riskTier === 'HIGH' || riskTier === 'CRITICAL') && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '220px',
          right: 0,
          height: '2px',
          background: '#EF4444',
          zIndex: 11,
          animation: riskTier === 'CRITICAL' ? 'flash 1s ease-in-out infinite' : 'none',
        }}>
          <style jsx>{`
            @keyframes flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `}</style>
        </div>
      )}

      <div style={{
        height: '56px',
        background: getHeaderBg(),
        borderBottom: `1px solid ${riskTier === 'ELEVATED' ? '#F59E0B' : '#1A1A1A'}`,
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: '220px',
        right: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h1 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                fontSize: '9px',
                color: '#666666',
                margin: '2px 0 0 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{
            fontSize: '8px',
            color: '#666666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            padding: '2px 6px',
            border: '1px solid #1A1A1A',
            background: '#000000',
          }}>
            SIMULATION MODE ACTIVE
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            background: '#0A0A0A',
            border: '1px solid #1A1A1A',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: getStatusColor(),
              animation: `pulse ${getPulseSpeed()} ease-in-out infinite`,
            }} />
            <span style={{
              fontSize: '9px',
              color: getStatusColor(),
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}>
              {riskTier}
            </span>
            <style jsx>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={triggerDriftSpike}
              style={{
                background: '#0A0A0A',
                border: '1px solid #1A1A1A',
                color: '#F59E0B',
                padding: '4px 8px',
                fontSize: '8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}
            >
              DRIFT
            </button>
            <button
              onClick={triggerPIIBreach}
              style={{
                background: '#0A0A0A',
                border: '1px solid #1A1A1A',
                color: '#EF4444',
                padding: '4px 8px',
                fontSize: '8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}
            >
              PII
            </button>
            <button
              onClick={triggerBiasEscalation}
              style={{
                background: '#0A0A0A',
                border: '1px solid #1A1A1A',
                color: '#F59E0B',
                padding: '4px 8px',
                fontSize: '8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}
            >
              BIAS
            </button>
            <button
              onClick={triggerLatencySurge}
              style={{
                background: '#0A0A0A',
                border: '1px solid #1A1A1A',
                color: '#F59E0B',
                padding: '4px 8px',
                fontSize: '8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}
            >
              LATENCY
            </button>
            <button
              onClick={resetSystem}
              style={{
                background: '#0A0A0A',
                border: '1px solid #1A1A1A',
                color: '#22C55E',
                padding: '4px 8px',
                fontSize: '8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}
            >
              RESET
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '9px',
            color: '#666666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
          }}>
            {mounted && (
              <>
                <div>UTC {currentTime}</div>
                <div>UPTIME {formatUptime(uptime)}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {alertMessage && (
        <div style={{
          position: 'fixed',
          top: '56px',
          left: '220px',
          right: 0,
          background: riskTier === 'CRITICAL' ? '#EF4444' : '#F59E0B',
          color: '#000000',
          padding: '8px 12px',
          fontSize: '10px',
          fontWeight: 700,
          textAlign: 'center',
          zIndex: 9,
          fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
          animation: 'slideDown 0.3s ease-out',
        }}>
          {alertMessage}
          <style jsx>{`
            @keyframes slideDown {
              from { transform: translateY(-100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {complianceFlag && (
        <div style={{
          position: 'fixed',
          top: alertMessage ? '88px' : '56px',
          left: '220px',
          right: 0,
          background: '#EF4444',
          color: '#FFFFFF',
          padding: '6px 12px',
          fontSize: '9px',
          fontWeight: 700,
          textAlign: 'center',
          zIndex: 9,
          fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
          border: '1px solid #DC2626',
          borderTop: 'none',
        }}>
          REGULATORY INCIDENT ACTIVE — PII EXPOSURE DETECTED
        </div>
      )}
    </>
  );
};

export default Header;
