/**
 * Server Entry Point
 *
 * Initializes and starts the trade orchestrator
 */

import { Orchestrator } from './orchestrator';
import { loadConfig, validateConfig } from './config';
import { DecisionLayerStub } from './modules/decision-layer-stub';
import { RuleEngineStub } from './modules/rule-engine-stub';
import { RiskManagerAdapter } from './modules/risk-manager-adapter';
import { EToroClientAdapter } from './modules/etoro-client-adapter';
import { AuditLoggerAdapter } from './modules/audit-logger-adapter';

async function main() {
  console.log('[Server] Starting Trade Aiorkesta Orchestrator...');

  // Load and validate configuration
  const config = loadConfig();
  validateConfig(config);

  console.log(`[Server] Configuration loaded`);
  console.log(`[Server] System state: ${config.systemState}`);
  console.log(`[Server] Trading mode: ${config.riskConfig.tradingMode}`);
  console.log(`[Server] Paper trading: ${config.etoroConfig.paperTrading}`);

  // Initialize modules
  const decisionLayer = new DecisionLayerStub();
  const ruleEngine = new RuleEngineStub();
  const riskManager = new RiskManagerAdapter(config.riskConfig, 10000); // $10k starting balance
  const etoroClient = new EToroClientAdapter(config.etoroConfig);
  const auditLogger = new AuditLoggerAdapter(config.databaseConfig);

  // Initialize audit logger (database connection)
  try {
    await auditLogger.initialize();
    console.log('[Server] Audit logger initialized');
  } catch (error) {
    console.error('[Server] Failed to initialize audit logger:', error);
    console.warn('[Server] Continuing without audit logging (not recommended)');
  }

  // Create orchestrator
  const orchestrator = new Orchestrator(config, {
    decisionLayer,
    ruleEngine,
    riskManager,
    etoroClient,
    auditLogger,
  });

  // Start orchestrator
  try {
    await orchestrator.start();
    console.log('[Server] Orchestrator started successfully');
  } catch (error) {
    console.error('[Server] Failed to start orchestrator:', error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[Server] Received SIGINT, shutting down...');
    await orchestrator.stop();
    await auditLogger.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[Server] Received SIGTERM, shutting down...');
    await orchestrator.stop();
    await auditLogger.close();
    process.exit(0);
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
main().catch((error) => {
  console.error('[Server] Fatal error:', error);
  process.exit(1);
});
