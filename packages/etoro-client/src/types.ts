/**
 * eToro API client types
 */

export interface EToroConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  demo?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AccountInfo {
  accountId: string;
  username: string;
  balance: number;
  currency: string;
  equity: number;
  availableToTrade: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
}

export interface Position {
  positionId: string;
  instrumentId: string;
  instrumentName: string;
  direction: 'long' | 'short';
  amount: number;
  openPrice: number;
  currentPrice: number;
  leverage: number;
  profit: number;
  profitPercentage: number;
  openTime: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface MarketData {
  instrumentId: string;
  instrumentName: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'price_update' | 'position_update' | 'account_update' | 'error';
  data: any;
  timestamp: string;
}

export interface WebSocketConfig {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}
