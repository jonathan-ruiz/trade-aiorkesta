/**
 * Decision Layer Stub
 *
 * Placeholder until packages/decision-layer is implemented
 * Returns empty signals for now
 */

import type { IDecisionLayer, TradeSignal, HealthCheckResult } from '../types';

export class DecisionLayerStub implements IDecisionLayer {
  async getSignals(): Promise<TradeSignal[]> {
    // Stub: return no signals
    // Real implementation will query AI model + external data
    return [];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      component: 'decision-layer',
      healthy: true,
      message: 'Stub implementation - no real checks',
      lastCheck: new Date(),
    };
  }
}
