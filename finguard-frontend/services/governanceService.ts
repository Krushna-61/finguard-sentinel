import apiClient from './apiClient';
import { GovernanceRisk, AuditLog, AuditEntry } from '@/types/governance';

const generateMockRiskData = (): GovernanceRisk => {
  const score = 15 + Math.floor(Math.random() * 50);
  let level: 'low' | 'medium' | 'high' | 'critical';
  
  if (score < 30) level = 'low';
  else if (score < 50) level = 'medium';
  else if (score < 70) level = 'high';
  else level = 'critical';

  return {
    compositeScore: score,
    riskLevel: level,
    lastUpdated: new Date().toISOString(),
  };
};

const generateMockAuditLogs = (): AuditLog => {
  const eventTypes = [
    'Model Deployment',
    'Policy Update',
    'Access Review',
    'Data Validation',
    'Compliance Check',
    'Risk Assessment',
    'Audit Scan',
    'Security Review',
  ];

  const statuses: Array<'success' | 'failure' | 'pending'> = ['success', 'success', 'success', 'success', 'failure', 'pending'];

  const entries: AuditEntry[] = Array.from({ length: 15 }, (_, i) => {
    const timestamp = new Date(Date.now() - i * 1800000).toISOString();
    const hash = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    return {
      id: `audit-${i + 1}`,
      timestamp,
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      hash,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });

  return {
    entries,
    totalCount: entries.length,
  };
};

export const governanceService = {
  async getRisk(): Promise<GovernanceRisk> {
    try {
      const response = await apiClient.get<GovernanceRisk>('/api/governance/risk');
      return response.data;
    } catch {
      return generateMockRiskData();
    }
  },

  async getAuditLogs(): Promise<AuditLog> {
    try {
      const response = await apiClient.get<AuditLog>('/api/governance/audit-logs');
      return response.data;
    } catch {
      return generateMockAuditLogs();
    }
  },
};
