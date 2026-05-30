/**
 * Rule Engine Stub
 *
 * Placeholder until packages/rule-engine is implemented
 * Auto-approves all signals for now
 */

import type { IRuleEngine, TradeSignal, RuleEvaluation, HealthCheckResult } from '../types';

export class RuleEngineStub implements IRuleEngine {
  async evaluateSignal(signal: TradeSignal): Promise<RuleEvaluation> {
    // Stub: auto-approve all signals
    // Real implementation will evaluate user-configured rules
    return {
      matched: true,
      ruleId: 'stub-always-match',
      description: 'Stub rule - matches all signals',
      details: {
        signal: signal.id,
      },
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      component: 'rule-engine',
      healthy: true,
      message: 'Stub implementation - no real checks',
      lastCheck: new Date(),
    };
  }
}
