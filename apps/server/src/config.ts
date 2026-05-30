/**
 * Configuration Management
 *
 * Loads configuration from environment variables
 */

import { DEFAULT_RISK_CONFIG } from '../../../packages/risk-management/src/defaults';
import { TradingMode } from '../../../packages/risk-management/src/types';
import type { OrchestratorConfig, SystemState } from './types';

/**
 * Load configuration from environment
 */
export function loadConfig(): OrchestratorConfig {
  return {
    // Event loop config
    loopIntervalMs: parseInt(process.env.LOOP_INTERVAL_MS || '300000', 10), // 5 min default
    enabled: process.env.ORCHESTRATOR_ENABLED !== 'false',

    // System state
    systemState: (process.env.SYSTEM_STATE as SystemState) || 'PAPER_TRADING',

    // Risk config
    riskConfig: {
      ...DEFAULT_RISK_CONFIG,
      tradingMode:
        (process.env.TRADING_MODE as TradingMode) || TradingMode.PAPER,
      riskAcknowledged: process.env.RISK_ACKNOWLEDGED === 'true',
    },

    // Health check config
    healthCheckIntervalMs: parseInt(
      process.env.HEALTH_CHECK_INTERVAL_MS || '60000',
      10
    ), // 1 min default

    // Circuit breaker config
    circuitBreaker: {
      enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURES || '5', 10),
      successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESSES || '2', 10),
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10), // 1 min
    },

    // eToro API config
    etoroConfig: {
      apiBaseUrl:
        process.env.ETORO_API_URL || 'https://api-portal.etoro.com',
      apiKey: process.env.ETORO_API_KEY || '',
      apiSecret: process.env.ETORO_API_SECRET || '',
      paperTrading: process.env.ETORO_PAPER_TRADING !== 'false',
    },

    // Database config
    databaseConfig: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'trade_aiorkesta',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: OrchestratorConfig): void {
  const errors: string[] = [];

  if (config.loopIntervalMs < 1000) {
    errors.push('Loop interval must be at least 1000ms');
  }

  if (config.systemState === 'LIVE_TRADING') {
    if (!config.riskConfig.riskAcknowledged) {
      errors.push('Live trading requires risk acknowledgement');
    }

    if (!config.etoroConfig.apiKey || !config.etoroConfig.apiSecret) {
      errors.push('Live trading requires eToro API credentials');
    }
  }

  if (!config.databaseConfig.password) {
    errors.push('Database password required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
