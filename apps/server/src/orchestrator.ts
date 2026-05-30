/**
 * Trade Orchestrator
 *
 * Central service coordinating trade execution flow:
 * decision → rules → risk → eToro → audit
 */

import { CircuitBreaker } from './circuit-breaker';
import type {
  OrchestratorConfig,
  CycleResult,
  SystemHealth,
  SystemState,
  TradeSignal,
  IDecisionLayer,
  IRuleEngine,
  IRiskManager,
  IEToroClient,
  IAuditLogger,
} from './types';
import type { TradeProposal } from '../../../packages/risk-management/src/types';
import type { AuditEvent, EventType } from '../../../packages/audit/src/types';

export class Orchestrator {
  private config: OrchestratorConfig;
  private circuitBreaker: CircuitBreaker;
  private running = false;
  private loopTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private systemHealth: SystemHealth;

  // Module dependencies (injected)
  private decisionLayer: IDecisionLayer;
  private ruleEngine: IRuleEngine;
  private riskManager: IRiskManager;
  private etoroClient: IEToroClient;
  private auditLogger: IAuditLogger;

  constructor(
    config: OrchestratorConfig,
    modules: {
      decisionLayer: IDecisionLayer;
      ruleEngine: IRuleEngine;
      riskManager: IRiskManager;
      etoroClient: IEToroClient;
      auditLogger: IAuditLogger;
    }
  ) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.decisionLayer = modules.decisionLayer;
    this.ruleEngine = modules.ruleEngine;
    this.riskManager = modules.riskManager;
    this.etoroClient = modules.etoroClient;
    this.auditLogger = modules.auditLogger;

