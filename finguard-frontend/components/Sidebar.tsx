'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSystem } from '@/contexts/SystemContext';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { riskTier } = useSystem();

  const isActive = (path: string) => pathname === path;

  return (
    <div style={{
      width: '220px',
      height: '100vh',
      background: '#000000',
      borderRight: riskTier === 'CRITICAL' ? '1px solid #EF4444' : '1px solid #1A1A1A',
      padding: '12px 8px',
      position: 'fixed',
      left: 0,
      top: 0,
    }}>
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
        <Link href="/dashboard" style={{
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
        }}>
          DASHBOARD
        </Link>
        <Link href="/monitoring" style={{
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
        }}>
          MONITORING
        </Link>
        <Link href="/audit" style={{
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
        }}>
          AUDIT LOGS
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
