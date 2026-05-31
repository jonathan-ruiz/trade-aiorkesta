/**
 * @trade-aiorkesta/decision-layer
 *
 * AI-augmented decision layer for trade signal evaluation
 */

export { DecisionLayer } from './decision-layer';
export { ClaudeClient } from './claude-client';
export { DataAggregator } from './data-aggregator';
export {
  TradeSignal,
  TradeAction,
  DecisionOutcome,
  MarketContext,
  NewsItem,
  SentimentData,
  ExternalContext,
  AIEvaluationRequest,
  AIEvaluationResponse,
  DataSourceConfig,
  DecisionLayerConfig,
} from './types';
