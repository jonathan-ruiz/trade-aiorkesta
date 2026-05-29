/**
 * Example usage of the AuditWriter
 */

import { AuditWriter } from './writer';

async function example() {
  // Initialize the writer
  const writer = new AuditWriter(process.env.DATABASE_URL);

  // Log a rule evaluation
  const ruleEvalEntry = await writer.logDecision({
    event_type: 'RULE_EVAL',
    rule_id: 'macd-crossover-btc',
    data_inputs: {
      symbol: 'BTCUSD',
      price: 42000,
      macd: { signal: 120, histogram: 50 },
      timestamp: new Date().toISOString(),
    },
    decision: 'BUY_SIGNAL',
    executed: false,
  });

  console.log('Rule evaluation logged:', ruleEvalEntry.id);

  // Log an AI decision
  const decisionEntry = await writer.logDecision({
    event_type: 'DECISION_MADE',
    rule_id: 'macd-crossover-btc',
    data_inputs: {
      symbol: 'BTCUSD',
      price: 42000,
      candidate_trade: { action: 'BUY', quantity: 0.5 },
    },
    ai_eval: {
      model: 'gpt-4',
      reasoning: 'Market sentiment is positive, recent news favorable, technical indicators align.',
      confidence: 0.85,
      sources: ['news-api', 'sentiment-analyzer', 'technical-indicators'],
    },
    decision: 'APPROVED',
    executed: false,
  });

  console.log('AI decision logged:', decisionEntry.id);

  // Log a trade execution
  const tradeEntry = await writer.logDecision({
    event_type: 'TRADE_EXECUTED',
    rule_id: 'macd-crossover-btc',
    data_inputs: {
      symbol: 'BTCUSD',
      action: 'BUY',
      quantity: 0.5,
      price: 42000,
      order_id: 'etoro-12345',
    },
    decision: 'EXECUTED',
    executed: true,
  });

  console.log('Trade execution logged:', tradeEntry.id);

  // Log a failed execution
  const failedEntry = await writer.logDecision({
    event_type: 'TRADE_EXECUTED',
    rule_id: 'macd-crossover-eth',
    data_inputs: {
      symbol: 'ETHUSD',
      action: 'SELL',
      quantity: 1.0,
      price: 2200,
    },
    decision: 'FAILED',
    executed: false,
    error: 'Insufficient balance',
  });

  console.log('Failed trade logged:', failedEntry.id);

  // Query recent decisions
  const recentDecisions = await writer.query({
    event_type: 'DECISION_MADE',
    limit: 10,
  });

  console.log(`Found ${recentDecisions.length} recent decisions`);

  // Verify entry integrity
  const verification = await writer.verifyEntry(decisionEntry.id);
  console.log('Entry valid:', verification.valid);

  // Get statistics
  const stats = await writer.getStats();
  console.log('Audit log stats:', stats);

  // Clean up
  await writer.close();
}

// Run example if executed directly
if (require.main === module) {
  example().catch(console.error);
}
