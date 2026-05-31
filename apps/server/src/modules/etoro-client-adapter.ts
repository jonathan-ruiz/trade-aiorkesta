/**
 * eToro Client Adapter
 *
 * Adapts @trade-aiorkesta/etoro-client to orchestrator interface
 */

import { EToroRestClient } from '../../../../packages/etoro-client/src/rest-client';
import type { TradeProposal } from '../../../../packages/risk-management/src/types';
import type { IEToroClient, TradeExecutionResult, HealthCheckResult, EToroConfig } from '../types';

export class EToroClientAdapter implements IEToroClient {
  private client: EToroRestClient;
  private paperTrading: boolean;

  constructor(config: EToroConfig) {
    this.client = new EToroRestClient(
      config.apiBaseUrl,
      config.apiKey,
      config.apiSecret
    );
    this.paperTrading = config.paperTrading;
  }

  async executeTrade(proposal: TradeProposal): Promise<TradeExecutionResult> {
    try {
      if (this.paperTrading) {
        // Paper trade - simulate execution
        console.log(
          `[PaperTrade] Simulated ${proposal.side} ${proposal.symbol} ` +
            `amount: ${proposal.amount}`
        );

        return {
          success: true,
          tradeId: `paper-${Date.now()}`,
          executionPrice: proposal.price || 100, // Mock price
          executionTimestamp: new Date(),
        };
      }

      // Real trade execution
      const order = await this.client.placeOrder({
        symbol: proposal.symbol,
        side: proposal.side.toLowerCase() as 'buy' | 'sell',
        amount: proposal.amount,
        type: 'market',
      });

      return {
        success: true,
        tradeId: order.orderId,
        executionPrice: order.executionPrice,
        executionTimestamp: new Date(order.timestamp),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMsg,
        errorCode: 'EXECUTION_ERROR',
      };
    }
  }

  async getPortfolioValue(): Promise<number> {
    try {
      const account = await this.client.getAccountInfo();
      return account.equity;
    } catch (error) {
      console.error('[EToroClient] Failed to get portfolio value:', error);
      return 10000; // Fallback default
    }
  }

  async getCurrentPositions(): Promise<any[]> {
    try {
      return await this.client.getPositions();
    } catch (error) {
      console.error('[EToroClient] Failed to get positions:', error);
      return [];
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      await this.client.getAccountInfo();
      const responseTime = Date.now() - start;

      return {
        component: 'etoro-client',
        healthy: true,
        message: `Connected to eToro API (${this.paperTrading ? 'PAPER' : 'LIVE'} mode)`,
        lastCheck: new Date(),
        responseTime,
        metrics: {
          paperTrading: this.paperTrading,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        component: 'etoro-client',
        healthy: false,
        message: `eToro API error: ${errorMsg}`,
        lastCheck: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }
}
