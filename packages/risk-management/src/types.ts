/**
 * Risk Management Types
 *
 * Configuration and types for position limits, loss caps, approval gates.
 */

/**
 * Trading mode - paper-trading is default for safety
 */
export enum TradingMode {
  /** Simulated trades only, no real money */
  PAPER = 'PAPER',
  /** Live trading with real money (requires explicit opt-in) */
  LIVE = 'LIVE',
}

/**
 * Position limit configuration
 * Prevents over-exposure to single symbols or total portfolio
 */
export interface PositionLimits {
  /** Max position size per trade as % of portfolio (e.g., 0.05 = 5%) */
  maxPositionSizePercent: number;

  /** Max total exposure across all positions as % of portfolio (e.g., 0.8 = 80%) */
  maxTotalExposurePercent: number;

  /** Per-symbol position limits (symbol -> max % of portfolio) */
  perSymbolLimits: Record<string, number>;

  /** Max number of concurrent positions */
  maxConcurrentPositions: number;
}

/**
 * Daily loss cap configuration
 * Kill switch triggers when daily loss exceeds threshold
 */
export interface DailyLossCap {
  /** Enabled flag */
  enabled: boolean;

  /** Max daily loss in base currency (e.g., USD) */
  maxDailyLossAmount: number;

  /** Max daily loss as % of starting balance */
  maxDailyLossPercent: number;

  /** Require manual restart after kill switch triggered */
  requireManualRestart: boolean;
}

/**
 * Approval gate configuration
 * Large trades queue for manual review
 */
export interface ApprovalGate {
  /** Enabled flag */
  enabled: boolean;

  /** Trade size threshold for approval (in base currency) */
  thresholdAmount: number;

  /** Trade size threshold as % of portfolio */
  thresholdPercent: number;

  /** Auto-reject after timeout (seconds, 0 = no timeout) */
  approvalTimeoutSeconds: number;
}

/**
 * Emergency stop configuration
 */
export interface EmergencyStop {
  /** Max error rate before auto-stop (errors per minute) */
  maxErrorRatePerMinute: number;

  /** Max consecutive failures before stop */
  maxConsecutiveFailures: number;

  /** Manual stop flag (set by user via UI) */
  manualStopActive: boolean;
}

/**
 * Complete risk configuration
 */
export interface RiskConfig {
  /** Trading mode - defaults to PAPER */
  tradingMode: TradingMode;

  /** Position limits */
  positionLimits: PositionLimits;

  /** Daily loss cap and kill switch */
  dailyLossCap: DailyLossCap;

  /** Approval gate for large trades */
  approvalGate: ApprovalGate;

  /** Emergency stop conditions */
  emergencyStop: EmergencyStop;

  /** Timestamp of last config change */
  lastModified: Date;

  /** Risk acknowledgement flag (user must acknowledge before live-trading) */
  riskAcknowledged: boolean;
}

/**
 * Trade proposal for risk validation
 */
export interface TradeProposal {
  /** Symbol to trade */
  symbol: string;

  /** Trade size in base currency */
  amount: number;

  /** Trade direction */
  side: 'BUY' | 'SELL';

  /** Proposed entry price */
  price: number;

  /** Portfolio value at time of trade */
  portfolioValue: number;

  /** Current positions */
  currentPositions: Position[];
}

/**
 * Current position
 */
export interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
}

/**
 * Risk check result
 */
export interface RiskCheckResult {
  /** Trade allowed flag */
  allowed: boolean;

  /** Rejection reasons if not allowed */
  rejectionReasons: string[];

  /** Warnings (trade allowed but risky) */
  warnings: string[];

  /** Requires manual approval */
  requiresApproval: boolean;

  /** Current risk metrics */
  metrics: RiskMetrics;
}

/**
 * Current risk metrics
 */
export interface RiskMetrics {
  /** Current total exposure as % of portfolio */
  currentExposurePercent: number;

  /** Number of open positions */
  openPositions: number;

  /** Daily P&L in base currency */
  dailyPnL: number;

  /** Daily P&L as % of starting balance */
  dailyPnLPercent: number;

  /** Recent error count */
  recentErrors: number;

  /** Kill switch active flag */
  killSwitchActive: boolean;
}

/**
 * Daily state tracking (for loss cap)
 */
export interface DailyState {
  /** Trading day date (YYYY-MM-DD) */
  date: string;

  /** Starting balance for the day */
  startingBalance: number;

  /** Current P&L for the day */
  dailyPnL: number;

  /** Number of trades executed */
  tradeCount: number;

  /** Number of errors */
  errorCount: number;

  /** Consecutive failure count */
  consecutiveFailures: number;

  /** Kill switch triggered flag */
  killSwitchTriggered: boolean;

  /** Kill switch trigger timestamp */
  killSwitchTimestamp?: Date;
}
