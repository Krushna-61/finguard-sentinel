'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useSystem } from '@/contexts/SystemContext';
import styles from './audit.module.css';

export default function AuditPage() {
  const { isConnected, error } = useSystem();
  const [viewMode, setViewMode] = useState<'table' | 'incidents'>('table');

  // Show loading or error states
  if (!isConnected) {
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
      <div style={{
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
        className={styles.auditControls}
        >
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
          }}>
            AUDIT LOG
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? '#1A1A1A' : '#0A0A0A',
                  border: '1px solid #1A1A1A',
                  color: viewMode === 'table' ? '#FFFFFF' : '#666666',
                  padding: '6px 12px',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                }}
              >
                TABLE VIEW
              </button>
              <button
                onClick={() => setViewMode('incidents')}
                style={{
                  background: viewMode === 'incidents' ? '#1A1A1A' : '#0A0A0A',
                  border: '1px solid #1A1A1A',
                  color: viewMode === 'incidents' ? '#FFFFFF' : '#666666',
                  padding: '6px 12px',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                }}
              >
                INCIDENT VIEW
              </button>
            </div>
          </div>
        </div>

        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: '0px',
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: '12px',
            color: '#666666',
            textAlign: 'center',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
          }}>
            <div style={{ marginBottom: '8px' }}>AUDIT LOG ENDPOINT NOT AVAILABLE</div>
            <div style={{ fontSize: '10px' }}>
              Backend needs GET /api/governance/audit-logs endpoint
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


