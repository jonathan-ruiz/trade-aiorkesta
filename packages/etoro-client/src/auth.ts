import axios, { AxiosInstance } from 'axios';
import { EToroConfig, AuthTokens } from './types';

/**
 * Handles eToro API authentication
 */
export class EToroAuth {
  private config: EToroConfig;
  private tokens: AuthTokens | null = null;
  private httpClient: AxiosInstance;

  constructor(config: EToroConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.baseUrl || 'https://api-portal.etoro.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with eToro API using API key and secret
   */
  async authenticate(): Promise<AuthTokens> {
    try {
      const response = await this.httpClient.post('/auth/token', {
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        demo: this.config.demo || false,
      });

      this.tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
      };

      return this.tokens;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available. Please authenticate first.');
    }

    try {
      const response = await this.httpClient.post('/auth/refresh', {
        refreshToken: this.tokens.refreshToken,
      });

      this.tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
      };

      return this.tokens;
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get current access token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    if (!this.tokens) {
      await this.authenticate();
    }

    // Refresh if token expires in less than 5 minutes
    if (this.tokens && this.tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }

    return this.tokens!.accessToken;
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.tokens !== null && this.tokens.expiresAt > Date.now();
  }

  /**
   * Revoke current authentication
   */
  async logout(): Promise<void> {
    if (this.tokens?.accessToken) {
      try {
        await this.httpClient.post('/auth/revoke', {
          token: this.tokens.accessToken,
        });
      } catch (error) {
        // Ignore errors on logout
      }
    }
    this.tokens = null;
  }
}
