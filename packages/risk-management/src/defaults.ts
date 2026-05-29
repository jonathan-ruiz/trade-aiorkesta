/**
 * Default Risk Configuration
 *
 * Safe defaults: paper-trading mode, conservative limits, kill switches enabled
 */

import { RiskConfig, TradingMode } from './types';

/**
 * Production-safe default risk configuration
 *
 * CRITICAL: paper-trading is ON by default. User must explicitly:
 * 1. Acknowledge risk disclaimer
 * 2. Switch to LIVE mode
 * 3. Provide production eToro API credentials
 */
export const DEFAULT_RISK_CONFIG: RiskConfig = {
  tradingMode: TradingMode.PAPER,

  positionLimits: {
    // Max 5% of portfolio per trade
    maxPositionSizePercent: 0.05,

    // Max 50% total exposure (conservative - prevents over-leveraging)
    maxTotalExposurePercent: 0.5,

    // Per-symbol limits (can be customized per symbol)
    // Default: same as maxPositionSizePercent
    perSymbolLimits: {},

    // Max 10 concurrent positions (prevents over-diversification)
    maxConcurrentPositions: 10,
  },

  dailyLossCap: {
    enabled: true,

    // Max daily loss $500 (absolute)
    maxDailyLossAmount: 500,

    // Max daily loss 2% of starting balance (whichever hits first)
    maxDailyLossPercent: 0.02,

    // Require manual restart after kill switch (not auto-resume)
    requireManualRestart: true,
  },

  approvalGate: {
    enabled: true,

    // Trades > $1000 require approval
    thresholdAmount: 1000,

    // Trades > 10% of portfolio require approval
    thresholdPercent: 0.1,

    // Auto-reject pending approvals after 5 minutes
    approvalTimeoutSeconds: 300,
  },

  emergencyStop: {
    // Stop if > 5 errors per minute
    maxErrorRatePerMinute: 5,

    // Stop after 3 consecutive failures
    maxConsecutiveFailures: 3,

    // Manual stop flag (defaults off)
    manualStopActive: false,
  },

  lastModified: new Date(),

  // User must acknowledge risk before live-trading
  riskAcknowledged: false,
};

/**
 * Aggressive risk profile (for experienced users)
 * Higher limits, fewer gates - use with caution
 */
export const AGGRESSIVE_RISK_CONFIG: RiskConfig = {
  ...DEFAULT_RISK_CONFIG,

  positionLimits: {
    maxPositionSizePercent: 0.15, // 15% per trade
    maxTotalExposurePercent: 0.8, // 80% total
    perSymbolLimits: {},
    maxConcurrentPositions: 20,
  },

  dailyLossCap: {
    enabled: true,
    maxDailyLossAmount: 2000,
    maxDailyLossPercent: 0.05, // 5%
    requireManualRestart: true,
  },

  approvalGate: {
    enabled: false, // No approval gate
    thresholdAmount: 0,
    thresholdPercent: 0,
    approvalTimeoutSeconds: 0,
  },
};

/**
 * Conservative risk profile (for cautious users)
 * Lower limits, stricter gates
 */
export const CONSERVATIVE_RISK_CONFIG: RiskConfig = {
  ...DEFAULT_RISK_CONFIG,

  positionLimits: {
    maxPositionSizePercent: 0.02, // 2% per trade
    maxTotalExposurePercent: 0.3, // 30% total
    perSymbolLimits: {},
    maxConcurrentPositions: 5,
  },

  dailyLossCap: {
    enabled: true,
    maxDailyLossAmount: 200,
    maxDailyLossPercent: 0.01, // 1%
    requireManualRestart: true,
  },

  approvalGate: {
    enabled: true,
    thresholdAmount: 500,
    thresholdPercent: 0.05, // 5%
    approvalTimeoutSeconds: 600, // 10 minutes
  },
};
