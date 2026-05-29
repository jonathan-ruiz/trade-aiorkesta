/**
 * Risk Enforcer
 *
 * Validates trade proposals against risk configuration.
 * Enforces position limits, loss caps, approval gates, kill switches.
 */

import {
  RiskConfig,
  TradeProposal,
  RiskCheckResult,
  RiskMetrics,
  DailyState,
  TradingMode,
} from './types';

/**
 * Risk Enforcer - validates trades against risk rules
 */
export class RiskEnforcer {
  private config: RiskConfig;
  private dailyState: DailyState;

  constructor(config: RiskConfig, dailyState: DailyState) {
    this.config = config;
    this.dailyState = dailyState;
  }

  /**
   * Check if trade proposal is allowed
   */
  checkTrade(proposal: TradeProposal): RiskCheckResult {
    const metrics = this.calculateMetrics(proposal);
    const rejectionReasons: string[] = [];
    const warnings: string[] = [];
    let requiresApproval = false;

    // 1. Check kill switch
    if (metrics.killSwitchActive) {
      rejectionReasons.push(
        'Kill switch active - trading stopped. Manual restart required.'
      );
    }

    // 2. Check trading mode (paper vs live)
    if (this.config.tradingMode === TradingMode.LIVE) {
      if (!this.config.riskAcknowledged) {
        rejectionReasons.push(
          'Live trading requires risk acknowledgement. Review disclaimer and acknowledge.'
        );
      }
    }

    // 3. Check position size limit
    const positionSizePercent = proposal.amount / proposal.portfolioValue;
    if (positionSizePercent > this.config.positionLimits.maxPositionSizePercent) {
      rejectionReasons.push(
        `Position size ${(positionSizePercent * 100).toFixed(1)}% exceeds limit ${(this.config.positionLimits.maxPositionSizePercent * 100).toFixed(1)}%`
      );
    }

    // 4. Check per-symbol limit
    const symbolLimit = this.config.positionLimits.perSymbolLimits[proposal.symbol];
    if (symbolLimit !== undefined && positionSizePercent > symbolLimit) {
      rejectionReasons.push(
        `Position size ${(positionSizePercent * 100).toFixed(1)}% exceeds ${proposal.symbol} limit ${(symbolLimit * 100).toFixed(1)}%`
      );
    }

    // 5. Check total exposure
    const newExposure = metrics.currentExposurePercent + positionSizePercent;
    if (newExposure > this.config.positionLimits.maxTotalExposurePercent) {
      rejectionReasons.push(
        `Total exposure ${(newExposure * 100).toFixed(1)}% would exceed limit ${(this.config.positionLimits.maxTotalExposurePercent * 100).toFixed(1)}%`
      );
    }

    // 6. Check max concurrent positions
    if (
      proposal.side === 'BUY' &&
      metrics.openPositions >= this.config.positionLimits.maxConcurrentPositions
    ) {
      rejectionReasons.push(
        `Max concurrent positions ${this.config.positionLimits.maxConcurrentPositions} reached`
      );
    }

    // 7. Check daily loss cap
    if (this.config.dailyLossCap.enabled) {
      if (
        metrics.dailyPnL < 0 &&
        Math.abs(metrics.dailyPnL) >= this.config.dailyLossCap.maxDailyLossAmount
      ) {
        rejectionReasons.push(
          `Daily loss $${Math.abs(metrics.dailyPnL).toFixed(2)} exceeds cap $${this.config.dailyLossCap.maxDailyLossAmount}`
        );
      }

      if (
        metrics.dailyPnL < 0 &&
        Math.abs(metrics.dailyPnLPercent) >= this.config.dailyLossCap.maxDailyLossPercent
      ) {
        rejectionReasons.push(
          `Daily loss ${Math.abs(metrics.dailyPnLPercent * 100).toFixed(2)}% exceeds cap ${(this.config.dailyLossCap.maxDailyLossPercent * 100).toFixed(2)}%`
        );
      }

      // Warning if approaching loss cap
      if (
        metrics.dailyPnL < 0 &&
        Math.abs(metrics.dailyPnLPercent) > this.config.dailyLossCap.maxDailyLossPercent * 0.75
      ) {
        warnings.push(
          `Approaching daily loss cap (${Math.abs(metrics.dailyPnLPercent * 100).toFixed(1)}% of ${(this.config.dailyLossCap.maxDailyLossPercent * 100).toFixed(1)}%)`
        );
      }
    }

    // 8. Check approval gate
    if (this.config.approvalGate.enabled) {
      const needsApprovalByAmount = proposal.amount >= this.config.approvalGate.thresholdAmount;
      const needsApprovalByPercent =
        positionSizePercent >= this.config.approvalGate.thresholdPercent;

      if (needsApprovalByAmount || needsApprovalByPercent) {
        requiresApproval = true;
        warnings.push(
          `Trade requires manual approval (${needsApprovalByAmount ? `$${proposal.amount} >= $${this.config.approvalGate.thresholdAmount}` : ''} ${needsApprovalByPercent ? `${(positionSizePercent * 100).toFixed(1)}% >= ${(this.config.approvalGate.thresholdPercent * 100).toFixed(1)}%` : ''})`
        );
      }
    }

    // 9. Check emergency stop
    if (this.config.emergencyStop.manualStopActive) {
      rejectionReasons.push('Manual emergency stop active');
    }

    const allowed = rejectionReasons.length === 0 && !requiresApproval;

    return {
      allowed,
      rejectionReasons,
      warnings,
      requiresApproval,
      metrics,
    };
  }

