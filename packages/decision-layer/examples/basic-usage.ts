/**
 * Example usage of the Decision Layer
 */

import { DecisionLayer, TradeSignal } from '../src';

async function example() {
  // Initialize decision layer
  const decisionLayer = new DecisionLayer({
    anthropic_api_key: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-sonnet-4-5',
    temperature: 0.3,
    default_risk_profile: 'conservative',
    data_sources: [
      { name: 'market_data', enabled: true },
      { name: 'news', enabled: false }, // Disabled until API integrated
      { name: 'sentiment', enabled: false }, // Disabled until API integrated
    ],
  });

  // Example trade signal from rule engine
  const tradeSignal: TradeSignal = {
    symbol: 'AAPL',
    action: 'BUY',
    quantity: 10,
    price: 175.5,
    rule_id: 'macd-crossover-aapl',
    technical_indicators: {
      macd_signal: 1.2,
      macd_histogram: 0.5,
      rsi: 45,
      volume_ratio: 1.3,
    },
    timestamp: new Date(),
  };

  // Evaluate with conservative risk profile (default)
  console.log('Evaluating trade signal (conservative)...');
  const evaluation = await decisionLayer.evaluateTradeSignal(tradeSignal);

  console.log('Decision:', evaluation.decision);
  console.log('Confidence:', evaluation.confidence);
  console.log('Reasoning:', evaluation.reasoning);
  console.log('Risk Factors:', evaluation.risk_factors);
  console.log('Supporting Evidence:', evaluation.supporting_evidence);

  // Evaluate with aggressive risk profile
  console.log('\nEvaluating same signal (aggressive)...');
  const aggressiveEval = await decisionLayer.evaluateTradeSignal(
    tradeSignal,
    'aggressive'
  );

  console.log('Decision:', aggressiveEval.decision);
  console.log('Confidence:', aggressiveEval.confidence);
  console.log('Reasoning:', aggressiveEval.reasoning);

  // Batch evaluation
  const signals: TradeSignal[] = [
    {
      symbol: 'GOOGL',
      action: 'BUY',
      quantity: 5,
      price: 140.0,
      timestamp: new Date(),
    },
    {
      symbol: 'MSFT',
      action: 'SELL',
      quantity: 15,
      price: 380.0,
      timestamp: new Date(),
    },
  ];

  console.log('\nBatch evaluation...');
  const batchResults = await decisionLayer.evaluateBatch(signals);

  batchResults.forEach((result, i) => {
    console.log(`\nSignal ${i + 1}:`, signals[i].symbol, signals[i].action);
    console.log('  Decision:', result.decision);
    console.log('  Confidence:', result.confidence);
  });
}

// Run example if executed directly
if (require.main === module) {
  example().catch(console.error);
}
