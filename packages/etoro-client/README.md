# @trade-aiorkesta/etoro-client

REST + WebSocket SDK for eToro API at api-portal.etoro.com.

## Features

- **Authentication**: API key/secret auth with automatic token refresh
- **REST API**: Account info, positions, market data endpoints
- **WebSocket**: Real-time price updates and position changes
- **TypeScript**: Full type definitions included

## Installation

```bash
npm install @trade-aiorkesta/etoro-client
```

## Usage

### REST Client

```typescript
import { EToroRestClient } from '@trade-aiorkesta/etoro-client';

const client = new EToroRestClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  demo: true, // Use demo account
});

// Get account info
const account = await client.getAccountInfo();
console.log('Balance:', account.balance);

// Get open positions
const positions = await client.getPositions();
console.log('Open positions:', positions.length);

// Get market data
const market = await client.getMarketData('AAPL');
console.log('AAPL bid:', market.bid, 'ask:', market.ask);
```

### WebSocket Client

```typescript
import { EToroWebSocketClient } from '@trade-aiorkesta/etoro-client';

const ws = new EToroWebSocketClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  demo: true,
});

// Listen to events
ws.on('connected', () => {
  console.log('WebSocket connected');
  ws.subscribe(['AAPL', 'GOOGL', 'MSFT']);
});

ws.on('price_update', (data) => {
  console.log('Price update:', data);
});

ws.on('position_update', (data) => {
  console.log('Position changed:', data);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Connect
await ws.connect();
```

## Configuration

```typescript
interface EToroConfig {
  apiKey: string;        // eToro API key
  apiSecret: string;     // eToro API secret
  baseUrl?: string;      // API base URL (default: https://api-portal.etoro.com)
  demo?: boolean;        // Use demo account (default: false)
}
```

## API Reference

### REST Client

- `getAccountInfo()`: Fetch account balance, equity, margin
- `getPositions()`: List all open positions
- `getMarketData(instrumentId)`: Get current market prices
- `getMultipleMarketData(instrumentIds[])`: Batch fetch market data
- `isAuthenticated()`: Check auth status
- `logout()`: Revoke tokens

### WebSocket Client

- `connect()`: Open WebSocket connection
- `disconnect()`: Close connection
- `subscribe(instrumentIds[])`: Subscribe to price updates
- `unsubscribe(instrumentIds[])`: Unsubscribe
- `on(event, callback)`: Register event listener
- `off(event, callback)`: Remove listener
- `isConnected()`: Check connection status

### Events

- `connected`: WebSocket connection established
- `disconnected`: WebSocket closed
- `price_update`: Real-time price data
- `position_update`: Position changed
- `account_update`: Account balance changed
- `error`: Error occurred
- `message`: Raw WebSocket message

## Security

- Tokens auto-refresh before expiry
- API credentials never logged
- Use demo account for testing
- Paper-trading recommended before real-money

## License

MIT
