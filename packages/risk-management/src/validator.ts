/**
 * Risk Configuration Validator
 *
 * Validates risk configuration for consistency and safety
 */

import { RiskConfig, TradingMode } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate risk configuration
 */
export function validateRiskConfig(config: RiskConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Position limits validation
  if (config.positionLimits.maxPositionSizePercent <= 0) {
    errors.push({
      field: 'positionLimits.maxPositionSizePercent',
      message: 'Must be greater than 0',
    });
  }

  if (config.positionLimits.maxPositionSizePercent > 1) {
    warnings.push({
      field: 'positionLimits.maxPositionSizePercent',
      message: 'Position size > 100% of portfolio is very risky',
    });
  }

  if (config.positionLimits.maxTotalExposurePercent <= 0) {
    errors.push({
      field: 'positionLimits.maxTotalExposurePercent',
      message: 'Must be greater than 0',
    });
  }

  if (config.positionLimits.maxTotalExposurePercent > 1) {
    warnings.push({
      field: 'positionLimits.maxTotalExposurePercent',
      message: 'Total exposure > 100% indicates leveraged trading - high risk',
    });
  }

  if (
    config.positionLimits.maxPositionSizePercent > config.positionLimits.maxTotalExposurePercent
  ) {
    errors.push({
      field: 'positionLimits.maxPositionSizePercent',
      message: 'Position size cannot exceed total exposure limit',
    });
  }

  if (config.positionLimits.maxConcurrentPositions <= 0) {
    errors.push({
      field: 'positionLimits.maxConcurrentPositions',
      message: 'Must be at least 1',
    });
  }

  // Per-symbol limits validation
  for (const [symbol, limit] of Object.entries(config.positionLimits.perSymbolLimits)) {
    if (limit <= 0) {
      errors.push({
        field: `positionLimits.perSymbolLimits.${symbol}`,
        message: 'Must be greater than 0',
      });
    }

    if (limit > config.positionLimits.maxPositionSizePercent) {
      warnings.push({
        field: `positionLimits.perSymbolLimits.${symbol}`,
        message: 'Symbol limit exceeds general position limit',
      });
    }
  }

  // Daily loss cap validation
  if (config.dailyLossCap.enabled) {
    if (config.dailyLossCap.maxDailyLossAmount <= 0) {
      errors.push({
        field: 'dailyLossCap.maxDailyLossAmount',
        message: 'Must be greater than 0',
      });
    }

    if (config.dailyLossCap.maxDailyLossPercent <= 0) {
      errors.push({
        field: 'dailyLossCap.maxDailyLossPercent',
        message: 'Must be greater than 0',
      });
    }

    if (config.dailyLossCap.maxDailyLossPercent > 0.1) {
      warnings.push({
        field: 'dailyLossCap.maxDailyLossPercent',
        message: 'Daily loss cap > 10% is very aggressive',
      });
    }
  }

  // Approval gate validation
  if (config.approvalGate.enabled) {
    if (config.approvalGate.thresholdAmount < 0) {
      errors.push({
        field: 'approvalGate.thresholdAmount',
        message: 'Cannot be negative',
      });
    }

    if (config.approvalGate.thresholdPercent < 0) {
      errors.push({
        field: 'approvalGate.thresholdPercent',
        message: 'Cannot be negative',
      });
    }

    if (config.approvalGate.approvalTimeoutSeconds < 0) {
      errors.push({
        field: 'approvalGate.approvalTimeoutSeconds',
        message: 'Cannot be negative',
      });
    }

    if (config.approvalGate.approvalTimeoutSeconds > 0 && config.approvalGate.approvalTimeoutSeconds < 60) {
      warnings.push({
        field: 'approvalGate.approvalTimeoutSeconds',
        message: 'Timeout < 60 seconds may not give enough time for review',
      });
    }
  }

  // Emergency stop validation
  if (config.emergencyStop.maxErrorRatePerMinute <= 0) {
    errors.push({
      field: 'emergencyStop.maxErrorRatePerMinute',
      message: 'Must be greater than 0',
    });
  }

  if (config.emergencyStop.maxConsecutiveFailures <= 0) {
    errors.push({
      field: 'emergencyStop.maxConsecutiveFailures',
      message: 'Must be greater than 0',
    });
  }

  // Live trading validation
  if (config.tradingMode === TradingMode.LIVE) {
    if (!config.riskAcknowledged) {
      errors.push({
        field: 'riskAcknowledged',
        message: 'Must acknowledge risk before enabling live trading',
      });
    }

    if (!config.dailyLossCap.enabled) {
      warnings.push({
        field: 'dailyLossCap.enabled',
        message: 'Live trading without daily loss cap is very risky',
      });
    }

    if (!config.approvalGate.enabled) {
      warnings.push({
        field: 'approvalGate.enabled',
        message: 'Live trading without approval gate removes safety check',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if configuration is safe for live trading
 */
export function isSafeForLiveTrading(config: RiskConfig): ValidationResult {
  const result = validateRiskConfig(config);

  // Additional safety checks for live trading
  const errors: ValidationError[] = [...result.errors];
  const warnings: ValidationError[] = [...result.warnings];

  if (config.tradingMode !== TradingMode.LIVE) {
    errors.push({
      field: 'tradingMode',
      message: 'Not in live trading mode',
    });
  }

  if (!config.riskAcknowledged) {
    errors.push({
      field: 'riskAcknowledged',
      message: 'Risk must be acknowledged',
    });
  }

  // Recommend conservative limits for live trading
  if (config.positionLimits.maxPositionSizePercent > 0.2) {
    warnings.push({
      field: 'positionLimits.maxPositionSizePercent',
      message: 'Position size > 20% is risky for live trading',
    });
  }

  if (config.positionLimits.maxTotalExposurePercent > 0.8) {
    warnings.push({
      field: 'positionLimits.maxTotalExposurePercent',
      message: 'Total exposure > 80% leaves little safety margin',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
