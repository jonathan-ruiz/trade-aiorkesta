# @trade-aiorkesta/server

Central orchestrator service for autonomous trade execution.

## Overview

Coordinates trade flow across all modules:

```
Decision Layer → Rule Engine → Risk Manager → eToro Client → Audit Logger
```

## Architecture

### Event Loop

Runs on configurable interval (default: 5 minutes):

1. **Get signals:** Query decision layer for trade opportunities
2. **Evaluate rules:** Check if signals match user-configured rules
3. **Check risk:** Validate against position limits and loss caps
4. **Execute trades:** Place orders via eToro API (or paper trade)
5. **Audit log:** Record all decisions and executions

### State Machine

```
STOPPED → PAPER_TRADING → LIVE_TRADING
           ↓
         ERROR
```

### Circuit Breaker

Prevents cascading failures:
- Trips after N consecutive failures
- Half-open state for recovery testing
- Manual reset available

### Health Checks

Monitors all modules:
- Decision layer connectivity
- Rule engine status
- Risk manager state (kill switch, daily P&L)
- eToro API availability
- Audit database connectivity

## Configuration

Environment variables:

```bash
# Event loop
LOOP_INTERVAL_MS=300000          # 5 minutes
ORCHESTRATOR_ENABLED=true

# System state
SYSTEM_STATE=PAPER_TRADING       # STOPPED | PAPER_TRADING | LIVE_TRADING
TRADING_MODE=PAPER               # PAPER | LIVE
RISK_ACKNOWLEDGED=false

# Circuit breaker
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURES=5
CIRCUIT_BREAKER_SUCCESSES=2
CIRCUIT_BREAKER_TIMEOUT=60000    # 1 minute

# eToro API
ETORO_API_URL=https://api-portal.etoro.com
ETORO_API_KEY=your_key
ETORO_API_SECRET=your_secret
ETORO_PAPER_TRADING=true

# Database (audit log)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trade_aiorkesta
DB_USER=postgres
DB_PASSWORD=your_password
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t trade-aiorkesta .
docker run -p 3000:3000 --env-file .env trade-aiorkesta
```

## Module Integration

### Decision Layer

**Interface:** `IDecisionLayer`

```typescript
getSignals(): Promise<TradeSignal[]>
healthCheck(): Promise<HealthCheckResult>
```

**Current:** Stub implementation (returns no signals)  
**Future:** AI model + external data integration

### Rule Engine

**Interface:** `IRuleEngine`

```typescript
evaluateSignal(signal: TradeSignal): Promise<RuleEvaluation>
healthCheck(): Promise<HealthCheckResult>
```

**Current:** Stub implementation (auto-approves all)  
**Future:** User-configured technical rules

### Risk Manager

**Interface:** `IRiskManager`

```typescript
checkTrade(proposal: TradeProposal): Promise<RiskCheckResult>
healthCheck(): Promise<HealthCheckResult>
```

**Current:** Full implementation via `@trade-aiorkesta/risk-management`

### eToro Client

**Interface:** `IEToroClient`

```typescript
executeTrade(proposal: TradeProposal): Promise<TradeExecutionResult>
getPortfolioValue(): Promise<number>
getCurrentPositions(): Promise<Position[]>
healthCheck(): Promise<HealthCheckResult>
```

**Current:** Full implementation via `@trade-aiorkesta/etoro-client`  
**Paper trading:** Simulates executions, no real API calls

### Audit Logger

**Interface:** `IAuditLogger`

```typescript
log(event: AuditEvent): Promise<void>
healthCheck(): Promise<HealthCheckResult>
```

**Current:** Full implementation via `@trade-aiorkesta/audit`

## Safety Features

### Paper Trading Default

- Default mode: `PAPER_TRADING`
- Simulated executions only
- Real API calls for market data
- No real money at risk

### Kill Switch Integration

- Monitors risk manager kill switch status
- Halts trading if daily loss cap exceeded
- Requires manual restart after trigger

### Audit Trail

All events logged:
- Trade signals received
- Rule evaluations
- Risk checks
- Trade executions
- Configuration changes
- Health check failures

### Error Handling

- Circuit breaker prevents cascade failures
- Graceful degradation (continues on audit failures)
- Health checks before each cycle
- Uncaught exception handlers

## Monitoring

### Health Endpoint

```bash
GET /health
```

Returns:

```json
{
  "healthy": true,
  "components": {
    "decision-layer": { "healthy": true, "message": "..." },
    "rule-engine": { "healthy": true, "message": "..." },
    "risk-manager": { "healthy": true, "message": "..." },
    "etoro-client": { "healthy": true, "message": "..." },
    "audit-logger": { "healthy": true, "message": "..." }
  },
  "lastCheck": "2026-05-30T12:00:00Z"
}
```

### Cycle Metrics

Each cycle logs:
- Signals processed
- Trades executed
- Trades rejected
- Trades queued for approval
- Duration (ms)
- Errors

## Deployment

See [deployment runbook](../../docs/runbooks/deployment.md) for:
- Container setup
- Database migrations
- Environment configuration
- Monitoring setup
- Rollback procedures

## Architecture Decision

See [ADR-003](../../docs/adr/003-orchestrator-design.md) for detailed rationale.
