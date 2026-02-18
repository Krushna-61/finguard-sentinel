'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import { useSystem } from '@/contexts/SystemContext';
import { AuditStatus } from '@/types/governance';

export default function AuditPage() {
  const { auditLogs, incidents } = useSystem();
  const [filter, setFilter] = useState<AuditStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'incidents'>('table');

  const filteredLogs = filter === 'all' 
    ? auditLogs 
    : auditLogs.filter(log => log.status === filter);

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

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
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
          }}>
            AUDIT LOG FILTER
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            {viewMode === 'table' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    background: filter === 'all' ? '#1A1A1A' : '#0A0A0A',
                    border: '1px solid #1A1A1A',
                    color: filter === 'all' ? '#FFFFFF' : '#666666',
                    padding: '6px 12px',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}
                >
                  ALL
                </button>
                <button
                  onClick={() => setFilter('success')}
                  style={{
                    background: filter === 'success' ? '#1A1A1A' : '#0A0A0A',
                    border: '1px solid #1A1A1A',
                    color: filter === 'success' ? '#22C55E' : '#666666',
                    padding: '6px 12px',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}
                >
                  SUCCESS
                </button>
                <button
                  onClick={() => setFilter('failure')}
                  style={{
                    background: filter === 'failure' ? '#1A1A1A' : '#0A0A0A',
                    border: '1px solid #1A1A1A',
                    color: filter === 'failure' ? '#EF4444' : '#666666',
                    padding: '6px 12px',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}
                >
                  FAILURE
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  style={{
                    background: filter === 'pending' ? '#1A1A1A' : '#0A0A0A',
                    border: '1px solid #1A1A1A',
                    color: filter === 'pending' ? '#F59E0B' : '#666666',
                    padding: '6px 12px',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}
                >
                  PENDING
                </button>
              </div>
            )}
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
        }}>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            textTransform: 'uppercase',
            padding: '10px',
            letterSpacing: '0.5px',
            fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
            borderBottom: '1px solid #1A1A1A',
          }}>
            {viewMode === 'table' ? `AUDIT TRAIL — ${filteredLogs.length} ENTRIES` : `INCIDENT LOG — ${incidents.length} INCIDENTS`}
          </div>
          {viewMode === 'incidents' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  style={{
                    background: '#000000',
                    border: '1px solid #1A1A1A',
                    borderRadius: '0px',
                    padding: '12px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#EF4444',
                      textTransform: 'uppercase',
                      fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                    }}>
                      {incident.trigger}
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: '#666666',
                      fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                    }}>
                      {formatTimestamp(incident.timestamp)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '8px', color: '#666666', marginBottom: '2px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                        RISK BEFORE
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                        {incident.riskBefore}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#666666', marginBottom: '2px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                        RISK AFTER
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                        {incident.riskAfter}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#666666', marginBottom: '2px', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                        DELTA
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B', fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace' }}>
                        +{incident.riskAfter - incident.riskBefore}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#666666',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}>
                    RELATED EVENTS ({incident.events.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {incident.events.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 8px',
                          background: '#0A0A0A',
                          border: '1px solid #1A1A1A',
                        }}
                      >
                        <div style={{
                          fontSize: '9px',
                          color: '#F8FAFC',
                          fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                        }}>
                          {event.eventType}
                        </div>
                        <StatusBadge status={event.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: '#000000',
                zIndex: 1,
              }}>
                <tr>
                  <th style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#666666',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #1A1A1A',
                    letterSpacing: '0.5px',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}>
                    TIMESTAMP
                  </th>
                  <th style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#666666',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #1A1A1A',
                    letterSpacing: '0.5px',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}>
                    EVENT TYPE
                  </th>
                  <th style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#666666',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #1A1A1A',
                    letterSpacing: '0.5px',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}>
                    HASH
                  </th>
                  <th style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#666666',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #1A1A1A',
                    letterSpacing: '0.5px',
                    fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                  }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((entry, index) => (
                  <tr
                    key={entry.id}
                    style={{
                      background: index % 2 === 0 ? 'transparent' : '#050505',
                    }}
                  >
                    <td style={{
                      padding: '10px',
                      fontSize: '10px',
                      color: '#94A3B8',
                      borderBottom: '1px solid #1A1A1A',
                      fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                    }}>
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td style={{
                      padding: '10px',
                      fontSize: '10px',
                      color: '#F8FAFC',
                      borderBottom: '1px solid #1A1A1A',
                      fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                    }}>
                      {entry.eventType}
                    </td>
                    <td style={{
                      padding: '10px',
                      fontSize: '9px',
                      color: '#666666',
                      fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
                      borderBottom: '1px solid #1A1A1A',
                    }}>
                      {entry.hash.substring(0, 16)}...
                    </td>
                    <td style={{
                      padding: '10px',
                      borderBottom: '1px solid #1A1A1A',
                    }}>
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
