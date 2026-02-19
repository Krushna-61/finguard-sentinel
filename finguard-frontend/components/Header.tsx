'use client';

import { useState, useEffect } from 'react';
import { useSystem } from '@/contexts/SystemContext';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [uptime, setUptime] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { 
    currentInference,
    isConnected,
    error,
  } = useSystem();
  
  const riskTier = currentInference?.tier || 'STABLE';
  const piiDetected = currentInference?.pii_detected || false;

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
        <div 
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '2px',
            background: '#EF4444',
            zIndex: 11,
            animation: riskTier === 'CRITICAL' ? 'flash 1s ease-in-out infinite' : 'none',
          }}
          className={styles.responsiveIndicator}
        />
      )}

      <div 
        style={{
          height: '56px',
          background: getHeaderBg(),
          borderBottom: `1px solid ${riskTier === 'ELEVATED' ? '#F59E0B' : '#1A1A1A'}`,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          zIndex: 10,
        }}
        className={styles.responsiveHeader}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            className={styles.responsiveTitle}
            >
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
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              className={styles.responsiveSubtitle}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div style={{
            fontSize: '8px',
            color: isConnected ? '#22C55E' : '#EF4444',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            padding: '2px 6px',
            border: `1px solid ${isConnected ? '#22C55E' : '#EF4444'}`,
            background: '#000000',
            whiteSpace: 'nowrap',
          }}
          className={styles.hideMobile}
          >
            {isConnected ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}
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
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className={styles.hideMobile}>
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

      {piiDetected && (
        <div style={{
          position: 'fixed',
          top: '56px',
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
        }}
        className={styles.responsiveCompliance}
        >
          PII DETECTED — REGULATORY INCIDENT ACTIVE
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: piiDetected ? '88px' : '56px',
          right: 0,
          background: '#F59E0B',
          color: '#000000',
          padding: '8px 12px',
          fontSize: '10px',
          fontWeight: 700,
          textAlign: 'center',
          zIndex: 9,
          fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
        }}
        className={styles.responsiveAlert}
        >
          {error}
        </div>
      )}
    </>
  );
};

export default Header;