    this.systemHealth = {
      healthy: false,
      components: {},
      lastCheck: new Date(),
    };
  }

  /**
   * Start orchestrator
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Orchestrator already running');
    }

    console.log('[Orchestrator] Starting...');
    this.running = true;

    // Initial health check
    await this.performHealthCheck();

    if (!this.systemHealth.healthy) {
      console.error('[Orchestrator] Health check failed on startup');
      throw new Error('System health check failed - cannot start');
    }

    // Start event loop
    this.scheduleNextCycle();

    // Start health check loop
    this.scheduleHealthCheck();

    console.log(`[Orchestrator] Started in ${this.config.systemState} mode`);
    console.log(`[Orchestrator] Event loop interval: ${this.config.loopIntervalMs}ms`);
  }

  /**
   * Stop orchestrator
   */
  async stop(): Promise<void> {
    console.log('[Orchestrator] Stopping...');
    this.running = false;

    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = undefined;
    }

    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    console.log('[Orchestrator] Stopped');
  }

  /**
   * Execute one orchestration cycle
   */
  private async executeCycle(): Promise<CycleResult> {
    const cycleId = `cycle-${Date.now()}`;
    const startTime = new Date();
    const result: CycleResult = {
      cycleId,
      startTime,
      endTime: new Date(),
      signalsProcessed: 0,
      tradesExecuted: 0,
      tradesRejected: 0,
      tradesQueuedForApproval: 0,
      errors: [],
      duration: 0,
    };

    try {
      console.log(`[Orchestrator] Cycle ${cycleId} starting...`);

      // Step 1: Get trade signals from decision layer
      const signals = await this.circuitBreaker.execute(() =>
        this.decisionLayer.getSignals()
      );

      console.log(`[Orchestrator] Retrieved ${signals.length} signals`);
      result.signalsProcessed = signals.length;

      // Step 2: Process each signal
      for (const signal of signals) {
        try {
          await this.processSignal(signal, result);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[Orchestrator] Error processing signal ${signal.id}:`, errorMsg);
          result.errors.push(`Signal ${signal.id}: ${errorMsg}`);
        }
      }

      const endTime = new Date();
      result.endTime = endTime;
      result.duration = endTime.getTime() - startTime.getTime();

      console.log(
        `[Orchestrator] Cycle ${cycleId} complete: ` +
          `${result.tradesExecuted} executed, ${result.tradesRejected} rejected, ` +
          `${result.tradesQueuedForApproval} queued (${result.duration}ms)`
      );

      // Log cycle completion to audit
      await this.logAuditEvent({
        eventType: 'CYCLE_COMPLETE' as EventType,
        timestamp: new Date(),
        data: {
          cycleId,
          signalsProcessed: result.signalsProcessed,
          tradesExecuted: result.tradesExecuted,
          duration: result.duration,
        },
        metadata: {},
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Cycle ${cycleId} failed:`, errorMsg);
      result.errors.push(`Cycle failure: ${errorMsg}`);

      // Log cycle error
      await this.logAuditEvent({
        eventType: 'CONFIG_CHANGED' as EventType, // Reusing available type
        timestamp: new Date(),
        data: {
          cycleId,
          error: errorMsg,
        },
        metadata: {},
      });
    }

    return result;
  }

  /**
   * Process single trade signal
   */
  private async processSignal(signal: TradeSignal, result: CycleResult): Promise<void> {
    console.log(`[Orchestrator] Processing signal ${signal.id} (${signal.symbol} ${signal.side})`);

    // Step 1: Evaluate rules
    const ruleEval = await this.ruleEngine.evaluateSignal(signal);
    if (!ruleEval.matched) {
      console.log(`[Orchestrator] Signal ${signal.id} rejected by rules`);
      result.tradesRejected++;
      return;
    }

    console.log(`[Orchestrator] Signal ${signal.id} matched rule ${ruleEval.ruleId}`);

    // Step 2: Get portfolio info for risk check
    const portfolioValue = await this.etoroClient.getPortfolioValue();
    const currentPositions = await this.etoroClient.getCurrentPositions();

    // Step 3: Build trade proposal
    const proposal: TradeProposal = {
      symbol: signal.symbol,
      amount: signal.amount,
      side: signal.side,
      price: 0, // Market order - price filled by eToro
      portfolioValue,
      currentPositions,
    };

    // Step 4: Check risk limits
    const riskCheck = await this.riskManager.checkTrade(proposal);

    // Log risk decision
    await this.logAuditEvent({
      eventType: 'DECISION_MADE' as EventType,
      timestamp: new Date(),
      data: {
        signalId: signal.id,
        proposal,
        riskCheck,
      },
      metadata: {},
    });

    if (!riskCheck.allowed) {
      console.log(`[Orchestrator] Signal ${signal.id} rejected by risk: ${riskCheck.rejectionReasons.join(', ')}`);
      result.tradesRejected++;
      return;
    }

    if (riskCheck.requiresApproval) {
      console.log(`[Orchestrator] Signal ${signal.id} requires approval: ${riskCheck.warnings.join(', ')}`);
      result.tradesQueuedForApproval++;
      // TODO: Queue for manual approval
      return;
    }

    // Step 5: Execute trade
    console.log(`[Orchestrator] Executing trade for signal ${signal.id}`);
    const executionResult = await this.etoroClient.executeTrade(proposal);

    if (executionResult.success) {
      console.log(
        `[Orchestrator] Trade executed successfully: ${executionResult.tradeId} ` +
          `at ${executionResult.executionPrice}`
      );
      result.tradesExecuted++;
    } else {
      console.error(
        `[Orchestrator] Trade execution failed: ${executionResult.error}`
      );
      result.tradesRejected++;
    }

    // Step 6: Log trade execution
    await this.logAuditEvent({
      eventType: 'TRADE_EXECUTED' as EventType,
      timestamp: new Date(),
      data: {
        signalId: signal.id,
        proposal,
        executionResult,
      },
      metadata: {},
    });
  }

  /**
   * Schedule next cycle
   */
  private scheduleNextCycle(): void {
    if (!this.running || !this.config.enabled) {
      return;
    }

    this.loopTimer = setTimeout(async () => {
      if (this.running && this.config.enabled) {
        await this.executeCycle();
        this.scheduleNextCycle();
      }
    }, this.config.loopIntervalMs);
  }

  /**
   * Perform health check on all modules
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = new Date();

    const components = {
      decisionLayer: await this.decisionLayer.healthCheck(),
      ruleEngine: await this.ruleEngine.healthCheck(),
      riskManager: await this.riskManager.healthCheck(),
      etoroClient: await this.etoroClient.healthCheck(),
      auditLogger: await this.auditLogger.healthCheck(),
    };

    const allHealthy = Object.values(components).every((c) => c.healthy);

    this.systemHealth = {
      healthy: allHealthy,
      components,
      lastCheck: startTime,
    };

    if (!allHealthy) {
      const unhealthy = Object.entries(components)
        .filter(([_, c]) => !c.healthy)
        .map(([name, c]) => `${name}: ${c.message}`);
      console.warn(`[Orchestrator] Health check failed: ${unhealthy.join(', ')}`);
    }
  }

  /**
   * Schedule periodic health checks
   */
  private scheduleHealthCheck(): void {
    if (!this.running) {
      return;
    }

    this.healthCheckTimer = setTimeout(async () => {
      if (this.running) {
        await this.performHealthCheck();
        this.scheduleHealthCheck();
      }
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await this.auditLogger.log(event);
    } catch (error) {
      console.error('[Orchestrator] Failed to log audit event:', error);
      // Don't throw - audit failures shouldn't stop trading
    }
  }

  /**
   * Get system health
   */
  getHealth(): SystemHealth {
    return this.systemHealth;
  }

  /**
   * Get system state
   */
  getState(): SystemState {
    return this.config.systemState;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...updates };

    // Log config change
    this.logAuditEvent({
      eventType: 'CONFIG_CHANGED' as EventType,
      timestamp: new Date(),
      data: { updates },
      metadata: {},
    });

    console.log('[Orchestrator] Configuration updated');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    console.log('[Orchestrator] Circuit breaker reset');
  }
}
