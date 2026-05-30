/**
 * Type definitions for the AI decision layer
 */

export type TradeAction = 'BUY' | 'SELL' | 'HOLD';

export type DecisionOutcome = 'APPROVE' | 'REJECT' | 'DEFER';

export interface TradeSignal {
  symbol: string;
  action: TradeAction;
  quantity: number;
  price: number;
  rule_id?: string;
  technical_indicators?: Record<string, number>;
  timestamp: Date;
}

export interface MarketContext {
  symbol: string;
  current_price: number;
  bid: number;
  ask: number;
  volume_24h?: number;
  price_change_24h?: number;
  volatility?: number;
  timestamp: Date;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  published_at: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevance_score?: number;
}

export interface SentimentData {
  symbol: string;
  overall_sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  sources: string[];
  timestamp: Date;
}

export interface ExternalContext {
  market_data?: MarketContext;
  news?: NewsItem[];
  sentiment?: SentimentData;
  macro_indicators?: Record<string, number>;
}

export interface AIEvaluationRequest {
  trade_signal: TradeSignal;
  external_context: ExternalContext;
  user_risk_profile?: 'conservative' | 'moderate' | 'aggressive';
}

export interface AIEvaluationResponse {
  decision: DecisionOutcome;
  confidence: number; // 0-1
  reasoning: string;
  risk_factors: string[];
  supporting_evidence: string[];
  model_used: string;
  timestamp: Date;
}

export interface DataSourceConfig {
  name: string;
  enabled: boolean;
  api_key?: string;
  timeout_ms?: number;
}

export interface DecisionLayerConfig {
  anthropic_api_key: string;
  model?: string; // Default: claude-sonnet-4-5
  max_tokens?: number;
  temperature?: number;
  data_sources?: DataSourceConfig[];
  default_risk_profile?: 'conservative' | 'moderate' | 'aggressive';
}
