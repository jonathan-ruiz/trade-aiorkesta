import WebSocket from 'ws';
import { EToroAuth } from './auth';
import { EToroConfig, WebSocketConfig, WebSocketMessage } from './types';

/**
 * WebSocket client for real-time eToro data
 */
export class EToroWebSocketClient {
  private auth: EToroAuth;
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(etoroConfig: EToroConfig, wsConfig: WebSocketConfig = {}) {
    this.auth = new EToroAuth(etoroConfig);
    this.wsUrl = wsConfig.url || 'wss://stream.etoro.com';
    this.config = {
      reconnect: wsConfig.reconnect ?? true,
      reconnectInterval: wsConfig.reconnectInterval || 5000,
      maxReconnectAttempts: wsConfig.maxReconnectAttempts || 10,
    };
  }

  /**
   * Connect to WebSocket stream
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await this.auth.getValidToken();
      const url = `${this.wsUrl}?token=${token}`;

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', null);
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.emit('error', { error: 'Failed to parse message', data });
        }
      });

      this.ws.on('close', () => {
        this.isConnecting = false;
        this.emit('disconnected', null);
        if (this.config.reconnect) {
          this.attemptReconnect();
        }
      });

      this.ws.on('error', (error) => {
        this.isConnecting = false;
        this.emit('error', { error: error.message });
      });
    } catch (error: any) {
      this.isConnecting = false;
      throw new Error(`Failed to connect to WebSocket: ${error.message}`);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    this.emit(message.type, message.data);
    this.emit('message', message);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      this.emit('error', { error: 'Max reconnect attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.emit('error', { error: `Reconnect failed: ${error.message}` });
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Subscribe to price updates for instruments
   */
  subscribe(instrumentIds: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      action: 'subscribe',
      instruments: instrumentIds,
    }));
  }

  /**
   * Unsubscribe from price updates
   */
  unsubscribe(instrumentIds: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      action: 'unsubscribe',
      instruments: instrumentIds,
    }));
  }

  /**
   * Register event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.config.reconnect = false; // Prevent auto-reconnect
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
