# @trade-aiorkesta/etoro-client

REST + WebSocket client for eToro API (api-portal.etoro.com).

## Responsibilities
- Authentication flow (API key management)
- Account information endpoints
- Position/portfolio data
- Market data subscription
- Trade execution (buy/sell orders)
- WebSocket connection for real-time updates

## Safety
- Validates API credentials before any trade operation
- Enforces paper-trading mode flag
- Logs all API calls for audit
