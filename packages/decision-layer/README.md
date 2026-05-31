# @trade-aiorkesta/decision-layer

AI-augmented decision layer for trade signal evaluation using Claude AI.

## Features

- **Claude AI Integration**: Uses Claude Sonnet 4.5 for intelligent trade evaluation
- **Context Aggregation**: Fetches market data, news, and sentiment
- **Risk-Aware**: Configurable risk profiles (conservative/moderate/aggressive)
- **Structured Output**: Decision + confidence + reasoning + risk factors
- **Batch Processing**: Evaluate multiple trade signals efficiently

## Installation

```bash
npm install @trade-aiorkesta/decision-layer
```

## Usage

### Basic Evaluation

```typescript
import { DecisionLayer, TradeSignal } from '@trade-aiorkesta/decision-layer';

const decisionLayer = new DecisionLayer({
  anthropic_api_key: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-5',
  temperature: 0.3, // Conservative
  default_risk_profile: 'conservative',
});

const tradeSignal: TradeSignal = {
  symbol: 'AAPL',
  action: 'BUY',
  quantity: 10,
  price: 175.5,
  rule_id: 'macd-crossover-aapl',
  technical_indicators: {
    macd_signal: 1.2,
    rsi: 45,
  },
  timestamp: new Date(),
};

const evaluation = await decisionLayer.evaluateTradeSignal(tradeSignal);

console.log('Decision:', evaluation.decision); // APPROVE | REJECT | DEFER
console.log('Confidence:', evaluation.confidence); // 0-1
console.log('Reasoning:', evaluation.reasoning);
console.log('Risk Factors:', evaluation.risk_factors);
```

### Risk Profiles

```typescript
// Conservative: Prioritizes capital preservation
await decisionLayer.evaluateTradeSignal(signal, 'conservative');

// Moderate: Balanced risk/reward
await decisionLayer.evaluateTradeSignal(signal, 'moderate');

// Aggressive: Higher risk tolerance
await decisionLayer.evaluateTradeSignal(signal, 'aggressive');
```

### Batch Evaluation

```typescript
const signals: TradeSignal[] = [
  { symbol: 'GOOGL', action: 'BUY', quantity: 5, price: 140.0, timestamp: new Date() },
  { symbol: 'MSFT', action: 'SELL', quantity: 15, price: 380.0, timestamp: new Date() },
];

const results = await decisionLayer.evaluateBatch(signals);
```

## Architecture

```
Rule Engine → Trade Signal
                ↓
         Decision Layer
          ↓         ↓
   Data Aggregator  Claude AI
   (market/news)    (evaluate)
          ↓         ↓
         AI Evaluation Response
         (APPROVE/REJECT/DEFER)
                ↓
         Risk Enforcer → Execute
```

## API Reference

### DecisionLayer

- `evaluateTradeSignal(signal, riskProfile?)`: Evaluate single trade signal
- `evaluateBatch(signals, riskProfile?)`: Evaluate multiple signals
- `getDataAggregator()`: Access data aggregator for config

### TradeSignal

```typescript
{
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity: number;
  price: number;
  rule_id?: string;
  technical_indicators?: Record<string, number>;
  timestamp: Date;
}
```

### AIEvaluationResponse

```typescript
{
  decision: 'APPROVE' | 'REJECT' | 'DEFER';
  confidence: number; // 0-1
  reasoning: string;
  risk_factors: string[];
  supporting_evidence: string[];
  model_used: string;
  timestamp: Date;
}
```

## Configuration

```typescript
interface DecisionLayerConfig {
  anthropic_api_key: string;
  model?: string; // Default: claude-sonnet-4-5
  max_tokens?: number; // Default: 2048
  temperature?: number; // Default: 0.3
  data_sources?: DataSourceConfig[];
  default_risk_profile?: 'conservative' | 'moderate' | 'aggressive';
}
```

## Integration Points

- **Consumes**: Trade signals from rule-engine
- **Produces**: AI evaluations for risk-enforcer
- **Data Sources**: Market data, news APIs, sentiment analysis
- **Audit**: Logs all decisions via audit package

## Security

- API keys stored in environment variables
- No credentials logged
- Rate limiting via Anthropic SDK
- Error handling with fallback to DEFER

## License

MIT
