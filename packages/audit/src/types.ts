/**
 * Type definitions for the audit log system
 */

export type EventType =
  | 'RULE_EVAL'
  | 'DECISION_MADE'
  | 'TRADE_EXECUTED'
  | 'CONFIG_CHANGED';

export interface DecisionLogEntry {
  id?: string; // UUID, auto-generated if not provided
  timestamp?: Date; // Auto-generated if not provided
  event_type: EventType;
  rule_id?: string;
  data_inputs: Record<string, unknown>; // Serialized input data
  ai_eval?: {
    model?: string;
    reasoning?: string;
    confidence?: number;
    sources?: string[];
    [key: string]: unknown;
  };
  decision: string; // e.g., 'APPROVED', 'REJECTED', 'DEFERRED', 'EXECUTED', etc.
  executed: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface DecisionLogRow extends DecisionLogEntry {
  id: string;
  timestamp: Date;
  signature: string;
}

export interface AuditLogQuery {
  event_type?: EventType;
  rule_id?: string;
  start_time?: Date;
  end_time?: Date;
  executed?: boolean;
  limit?: number;
  offset?: number;
}
