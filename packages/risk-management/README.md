# @trade-aiorkesta/risk-management

Risk management and safety framework for autonomous trading.

## Responsibilities

- **Position limits:** Max position size per trade, per symbol, and total portfolio exposure
- **Daily loss cap:** Kill switch when daily loss exceeds threshold (amount or %)
- **Approval gates:** Queue large trades for manual review
- **Emergency stops:** Auto-stop on error rate or consecutive failures
- **Trading modes:** Paper-trading (default) vs live-trading with risk acknowledgement
- **Configuration validation:** Ensures risk config is safe and consistent

## Key Features

### Safety-First Defaults

- **Paper-trading mode ON by default** - user must explicitly opt-in to live trading
- **Conservative position limits** - max 5% per trade, 50% total exposure
- **Daily loss cap enabled** - stops at $500 or 2% loss (whichever hits first)
- **Approval gate for large trades** - trades > $1000 or 10% require manual review
- **Kill switch auto-trigger** - manual restart required after threshold breach

### Risk Profiles

Pre-configured profiles for different risk tolerances:

- **Default:** Conservative, safe for beginners
- **Conservative:** Extra-cautious, lower limits
- **Aggressive:** Higher limits, fewer gates (use with caution)

### Kill Switch Triggers

Automatic trading halt when:
- Daily loss exceeds absolute amount threshold
- Daily loss exceeds percentage threshold
- Consecutive failure count exceeds limit
- Manual emergency stop activated

## Usage

```typescript
import {
  RiskEnforcer,
  createDailyState,
  DEFAULT_RISK_CONFIG,
  TradingMode,
} from '@trade-aiorkesta/risk-management';

// Initialize enforcer with config and daily state
const config = DEFAULT_RISK_CONFIG;
const dailyState = createDailyState(10000); // $10k starting balance
const enforcer = new RiskEnforcer(config, dailyState);

// Check if trade is allowed
const proposal = {
  symbol: 'AAPL',
  amount: 500,
  side: 'BUY',
  price: 150,
  portfolioValue: 10000,
  currentPositions: [],
};

const result = enforcer.checkTrade(proposal);

if (!result.allowed) {
  console.error('Trade rejected:', result.rejectionReasons);
} else if (result.requiresApproval) {
  console.log('Trade requires approval:', result.warnings);
  // Queue for manual review
} else {
  console.log('Trade approved:', result.warnings);
  // Execute trade
}

// Update state after trade execution
enforcer.updateDailyState(-50, true); // Lost $50, trade succeeded

// Get current metrics
const metrics = result.metrics;
console.log('Daily P&L:', metrics.dailyPnL);
console.log('Kill switch active:', metrics.killSwitchActive);
```

## Configuration

### Position Limits

```typescript
positionLimits: {
  maxPositionSizePercent: 0.05,        // 5% per trade
  maxTotalExposurePercent: 0.5,        // 50% total
  perSymbolLimits: {
    'TSLA': 0.03,                      // 3% max for TSLA
  },
  maxConcurrentPositions: 10,
}
```

### Daily Loss Cap

```typescript
dailyLossCap: {
  enabled: true,
  maxDailyLossAmount: 500,             // $500 max loss
  maxDailyLossPercent: 0.02,           // 2% max loss
  requireManualRestart: true,          // Manual restart after kill
}
```

### Approval Gate

```typescript
approvalGate: {
  enabled: true,
  thresholdAmount: 1000,               // $1000+ requires approval
  thresholdPercent: 0.1,               // 10%+ requires approval
  approvalTimeoutSeconds: 300,         // Auto-reject after 5 min
}
```

### Emergency Stop

```typescript
emergencyStop: {
  maxErrorRatePerMinute: 5,            // Stop at 5 errors/min
  maxConsecutiveFailures: 3,           // Stop after 3 failures
  manualStopActive: false,             // Manual stop flag
}
```

## Validation

```typescript
import { validateRiskConfig, isSafeForLiveTrading } from '@trade-aiorkesta/risk-management';

// Validate config consistency
const validation = validateRiskConfig(config);
if (!validation.valid) {
  console.error('Invalid config:', validation.errors);
}

// Check if safe for live trading
const safety = isSafeForLiveTrading(config);
if (!safety.valid) {
  console.error('Not safe for live trading:', safety.errors);
}
if (safety.warnings.length > 0) {
  console.warn('Safety warnings:', safety.warnings);
}
```

## Live Trading Checklist

Before enabling live trading:

1. ✅ Set `tradingMode: TradingMode.LIVE`
2. ✅ Set `riskAcknowledged: true`
3. ✅ Validate config with `isSafeForLiveTrading()`
4. ✅ Verify eToro API credentials are production (not demo)
5. ✅ Review position limits and loss caps
6. ✅ Test approval gate workflow
7. ✅ Verify kill switch triggers correctly
8. ✅ Start with small portfolio value for testing

## Integration Points

- **Rule Engine:** Passes candidate trades to risk enforcer for validation
- **Decision Layer:** Receives risk metrics as part of decision context
- **Audit Log:** Logs all risk checks, approvals, rejections, kill switch events
- **Server Orchestrator:** Enforces risk checks before trade execution
- **UI:** Displays risk metrics, approval queue, kill switch status

## Architecture Decision

See [ADR-002](../../docs/adr/002-risk-framework.md) for detailed rationale.
