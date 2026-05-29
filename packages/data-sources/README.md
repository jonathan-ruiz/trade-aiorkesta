# @trade-aiorkesta/data-sources

Pluggable external data sources for decision context.

## Responsibilities
- Abstract interface for external data providers
- Built-in sources: news APIs, sentiment analysis, technical indicators
- User-provided webhook sources
- Data freshness validation
- Rate limiting and caching

## Design
Each source implements a common interface:
```typescript
interface DataSource {
  fetch(symbol: string, window: TimeWindow): Promise<DataPoint[]>
  isHealthy(): Promise<boolean>
}
```

Decision layer queries sources on-demand. Sources must return data + timestamp + confidence.
