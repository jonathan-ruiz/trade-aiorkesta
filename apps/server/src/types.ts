/**
 * Orchestrator Types
 *
 * Central service types for coordinating trade execution
 */

import type {
  RiskConfig,
  TradeProposal,
  RiskCheckResult,
} from '../../../packages/risk-management/src/types';
import type { AuditEvent } from '../../../packages/audit/src/types';

/**
 * System state machine
 */
export enum SystemState {
  /** Stopped - not executing trades */
  STOPPED = 'STOPPED',
  /** Paper trading mode - simulated trades only */
  PAPER_TRADING = 'PAPER_TRADING',
  /** Live trading mode - real money */
  LIVE_TRADING = 'LIVE_TRADING',
  /** Error state - requires intervention */
  ERROR = 'ERROR',
}

/**
 * Trade signal from decision layer
 */
export interface TradeSignal {
  /** Signal ID */
  id: string;
  /** Symbol to trade */
  symbol: string;
  /** Trade direction */
  side: 'BUY' | 'SELL';
  /** Suggested trade size (base currency) */
  amount: number;
  /** Signal confidence (0-1) */
  confidence: number;
  /** Signal rationale */
  rationale: string;
  /** Timestamp */
  timestamp: Date;
  /** Source (rule ID, AI model, etc.) */
  source: string;
}

/**
 * Rule evaluation result
 */
export interface RuleEvaluation {
  /** Rule matched */
  matched: boolean;
  /** Rule ID */
  ruleId: string;
  /** Rule description */
  description: string;
  /** Evaluation details */
  details: Record<string, unknown>;
}

/**
 * Trade execution result
 */
export interface TradeExecutionResult {
  /** Execution success */
  success: boolean;
  /** Trade ID from eToro */
  tradeId?: string;
  /** Execution price */
  executionPrice?: number;
  /** Execution timestamp */
  executionTimestamp?: Date;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: string;
}

/**
 * Orchestrator cycle result
 */
export interface CycleResult {
  /** Cycle ID */
  cycleId: string;
  /** Cycle start time */
  startTime: Date;
  /** Cycle end time */
  endTime: Date;
  /** Number of signals processed */
  signalsProcessed: number;
  /** Number of trades executed */
  tradesExecuted: number;
  /** Number of trades rejected */
  tradesRejected: number;
  /** Number of trades requiring approval */
  tradesQueuedForApproval: number;
  /** Errors encountered */
  errors: string[];
  /** Cycle duration (ms) */
  duration: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Component name */
  component: string;
  /** Health status */
  healthy: boolean;
  /** Status message */
  message: string;
  /** Last check time */
  lastCheck: Date;
  /** Response time (ms) */
  responseTime?: number;
  /** Additional metrics */
  metrics?: Record<string, unknown>;
}

/**
 * System health status
 */
export interface SystemHealth {
  /** Overall system health */
  healthy: boolean;
  /** Component health checks */
  components: Record<string, HealthCheckResult>;
  /** Last health check */
  lastCheck: Date;
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Event loop interval (milliseconds) */
  loopIntervalMs: number;
  /** Enable orchestrator */
  enabled: boolean;
  /** System state */
  systemState: SystemState;
  /** Risk configuration */
  riskConfig: RiskConfig;
  /** Health check interval (milliseconds) */
  healthCheckIntervalMs: number;
  /** Circuit breaker config */
  circuitBreaker: CircuitBreakerConfig;
  /** eToro API configuration */
  etoroConfig: EToroConfig;
  /** Database configuration */
  databaseConfig: DatabaseConfig;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Enabled flag */
  enabled: boolean;
  /** Failure threshold before opening */
  failureThreshold: number;
  /** Success threshold before closing */
  successThreshold: number;
  /** Timeout before attempting reset (ms) */
  timeout: number;
}

/**
 * eToro API configuration
 */
export interface EToroConfig {
  /** API base URL */
  apiBaseUrl: string;
  /** API key */
  apiKey: string;
  /** API secret */
  apiSecret: string;
  /** Paper trading mode */
  paperTrading: boolean;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** Database host */
  host: string;
  /** Database port */
  port: number;
  /** Database name */
  database: string;
  /** Database user */
  user: string;
  /** Database password */
  password: string;
}

/**
 * Module interfaces for dependency injection
 */
export interface IDecisionLayer {
  getSignals(): Promise<TradeSignal[]>;
  healthCheck(): Promise<HealthCheckResult>;
}

export interface IRuleEngine {
  evaluateSignal(signal: TradeSignal): Promise<RuleEvaluation>;
  healthCheck(): Promise<HealthCheckResult>;
}

export interface IRiskManager {
  checkTrade(proposal: TradeProposal): Promise<RiskCheckResult>;
  healthCheck(): Promise<HealthCheckResult>;
}

export interface IEToroClient {
  executeTrade(proposal: TradeProposal): Promise<TradeExecutionResult>;
  getPortfolioValue(): Promise<number>;
  getCurrentPositions(): Promise<any[]>;
  healthCheck(): Promise<HealthCheckResult>;
}

export interface IAuditLogger {
  log(event: AuditEvent): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
}
