import { ClaudeClient } from './claude-client';
import { DataAggregator } from './data-aggregator';
import {
  DecisionLayerConfig,
  TradeSignal,
  AIEvaluationResponse,
  AIEvaluationRequest,
} from './types';

export class DecisionLayer {
  private claudeClient: ClaudeClient;
  private dataAggregator: DataAggregator;
  private defaultRiskProfile: 'conservative' | 'moderate' | 'aggressive';

  constructor(config: DecisionLayerConfig) {
    this.claudeClient = new ClaudeClient({
      apiKey: config.anthropic_api_key,
      model: config.model,
      maxTokens: config.max_tokens,
      temperature: config.temperature,
    });

    this.dataAggregator = new DataAggregator(config.data_sources);
    this.defaultRiskProfile = config.default_risk_profile || 'conservative';
  }

  /**
   * Evaluate a trade signal with AI-augmented decision making
   *
   * This is the main entry point for the decision layer.
   * It aggregates external context and uses Claude AI to evaluate
   * whether the trade should be approved, rejected, or deferred.
   */
  async evaluateTradeSignal(
    tradeSignal: TradeSignal,
    riskProfile?: 'conservative' | 'moderate' | 'aggressive'
  ): Promise<AIEvaluationResponse> {
    // Aggregate external context
    const externalContext = await this.dataAggregator.aggregateContext(
      tradeSignal.symbol
    );

    // Build evaluation request
    const request: AIEvaluationRequest = {
      trade_signal: tradeSignal,
      external_context: externalContext,
      user_risk_profile: riskProfile || this.defaultRiskProfile,
    };

    // Get AI evaluation
    const evaluation = await this.claudeClient.evaluateTradeSignal(request);

    return evaluation;
  }

  /**
   * Batch evaluate multiple trade signals
   */
  async evaluateBatch(
    tradeSignals: TradeSignal[],
    riskProfile?: 'conservative' | 'moderate' | 'aggressive'
  ): Promise<AIEvaluationResponse[]> {
    const evaluations = await Promise.all(
      tradeSignals.map(signal =>
        this.evaluateTradeSignal(signal, riskProfile)
      )
    );

    return evaluations;
  }

  /**
   * Get the data aggregator instance for configuration
   */
  getDataAggregator(): DataAggregator {
    return this.dataAggregator;
  }
}
