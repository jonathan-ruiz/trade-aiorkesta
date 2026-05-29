/**
 * Configuration Examples
 *
 * Shows different risk profiles for different user types
 */

import {
  RiskConfig,
  TradingMode,
  DEFAULT_RISK_CONFIG,
  CONSERVATIVE_RISK_CONFIG,
  AGGRESSIVE_RISK_CONFIG,
} from '../src';

/**
 * Example 1: Beginner Trader
 * Conservative limits, all safety features enabled
 */
export const beginnerConfig: RiskConfig = {
  ...CONSERVATIVE_RISK_CONFIG,
  tradingMode: TradingMode.PAPER, // Paper-trading only
  riskAcknowledged: false, // Not ready for live
};

/**
 * Example 2: Experienced Day Trader
 * Higher limits, approval gate disabled, but loss cap active
 */
export const dayTraderConfig: RiskConfig = {
  tradingMode: TradingMode.LIVE,
  riskAcknowledged: true,

  positionLimits: {
    maxPositionSizePercent: 0.1, // 10% per trade
    maxTotalExposurePercent: 0.9, // 90% total
    perSymbolLimits: {
      // Crypto - extra cautious
      'BTC': 0.05,
      'ETH': 0.05,
      // Volatile stocks - lower limits
      'TSLA': 0.07,
      'NVDA': 0.07,
    },
    maxConcurrentPositions: 15,
  },

  dailyLossCap: {
    enabled: true,
    maxDailyLossAmount: 2000, // $2k stop
    maxDailyLossPercent: 0.05, // 5% stop
    requireManualRestart: true,
  },

  approvalGate: {
    enabled: false, // No approval gate - experienced trader
    thresholdAmount: 0,
    thresholdPercent: 0,
    approvalTimeoutSeconds: 0,
  },

  emergencyStop: {
    maxErrorRatePerMinute: 10, // Higher tolerance
    maxConsecutiveFailures: 5,
    manualStopActive: false,
  },

  lastModified: new Date(),
  riskAcknowledged: true,
};

/**
 * Example 3: Testing / Development
 * Paper-trading with relaxed limits for testing strategies
 */
export const testingConfig: RiskConfig = {
  tradingMode: TradingMode.PAPER,
  riskAcknowledged: false,

  positionLimits: {
    maxPositionSizePercent: 0.2, // 20% - test position sizing
    maxTotalExposurePercent: 1.0, // 100% - full portfolio
    perSymbolLimits: {},
    maxConcurrentPositions: 50, // Test many positions
  },

  dailyLossCap: {
    enabled: false, // Disabled for testing
    maxDailyLossAmount: 999999,
    maxDailyLossPercent: 1.0,
    requireManualRestart: false,
  },

  approvalGate: {
    enabled: false, // No approvals in test
    thresholdAmount: 0,
    thresholdPercent: 0,
    approvalTimeoutSeconds: 0,
  },

  emergencyStop: {
    maxErrorRatePerMinute: 100, // Relaxed for debugging
    maxConsecutiveFailures: 10,
    manualStopActive: false,
  },

  lastModified: new Date(),
  riskAcknowledged: false,
};

/**
 * Example 4: Conservative Long-Term Investor
 * Very low limits, all gates enabled
 */
export const conservativeInvestorConfig: RiskConfig = {
  tradingMode: TradingMode.LIVE,
  riskAcknowledged: true,

  positionLimits: {
    maxPositionSizePercent: 0.02, // 2% per trade
    maxTotalExposurePercent: 0.3, // 30% total (70% cash buffer)
    perSymbolLimits: {},
    maxConcurrentPositions: 5, // Concentrated portfolio
  },

  dailyLossCap: {
    enabled: true,
    maxDailyLossAmount: 100, // $100 stop
    maxDailyLossPercent: 0.005, // 0.5% stop
    requireManualRestart: true,
  },

  approvalGate: {
    enabled: true,
    thresholdAmount: 200, // $200+ needs approval
    thresholdPercent: 0.02, // 2%+ needs approval
    approvalTimeoutSeconds: 3600, // 1 hour timeout
  },

  emergencyStop: {
    maxErrorRatePerMinute: 3, // Very sensitive
    maxConsecutiveFailures: 2,
    manualStopActive: false,
  },

  lastModified: new Date(),
  riskAcknowledged: true,
};
