'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSystem } from '@/contexts/SystemContext';
import { useState } from 'react';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentInference } = useSystem();
  const [isOpen, setIsOpen] = useState(false);
  
  const riskTier = currentInference?.tier || 'STABLE';

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.mobileButton}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={styles.overlay}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          borderRight: riskTier === 'CRITICAL' ? '1px solid #EF4444' : '1px solid #1A1A1A',
        }}
        className={`${styles.sidebar} ${isOpen ? '' : styles.sidebarHidden}`}
      >
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: '20px',
          paddingLeft: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
        }}>
          FINGUARD
        </div>
        <nav>
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'block',
              padding: '8px 10px',
              fontSize: '10px',
              color: isActive('/dashboard') ? '#FFFFFF' : '#666666',
              textDecoration: 'none',
              borderRadius: '0px',
              background: isActive('/dashboard') ? '#1A1A1A' : 'transparent',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}
          >
            DASHBOARD
          </Link>
          <Link
            href="/monitoring"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'block',
              padding: '8px 10px',
              fontSize: '10px',
              color: isActive('/monitoring') ? '#FFFFFF' : '#666666',
              textDecoration: 'none',
              borderRadius: '0px',
              background: isActive('/monitoring') ? '#1A1A1A' : 'transparent',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}
          >
            MONITORING
          </Link>
          <Link
            href="/audit"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'block',
              padding: '8px 10px',
              fontSize: '10px',
              color: isActive('/audit') ? '#FFFFFF' : '#666666',
              textDecoration: 'none',
              borderRadius: '0px',
              background: isActive('/audit') ? '#1A1A1A' : 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            }}
          >
            AUDIT LOGS
          </Link>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
