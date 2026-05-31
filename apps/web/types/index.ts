/**
 * TypeScript interfaces for eToro Trading Bot
 * Ensures type safety across the application
 */

export interface Decision {
  id: string;
  timestamp: string;
  action: "BUY" | "SELL";
  symbol: string;
  recommendedAmount: number;
  aiConfidence: number;
  triggerRules: string[];
  dataSourcesUsed: string[];
  status: "pending" | "executed" | "rejected";
  reason: string;
  executedAmount?: number;
  executedAt?: string;
  tradeId?: string;
  rejectionReason?: string;
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  openedAt: string;
  lastUpdated: string;
}

export interface Trade {
  id: string;
  decisionId?: string;
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalValue: number;
  costBasis?: number; // For P&L tracking
  realizedPnL?: number; // Calculated for SELL trades
  executedAt: string;
  eToroTradeId?: string;
  auditTrailUrl?: string;
  source: "AI" | "MANUAL";
}

export interface KillSwitchResponse {
  success: boolean;
  message: string;
  positionsClosed?: number;
  cooldownEnd?: string;
  killSwitchId?: string;
}

export interface KillSwitchRecord {
  id: string;
  activatedAt: string;
  activatedBy: string;
  cooldownEnd: string;
  positionsClosed: number;
  status: "active" | "expired";
  reason?: string;
}

export interface AuditLog {
  id: string;
  eventType: string;
  performedBy: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ValidationError {
  error: string;
  details: string[];
}

export interface ApiError {
  error: string;
  message: string;
}
