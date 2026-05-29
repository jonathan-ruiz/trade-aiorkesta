# ADR-002: Risk Management Framework

**Status:** Accepted  
**Date:** 2026-05-29  
**Author:** Sam (Solution Architect)

## Context

Autonomous trading with real money demands comprehensive risk controls. A single bug, market anomaly, or AI misjudgment can cause substantial financial loss. The system must protect users from:

1. **Over-exposure:** Risking too much capital on single trades or cumulative positions
2. **Runaway losses:** Daily drawdowns that spiral beyond acceptable thresholds
3. **Unreviewed high-stakes trades:** Large trades executing without manual oversight
4. **Cascade failures:** System errors triggering multiple bad trades
5. **Accidental live trading:** Users inadvertently enabling real-money mode

Traditional trading platforms enforce these controls at broker level. As an autonomous bot, we must implement **all** risk controls in software, with no external safety net.

## Decision

### 1. Layered Risk Defense

Implement defense-in-depth with multiple independent safety mechanisms:

**Layer 1: Position Limits**
- Max position size per trade (% of portfolio)
- Max total exposure across all positions
- Per-symbol position caps (for concentrated risk)
- Max concurrent positions (prevents over-diversification)

**Layer 2: Daily Loss Cap with Kill Switch**
- Absolute dollar threshold ($500 default)
- Percentage threshold (2% default)
- **Kill switch:** Auto-stop trading when threshold breached
- Manual restart required (no auto-resume)

**Layer 3: Approval Gate**
- Large trades (> $1000 or 10% of portfolio) queue for manual review
- User approves/rejects via UI
- Auto-reject after timeout (5 minutes default)

**Layer 4: Emergency Stops**
- Error rate threshold (5 errors/min)
- Consecutive failure count (3 failures)
- Manual emergency stop button

**Why layered?**
- Single control failure doesn't cause total failure
- Different controls catch different failure modes
- User has multiple intervention points
- Defense-in-depth is proven security pattern

### 2. Paper-Trading as Default Mode

**Default:** `TradingMode.PAPER` (simulated trades, no real money)  
**Opt-in:** User must explicitly enable `TradingMode.LIVE`

**Live trading requires:**
1. Explicit mode switch in config
2. `riskAcknowledged: true` flag (user clicked disclaimer)
3. Production eToro API credentials (not demo key)
4. UI confirmation dialog ("Are you sure? This is real money.")

**Why paper-first?**
- Fail-safe: users must actively choose risk
- Allows testing rules/AI with zero risk
- Catches bugs before money is at stake
- Industry standard (brokers default to sim accounts)

### 3. Configuration-Driven Limits

All risk limits stored in `RiskConfig` object:
- User-editable via UI
- Validated on update (range checks, consistency rules)
- Persisted in database (audit trail)
- Hot-reloadable (no restart required)

**Risk profiles:**
- **Default:** Conservative, beginner-safe
- **Conservative:** Extra-cautious, low limits
- **Aggressive:** Higher limits, fewer gates (power users)

**Why config-driven?**
- Different users have different risk tolerances
- Allows gradual ramp-up (start conservative, loosen over time)
- A/B test different risk settings
- No code changes for limit adjustments

### 4. Kill Switch Implementation

**Trigger conditions:**
```typescript
killSwitch.trigger() if:
  - dailyLoss >= config.maxDailyLossAmount OR
  - dailyLoss >= config.maxDailyLossPercent * startingBalance OR
  - consecutiveFailures >= config.maxConsecutiveFailures OR
  - manualStopActive === true
```

**When triggered:**
1. Set `killSwitchActive: true` in state
2. Reject all new trades
3. Log kill switch event to audit trail
4. Notify user (email, push notification, UI alert)
5. Require manual restart (user clicks "Restart Trading")

