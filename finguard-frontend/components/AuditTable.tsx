import React from 'react';
import StatusBadge from './StatusBadge';
import { AuditEntry } from '@/types/governance';

interface AuditTableProps {
  entries: AuditEntry[];
  maxHeight?: number;
}

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

const AuditTable: React.FC<AuditTableProps> = ({ entries, maxHeight = 400 }) => {
  return (
    <div style={{
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            background: '#0F172A',
            zIndex: 1,
          }}>
            <tr>
              <th style={{
                padding: '8px',
                textAlign: 'left',
                fontSize: '10px',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                borderBottom: '1px solid #1F2937',
                letterSpacing: '0.5px',
              }}>
                Time
              </th>
              <th style={{
                padding: '8px',
                textAlign: 'left',
                fontSize: '10px',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                borderBottom: '1px solid #1F2937',
                letterSpacing: '0.5px',
              }}>
                Event
              </th>
              <th style={{
                padding: '8px',
                textAlign: 'left',
                fontSize: '10px',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                borderBottom: '1px solid #1F2937',
                letterSpacing: '0.5px',
              }}>
                Hash
              </th>
              <th style={{
                padding: '8px',
                textAlign: 'left',
                fontSize: '10px',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                borderBottom: '1px solid #1F2937',
                letterSpacing: '0.5px',
              }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                style={{
                  background: index % 2 === 0 ? 'transparent' : '#0B1120',
                }}
              >
                <td style={{
                  padding: '8px',
                  fontSize: '11px',
                  color: '#94A3B8',
                  borderBottom: '1px solid #1F2937',
                }}>
                  {formatTimestamp(entry.timestamp)}
                </td>
                <td style={{
                  padding: '8px',
                  fontSize: '11px',
                  color: '#F8FAFC',
                  borderBottom: '1px solid #1F2937',
                }}>
                  {entry.eventType}
                </td>
                <td style={{
                  padding: '8px',
                  fontSize: '10px',
                  color: '#6B7280',
                  fontFamily: 'monospace',
                  borderBottom: '1px solid #1F2937',
                }}>
                  {entry.hash.substring(0, 12)}...
                </td>
                <td style={{
                  padding: '8px',
                  borderBottom: '1px solid #1F2937',
                }}>
                  <StatusBadge status={entry.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;
