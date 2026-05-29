/**
 * Basic Usage Example
 *
 * Demonstrates risk enforcer workflow
 */

import {
  RiskEnforcer,
  createDailyState,
  DEFAULT_RISK_CONFIG,
  TradingMode,
  TradeProposal,
} from '../src';

// Initialize with default config
const config = DEFAULT_RISK_CONFIG;
const dailyState = createDailyState(10000); // $10k starting balance
const enforcer = new RiskEnforcer(config, dailyState);

// Example trade proposal
const proposal: TradeProposal = {
  symbol: 'AAPL',
  amount: 500, // $500 trade
  side: 'BUY',
  price: 150,
  portfolioValue: 10000,
  currentPositions: [],
};

// Check if trade is allowed
const result = enforcer.checkTrade(proposal);

console.log('Trade check result:', {
  allowed: result.allowed,
  requiresApproval: result.requiresApproval,
  rejectionReasons: result.rejectionReasons,
  warnings: result.warnings,
  metrics: result.metrics,
});

if (!result.allowed) {
  console.error('❌ Trade rejected:', result.rejectionReasons);
} else if (result.requiresApproval) {
  console.log('⏸️  Trade requires approval:', result.warnings);
  // Queue for manual review in UI
} else {
  console.log('✅ Trade approved');
  // Execute trade
  // After execution, update daily state:
  enforcer.updateDailyState(-50, true); // Lost $50, trade succeeded
}

// Get current metrics
console.log('Current risk metrics:', enforcer.getDailyState());
