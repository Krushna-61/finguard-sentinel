'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#000000',
          color: '#F8FAFC',
          padding: '20px',
          fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              color: '#EF4444',
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '24px',
              marginBottom: '12px',
              color: '#F8FAFC',
            }}>
              System Error
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#94A3B8',
              marginBottom: '24px',
            }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontFamily: '"IBM Plex Mono", "Roboto Mono", monospace',
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
