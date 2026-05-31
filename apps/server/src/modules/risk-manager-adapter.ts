/**
 * Risk Manager Adapter
 *
 * Adapts @trade-aiorkesta/risk-management to orchestrator interface
 */

import { RiskEnforcer, createDailyState } from '../../../../packages/risk-management/src';
import type { RiskConfig, TradeProposal, RiskCheckResult } from '../../../../packages/risk-management/src/types';
import type { IRiskManager, HealthCheckResult } from '../types';

export class RiskManagerAdapter implements IRiskManager {
  private enforcer: RiskEnforcer;

  constructor(config: RiskConfig, startingBalance: number) {
    const dailyState = createDailyState(startingBalance);
    this.enforcer = new RiskEnforcer(config, dailyState);
  }

  async checkTrade(proposal: TradeProposal): Promise<RiskCheckResult> {
    // RiskEnforcer.checkTrade is synchronous, but we wrap in async for interface
    return this.enforcer.checkTrade(proposal);
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const config = this.enforcer.getConfig();
    const dailyState = this.enforcer.getDailyState();

    const healthy = !dailyState.killSwitchTriggered;

    return {
      component: 'risk-manager',
      healthy,
      message: healthy
        ? `Trading mode: ${config.tradingMode}, Daily P&L: ${dailyState.dailyPnL}`
        : `Kill switch active since ${dailyState.killSwitchTimestamp}`,
      lastCheck: new Date(),
      metrics: {
        tradingMode: config.tradingMode,
        dailyPnL: dailyState.dailyPnL,
        tradeCount: dailyState.tradeCount,
        killSwitchActive: dailyState.killSwitchTriggered,
      },
    };
  }

  /**
   * Get underlying enforcer for direct access
   */
  getEnforcer(): RiskEnforcer {
    return this.enforcer;
  }
}
