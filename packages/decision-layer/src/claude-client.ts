import Anthropic from '@anthropic-ai/sdk';
import {
  AIEvaluationRequest,
  AIEvaluationResponse,
  DecisionOutcome,
} from './types';

export class ClaudeClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-sonnet-4-5';
    this.maxTokens = config.maxTokens || 2048;
    this.temperature = config.temperature || 0.3; // Conservative default
  }

  /**
   * Evaluate a trade signal using Claude AI
   */
  async evaluateTradeSignal(
    request: AIEvaluationRequest
  ): Promise<AIEvaluationResponse> {
    const prompt = this.buildPrompt(request);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: this.getSystemPrompt(request.user_risk_profile || 'conservative'),
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseResponse(content.text, this.model);
  }

  private getSystemPrompt(riskProfile: 'conservative' | 'moderate' | 'aggressive'): string {
    const basePrompt = `You are a professional trading analyst evaluating trade signals for an automated trading system.

Your role is to apply judgment and context to rule-based trade signals. You MUST:
- Consider broader market conditions, news, and sentiment
- Identify risk factors and red flags
- Be conservative - err on the side of rejecting risky trades
- Provide clear, actionable reasoning
- Output structured JSON only

Risk profile: ${riskProfile.toUpperCase()}`;

    const riskGuidance = {
      conservative: `
- Reject trades with ANY significant red flags
- Require strong supporting evidence across multiple sources
- Defer when confidence is below 0.7
- Prioritize capital preservation over profit`,

      moderate: `
- Balance risk and opportunity
- Require moderate supporting evidence
- Defer when confidence is below 0.5
- Accept calculated risks with clear rationale`,

      aggressive: `
- Accept higher risk for higher potential returns
- Require basic supporting evidence
- Defer when confidence is below 0.3
- Be willing to trade in volatile conditions`,
    };

    return basePrompt + '\n\n' + riskGuidance[riskProfile];
  }

  private buildPrompt(request: AIEvaluationRequest): string {
    const { trade_signal, external_context } = request;

    let prompt = `Evaluate this trade signal:\n\n`;
    prompt += `**Trade Signal:**\n`;
    prompt += `- Symbol: ${trade_signal.symbol}\n`;
    prompt += `- Action: ${trade_signal.action}\n`;
    prompt += `- Quantity: ${trade_signal.quantity}\n`;
    prompt += `- Price: $${trade_signal.price}\n`;

    if (trade_signal.rule_id) {
      prompt += `- Rule: ${trade_signal.rule_id}\n`;
    }

    if (trade_signal.technical_indicators) {
      prompt += `\n**Technical Indicators:**\n`;
      for (const [key, value] of Object.entries(trade_signal.technical_indicators)) {
        prompt += `- ${key}: ${value}\n`;
      }
    }

    if (external_context.market_data) {
      const md = external_context.market_data;
      prompt += `\n**Market Data:**\n`;
      prompt += `- Current Price: $${md.current_price}\n`;
      prompt += `- Bid/Ask: $${md.bid} / $${md.ask}\n`;
      if (md.volume_24h) prompt += `- 24h Volume: ${md.volume_24h}\n`;
      if (md.price_change_24h) prompt += `- 24h Change: ${md.price_change_24h}%\n`;
      if (md.volatility) prompt += `- Volatility: ${md.volatility}\n`;
    }

    if (external_context.news && external_context.news.length > 0) {
      prompt += `\n**Recent News:**\n`;
      external_context.news.slice(0, 5).forEach((item, i) => {
        prompt += `${i + 1}. ${item.title} (${item.source})\n`;
        prompt += `   ${item.summary}\n`;
        if (item.sentiment) prompt += `   Sentiment: ${item.sentiment}\n`;
      });
    }

    if (external_context.sentiment) {
      const s = external_context.sentiment;
      prompt += `\n**Market Sentiment:**\n`;
      prompt += `- Overall: ${s.overall_sentiment} (confidence: ${s.confidence})\n`;
      prompt += `- Sources: ${s.sources.join(', ')}\n`;
    }

    prompt += `\n**Required Output Format (JSON):**\n`;
    prompt += `{
  "decision": "APPROVE" | "REJECT" | "DEFER",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of decision",
  "risk_factors": ["factor1", "factor2", ...],
  "supporting_evidence": ["evidence1", "evidence2", ...]
}`;

    return prompt;
  }

  private parseResponse(text: string, model: string): AIEvaluationResponse {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate decision
    const validDecisions: DecisionOutcome[] = ['APPROVE', 'REJECT', 'DEFER'];
    if (!validDecisions.includes(parsed.decision)) {
      throw new Error(`Invalid decision: ${parsed.decision}`);
    }

    // Validate confidence
    if (parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error(`Invalid confidence: ${parsed.confidence}`);
    }

    return {
      decision: parsed.decision,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning || '',
      risk_factors: parsed.risk_factors || [],
      supporting_evidence: parsed.supporting_evidence || [],
      model_used: model,
      timestamp: new Date(),
    };
  }
}