  /**
   * Calculate current risk metrics
   */
  private calculateMetrics(proposal: TradeProposal): RiskMetrics {
    // Calculate total exposure from current positions
    const currentExposure = proposal.currentPositions.reduce((sum, pos) => {
      return sum + Math.abs(pos.size * pos.currentPrice);
    }, 0);

    const currentExposurePercent = currentExposure / proposal.portfolioValue;

    // Calculate daily P&L percent
    const dailyPnLPercent =
      this.dailyState.startingBalance > 0
        ? this.dailyState.dailyPnL / this.dailyState.startingBalance
        : 0;

    // Check kill switch conditions
    const killSwitchActive = this.isKillSwitchActive();

    return {
      currentExposurePercent,
      openPositions: proposal.currentPositions.length,
      dailyPnL: this.dailyState.dailyPnL,
      dailyPnLPercent,
      recentErrors: this.dailyState.errorCount,
      killSwitchActive,
    };
  }

  /**
   * Check if kill switch should be active
   */
  private isKillSwitchActive(): boolean {
    // Already triggered
    if (this.dailyState.killSwitchTriggered) {
      return true;
    }

    // Daily loss cap exceeded
    if (this.config.dailyLossCap.enabled) {
      const lossAmountExceeded =
        this.dailyState.dailyPnL < 0 &&
        Math.abs(this.dailyState.dailyPnL) >= this.config.dailyLossCap.maxDailyLossAmount;

      const lossPercentExceeded =
        this.dailyState.dailyPnL < 0 &&
        this.dailyState.startingBalance > 0 &&
        Math.abs(this.dailyState.dailyPnL / this.dailyState.startingBalance) >=
          this.config.dailyLossCap.maxDailyLossPercent;

      if (lossAmountExceeded || lossPercentExceeded) {
        return true;
      }
    }

    // Consecutive failures
    if (
      this.dailyState.consecutiveFailures >= this.config.emergencyStop.maxConsecutiveFailures
    ) {
      return true;
    }

    return false;
  }

  /**
   * Update daily state after trade execution
   */
  updateDailyState(pnl: number, success: boolean): void {
    this.dailyState.dailyPnL += pnl;
    this.dailyState.tradeCount++;

    if (!success) {
      this.dailyState.errorCount++;
      this.dailyState.consecutiveFailures++;
    } else {
      this.dailyState.consecutiveFailures = 0;
    }

    // Check if kill switch should trigger
    if (!this.dailyState.killSwitchTriggered && this.isKillSwitchActive()) {
      this.dailyState.killSwitchTriggered = true;
      this.dailyState.killSwitchTimestamp = new Date();
    }
  }

  /**
   * Reset kill switch (manual restart)
   */
  resetKillSwitch(): void {
    this.dailyState.killSwitchTriggered = false;
    this.dailyState.killSwitchTimestamp = undefined;
    this.dailyState.consecutiveFailures = 0;
  }

  /**
   * Start new trading day (resets daily state)
   */
  startNewDay(startingBalance: number): void {
    const today = new Date().toISOString().split('T')[0];
    this.dailyState = {
      date: today,
      startingBalance,
      dailyPnL: 0,
      tradeCount: 0,
      errorCount: 0,
      consecutiveFailures: 0,
      killSwitchTriggered: false,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): RiskConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: RiskConfig): void {
    this.config = { ...config, lastModified: new Date() };
  }

  /**
   * Get current daily state
   */
  getDailyState(): DailyState {
    return { ...this.dailyState };
  }
}

/**
 * Create new daily state for given date
 */
export function createDailyState(startingBalance: number): DailyState {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    startingBalance,
    dailyPnL: 0,
    tradeCount: 0,
    errorCount: 0,
    consecutiveFailures: 0,
    killSwitchTriggered: false,
  };
}
