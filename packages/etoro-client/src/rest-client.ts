import axios, { AxiosInstance } from 'axios';
import { EToroAuth } from './auth';
import { EToroConfig, AccountInfo, Position, MarketData } from './types';

/**
 * REST API client for eToro
 */
export class EToroRestClient {
  private auth: EToroAuth;
  private httpClient: AxiosInstance;
  private baseUrl: string;

  constructor(config: EToroConfig) {
    this.auth = new EToroAuth(config);
    this.baseUrl = config.baseUrl || 'https://api-portal.etoro.com';
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to inject auth token
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.auth.getValidToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const response = await this.httpClient.get('/api/v1/account');
      return {
        accountId: response.data.account_id,
        username: response.data.username,
        balance: response.data.balance,
        currency: response.data.currency,
        equity: response.data.equity,
        availableToTrade: response.data.available_to_trade,
        usedMargin: response.data.used_margin,
        freeMargin: response.data.free_margin,
        marginLevel: response.data.margin_level,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch account info: ${error.message}`);
    }
  }

  /**
   * Get all open positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.httpClient.get('/api/v1/positions');
      return response.data.positions.map((pos: any) => ({
        positionId: pos.position_id,
        instrumentId: pos.instrument_id,
        instrumentName: pos.instrument_name,
        direction: pos.direction,
        amount: pos.amount,
        openPrice: pos.open_price,
        currentPrice: pos.current_price,
        leverage: pos.leverage,
        profit: pos.profit,
        profitPercentage: pos.profit_percentage,
        openTime: pos.open_time,
        stopLoss: pos.stop_loss,
        takeProfit: pos.take_profit,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }
  }

  /**
   * Get market data for a specific instrument
   */
  async getMarketData(instrumentId: string): Promise<MarketData> {
    try {
      const response = await this.httpClient.get(`/api/v1/market/${instrumentId}`);
      return {
        instrumentId: response.data.instrument_id,
        instrumentName: response.data.instrument_name,
        bid: response.data.bid,
        ask: response.data.ask,
        spread: response.data.spread,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
  }

  /**
   * Get market data for multiple instruments
   */
  async getMultipleMarketData(instrumentIds: string[]): Promise<MarketData[]> {
    try {
      const response = await this.httpClient.post('/api/v1/market/batch', {
        instruments: instrumentIds,
      });
      return response.data.markets.map((market: any) => ({
        instrumentId: market.instrument_id,
        instrumentName: market.instrument_name,
        bid: market.bid,
        ask: market.ask,
        spread: market.spread,
        timestamp: market.timestamp,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch multiple market data: ${error.message}`);
    }
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Manually authenticate (usually handled automatically)
   */
  async authenticate(): Promise<void> {
    await this.auth.getValidToken();
  }

  /**
   * Logout and revoke tokens
   */
  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