**Why manual restart?**
- Forces user awareness (can't miss a kill switch event)
- Prevents auto-resume into continued losses
- Gives user time to investigate root cause
- Industry best practice (circuit breakers don't auto-reset)

### 5. Approval Queue for Large Trades

Trades exceeding thresholds enter approval queue:
```typescript
requiresApproval if:
  - tradeAmount >= config.thresholdAmount OR
  - tradeAmount / portfolioValue >= config.thresholdPercent
```

**Approval workflow:**
1. Trade queued with proposal details
2. User sees pending approval in UI
3. User reviews trade context (rule trigger, AI rationale, market data)
4. User clicks Approve or Reject
5. If timeout expires → auto-reject

**Why approval gate?**
- Prevents "fat finger" errors (mistyped amounts)
- Catches AI misjudgments on high-stakes trades
- Gives user final say on significant decisions
- Regulatory best practice (human-in-the-loop)

### 6. Risk Metrics Dashboard

Real-time metrics surfaced to user and decision layer:
- Current exposure (% of portfolio)
- Open position count
- Daily P&L ($ and %)
- Proximity to loss cap (progress bar)
- Recent error count
- Kill switch status

**Why dashboard?**
- Transparency builds trust
- Users can intervene before limits hit
- Decision layer can factor risk state into AI judgment
- Early warning system (approaching loss cap)

### 7. Per-Symbol Limits

Default position limit applies to all symbols, but overridable per symbol:
```typescript
perSymbolLimits: {
  'TSLA': 0.03,  // Max 3% for volatile stocks
  'BTC': 0.02,   // Max 2% for crypto
}
```

**Why per-symbol?**
- Different assets have different risk profiles
- Prevents concentration in volatile symbols
- Allows nuanced risk management
- Supports sector-specific strategies

## Consequences

### Enables
- ✅ **Multi-layered safety:** No single point of failure
- ✅ **User control:** Manual override at every level
- ✅ **Paper-trading validation:** Test before risking real money
- ✅ **Gradual risk ramp:** Start conservative, increase limits over time
- ✅ **Auditability:** All risk decisions logged
- ✅ **Regulatory compliance:** Human-in-the-loop for large trades

### Constraints
- ⚠️ **Manual approval adds latency:** Large trades delayed by review time
- ⚠️ **Kill switch halts all trading:** May miss profitable opportunities after trigger
- ⚠️ **Position limits may be too conservative:** Users may want higher risk
- ⚠️ **Configuration complexity:** 10+ risk parameters to tune
- ⚠️ **Paper-trading not perfect simulation:** Slippage/liquidity differ from live

### Risks
- 🔴 **Users disable safety features** → Mitigated by: validation warnings, UI friction for unsafe configs
- 🔴 **Kill switch logic has bugs** → Mitigated by: comprehensive tests, pessimistic defaults (trigger early)
- 🔴 **User ignores approval queue** → Mitigated by: timeout auto-reject, notifications
- 🔴 **Daily loss cap insufficient for flash crash** → Mitigated by: real-time position monitoring, emergency stop
- 🔴 **Configuration validation incomplete** → Mitigated by: `validateRiskConfig()` catches invalid states

## Implementation Details

### Package Structure
```
packages/risk-management/
  src/
    types.ts        # RiskConfig, TradeProposal, RiskCheckResult types
    defaults.ts     # DEFAULT_RISK_CONFIG, risk profiles
    enforcer.ts     # RiskEnforcer class (core validation logic)
    validator.ts    # validateRiskConfig(), isSafeForLiveTrading()
    index.ts        # Public API exports
```

### Core API
```typescript
class RiskEnforcer {
  checkTrade(proposal: TradeProposal): RiskCheckResult
  updateDailyState(pnl: number, success: boolean): void
  resetKillSwitch(): void
  startNewDay(startingBalance: number): void
}
```

### Integration Points
1. **Server orchestrator** calls `enforcer.checkTrade()` before execution
2. **Rule engine** builds `TradeProposal` from rule evaluations
3. **Decision layer** receives `RiskMetrics` as context
4. **Audit log** records all `RiskCheckResult` decisions
5. **UI** displays metrics, approval queue, kill switch status

## Open Questions

1. **Loss cap reset:** Daily vs rolling 24h window? (Daily simpler, aligns with trading day)
2. **Multiple accounts:** Per-account limits or global? (Defer to Sprint 2)
3. **Position sizing algorithm:** Kelly criterion vs fixed %? (Defer to Sprint 3)
4. **Drawdown limits:** Max peak-to-trough in addition to daily? (Defer to Sprint 2)
5. **Risk-adjusted metrics:** Sharpe ratio tracking? (Defer to Sprint 3)

## Alternatives Considered

### Alternative 1: Broker-Enforced Limits
Use eToro's built-in risk controls (if available).

**Rejected because:**
- eToro API may not expose granular controls
- Loses our flexibility (can't customize per user)
- Debugging harder (limits enforced externally)
- No paper-trading mode integration

### Alternative 2: Post-Trade Risk Checks
Check limits after trade execution, reverse if exceeded.

**Rejected because:**
- Reversal adds cost (bid-ask spread, fees)
- Market may have moved (can't reverse at same price)
- Looks unprofessional (trade → immediate reverse)
- Pre-trade checks are industry standard

### Alternative 3: Soft Limits Only
Warn user but allow trades to proceed.

**Rejected because:**
- Users ignore warnings (proven UX pattern)
- Defeats purpose of risk controls
- Regulatory liability (we allowed risky trade)
- Hard limits are table stakes for autonomous trading

## References

- ADR-001 (Engine Architecture) - establishes safety-first principle
- Issue #2 (Risk Framework) - sprint 1 scope
- SEC Regulation Best Execution - human-in-the-loop requirement
- CME Risk Management Guidelines - kill switch best practices

---

**Decision outcome:** Implement layered risk framework with paper-trading default, position limits, daily loss cap with kill switch, approval gates, and emergency stops as specified. Configuration-driven, user-editable, with comprehensive validation. Deploy in Sprint 1 as foundational safety layer.
