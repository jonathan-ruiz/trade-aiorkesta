import axios, { AxiosInstance } from 'axios';
import {
  ExternalContext,
  MarketContext,
  NewsItem,
  SentimentData,
  DataSourceConfig,
} from './types';

export class DataAggregator {
  private httpClient: AxiosInstance;
  private dataSources: Map<string, DataSourceConfig>;

  constructor(sources?: DataSourceConfig[]) {
    this.httpClient = axios.create({
      timeout: 5000,
    });
    this.dataSources = new Map();

    if (sources) {
      sources.forEach(source => {
        this.dataSources.set(source.name, source);
      });
    }
  }

  /**
   * Aggregate external context for a trade signal
   */
  async aggregateContext(symbol: string): Promise<ExternalContext> {
    const results = await Promise.allSettled([
      this.fetchMarketData(symbol),
      this.fetchNews(symbol),
      this.fetchSentiment(symbol),
    ]);

    const context: ExternalContext = {};

    if (results[0].status === 'fulfilled') {
      context.market_data = results[0].value;
    }

    if (results[1].status === 'fulfilled') {
      context.news = results[1].value;
    }

    if (results[2].status === 'fulfilled') {
      context.sentiment = results[2].value;
    }

    return context;
  }

  /**
   * Fetch current market data for a symbol
   * NOTE: Placeholder implementation - replace with actual eToro API integration
   */
  private async fetchMarketData(symbol: string): Promise<MarketContext | undefined> {
    const source = this.dataSources.get('market_data');
    if (!source || !source.enabled) {
      return undefined;
    }

    try {
      // Placeholder: In production, integrate with eToro client
      // For now, return mock data for development
      return {
        symbol,
        current_price: 100.0,
        bid: 99.95,
        ask: 100.05,
        volume_24h: 1000000,
        price_change_24h: 2.5,
        volatility: 0.15,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Failed to fetch market data for ${symbol}:`, error);
      return undefined;
    }
  }

  /**
   * Fetch recent news for a symbol
   * NOTE: Placeholder implementation - integrate with news API
   */
  private async fetchNews(symbol: string): Promise<NewsItem[] | undefined> {
    const source = this.dataSources.get('news');
    if (!source || !source.enabled) {
      return undefined;
    }

    try {
      // Placeholder: In production, integrate with NewsAPI, Alpha Vantage, etc.
      // For now, return empty array
      return [];
    } catch (error) {
      console.error(`Failed to fetch news for ${symbol}:`, error);
      return undefined;
    }
  }

  /**
   * Fetch sentiment data for a symbol
   * NOTE: Placeholder implementation - integrate with sentiment API
   */
  private async fetchSentiment(symbol: string): Promise<SentimentData | undefined> {
    const source = this.dataSources.get('sentiment');
    if (!source || !source.enabled) {
      return undefined;
    }

    try {
      // Placeholder: In production, integrate with sentiment analysis API
      // For now, return mock neutral sentiment
      return {
        symbol,
        overall_sentiment: 'neutral',
        confidence: 0.5,
        sources: ['social_media', 'news'],
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Failed to fetch sentiment for ${symbol}:`, error);
      return undefined;
    }
  }

  /**
   * Add or update a data source configuration
   */
  configureDataSource(source: DataSourceConfig): void {
    this.dataSources.set(source.name, source);
  }

  /**
   * Disable a data source
   */
  disableDataSource(name: string): void {
    const source = this.dataSources.get(name);
    if (source) {
      source.enabled = false;
    }
  }

  /**
   * Get all configured data sources
   */
  getDataSources(): DataSourceConfig[] {
    return Array.from(this.dataSources.values());
  }
}
