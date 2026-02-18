export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AuditStatus = 'success' | 'failure' | 'pending';

export interface GovernanceRisk {
  compositeScore: number;
  riskLevel: RiskLevel;
  lastUpdated: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  hash: string;
  status: AuditStatus;
}

export interface AuditLog {
  entries: AuditEntry[];
  totalCount: number;
}
