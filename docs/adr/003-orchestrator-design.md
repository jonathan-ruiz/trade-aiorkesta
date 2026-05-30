# ADR-003: Orchestrator Design

**Status:** Accepted  
**Date:** 2026-05-30  
**Author:** Sam (Solution Architect)

## Context

ADR-001 established package structure and safety principles. ADR-002 defined risk framework. Now need central service to coordinate execution flow across all modules.

Requirements:
1. **Integrate modules:** decision-layer, rule-engine, risk-management, etoro-client, audit
2. **Event loop:** Periodic polling for trade opportunities
3. **Error handling:** Graceful degradation, circuit breaker pattern
4. **Health monitoring:** Verify all modules operational
5. **Configuration management:** Environment-driven, hot-reloadable
6. **Paper-trading default:** Safe mode until user opts in
7. **Audit trail:** Log all decisions and executions

Constraints:
- Real-money consequences demand defensive orchestration
- AI/decision-layer latency unpredictable
- External eToro API may be slow/unreliable
- Database failures shouldn't halt trading
- Must support gradual module rollout (stubs for unimplemented)

## Decision

### 1. Dependency Injection Architecture

Orchestrator accepts module interfaces at construction:

```typescript
interface IDecisionLayer { getSignals(), healthCheck() }
interface IRuleEngine { evaluateSignal(), healthCheck() }
interface IRiskManager { checkTrade(), healthCheck() }
interface IEToroClient { executeTrade(), getPortfolioValue(), ... }
interface IAuditLogger { log(), healthCheck() }
```

**Why dependency injection?**
- Modules independently testable (mock implementations)
- Gradual rollout: stub unfinished modules
- Clear contracts between layers
- No tight coupling to implementations

**Adapters wrap existing packages:**
- `RiskManagerAdapter` → wraps `@trade-aiorkesta/risk-management`
- `EToroClientAdapter` → wraps `@trade-aiorkesta/etoro-client`
- `AuditLoggerAdapter` → wraps `@trade-aiorkesta/audit`

**Stubs for incomplete modules:**
- `DecisionLayerStub` → returns empty signals (until #13 ships)
- `RuleEngineStub` → auto-approves all (until rules package ready)

### 2. Event Loop with Configurable Interval

```typescript
async executeCycle():
  1. getSignals() from decision layer
  2. for each signal:
     a. evaluateSignal() via rule engine
     b. checkTrade() via risk manager
     c. executeTrade() via eToro client
     d. log() to audit
  3. schedule next cycle
```

Default interval: **5 minutes** (300,000ms)  
Configurable via `LOOP_INTERVAL_MS` env var

**Why polling over event-driven?**
- Simple: no complex pub/sub infrastructure
- Predictable: fixed cadence easier to monitor
- Rate-limited: avoids API abuse
- Matches trading frequency (high-frequency not goal)

**Trade-off:** Latency between signal generation and execution  
**Mitigation:** Interval tunable down to 1 minute for faster strategies

### 3. Circuit Breaker Pattern

Wraps decision-layer calls (most likely to fail):

```typescript
CircuitBreaker states:
  CLOSED → normal operation
  OPEN → reject requests, service unavailable
  HALF_OPEN → testing recovery

Transitions:
  CLOSED → OPEN: failureCount >= threshold
  OPEN → HALF_OPEN: timeout expired
  HALF_OPEN → CLOSED: successCount >= threshold
  HALF_OPEN → OPEN: any failure
```

Default config:
- Failure threshold: 5
- Success threshold: 2
- Timeout: 60 seconds

**Why circuit breaker?**
- Prevents cascade failures (bad decision-layer → all cycles fail → audit overflow)
- Fast-fail instead of wait-timeout
- Auto-recovery testing
- Industry-standard resilience pattern

**What about other modules?**
- Rule engine: deterministic, rarely fails → no breaker needed
- Risk manager: pure logic, no I/O → no breaker needed
- eToro client: already retries internally → redundant
- Audit logger: graceful degradation (log failures, continue trading)

### 4. Health Check System

**Periodic checks** (default: 1 minute interval):
```typescript
healthCheck() each module:
  - decision-layer: connectivity to AI service
  - rule-engine: rules loaded, no corruption
  - risk-manager: kill switch status, daily P&L
  - etoro-client: API reachable, auth valid
  - audit-logger: database connection alive
```

**Pre-cycle check:**  
Before each trading cycle, verify `systemHealth.healthy === true`

**Why periodic + pre-cycle?**
- Periodic: early warning of degradation
- Pre-cycle: fail-fast before executing trades
- Combined: balance responsiveness vs overhead

**Health check failures:**
- Single module unhealthy → log warning, continue (graceful degradation)
- All modules unhealthy → refuse to start
- Kill switch active → halt trading, require manual restart

### 5. Configuration Management

**Environment-driven:**  
All config from env vars (12-factor app pattern)

**No hardcoded secrets:**  
API keys, DB passwords from environment only

**Validation on startup:**  
`validateConfig()` ensures:
- Live trading requires risk acknowledgement
- Live trading requires eToro credentials
- Loop interval >= 1 second
- Database password present

**Hot-reload:**  
`orchestrator.updateConfig(updates)` allows runtime changes (no restart)

**Why environment-driven?**
- Docker/Kubernetes native
- Secrets management (vault, k8s secrets)
- Config per environment (dev/staging/prod)
- No config files in git (security)

### 6. Graceful Degradation

**Audit failures don't stop trading:**

```typescript
try {
  await auditLogger.log(event)
} catch {
  console.error('Audit failed')
  // Continue - don't block trade execution
}
```

**Why continue on audit failure?**
- Audit important for compliance, NOT for execution
- Database outage shouldn't halt profitable trading
- Logs still go to console (recovery possible)

**Trade-off:** Lost audit events  
**Mitigation:** Monitor audit health, alert on failures

### 7. State Machine

```
STOPPED → user must start orchestrator
PAPER_TRADING → default, simulated trades
LIVE_TRADING → opt-in, real money
ERROR → manual intervention required
```

**Transitions:**
- STOPPED → PAPER_TRADING: `orchestrator.start()`
- PAPER_TRADING → LIVE_TRADING: user sets `TRADING_MODE=LIVE` + `RISK_ACKNOWLEDGED=true`
- Any → ERROR: unrecoverable failure (e.g., all health checks fail)
- ERROR → STOPPED: manual reset

**Why state machine?**
- Clear lifecycle management
- Explicit transitions (no ambiguous states)
- Safety: can't accidentally enter live trading
- Audit: all state changes logged

## Implementation Details

### Module Structure

```
apps/server/src/
  types.ts              # Interfaces, enums, type definitions
  orchestrator.ts       # Core Orchestrator class
  circuit-breaker.ts    # Circuit breaker implementation
  config.ts             # Config loading and validation
  index.ts              # Entry point, startup logic
  modules/
    decision-layer-stub.ts      # Stub until #13 ships
    rule-engine-stub.ts         # Stub until rules package ready
    risk-manager-adapter.ts     # Wraps @trade-aiorkesta/risk-management
    etoro-client-adapter.ts     # Wraps @trade-aiorkesta/etoro-client
    audit-logger-adapter.ts     # Wraps @trade-aiorkesta/audit
```

### Startup Sequence

1. Load config from environment
2. Validate config (fail fast on errors)
3. Initialize modules (stubs + adapters)
4. Initialize audit logger (database connection)
5. Create orchestrator with modules
6. Run initial health check
7. Start event loop
8. Start health check loop

### Shutdown Sequence

1. Receive SIGINT/SIGTERM
2. Stop event loop (no new cycles)
3. Wait for current cycle to complete
4. Close audit logger (flush pending writes)
5. Exit process

### Error Handling

**Uncaught exceptions:** Log and exit (let process manager restart)  
**Unhandled rejections:** Log and exit  
**Module failures:** Circuit breaker + health checks  
**Audit failures:** Log warning, continue

## Consequences

### Enables
- ✅ **Gradual module rollout:** Stubs allow partial implementation
- ✅ **Testability:** Dependency injection, mock implementations
- ✅ **Resilience:** Circuit breaker, health checks, graceful degradation
- ✅ **Monitoring:** Health endpoint, cycle metrics, audit trail
- ✅ **Configuration flexibility:** Environment-driven, hot-reloadable
- ✅ **Paper-trading default:** Safe mode until user opts in

### Constraints
- ⚠️ **Polling latency:** 1-5 minute delay between signal and execution
- ⚠️ **No real-time execution:** Not suitable for high-frequency trading
- ⚠️ **Circuit breaker adds complexity:** State machine, timeout management
- ⚠️ **Stubs need replacement:** Decision-layer and rule-engine incomplete

### Risks
- 🔴 **Event loop blocking:** Long-running cycle delays next cycle → Mitigated by: async/await, timeout on external calls
- 🔴 **Health check false positives:** Module reports healthy but broken → Mitigated by: functional checks (not just ping)
- 🔴 **Config validation incomplete:** Invalid config passes startup → Mitigated by: comprehensive validation, unit tests
- 🔴 **Graceful degradation too permissive:** Continues trading despite failures → Mitigated by: kill switch integration, error thresholds

## Open Questions

1. **WebSocket for UI updates?** Real-time dashboard vs polling REST API (Defer to Sprint 3)
2. **REST API for control?** Manual trade execution, config updates via API (Defer to Sprint 3)
3. **Multi-orchestrator deployment?** Active-passive HA, leader election (Defer to Sprint 4)
4. **Backtest mode?** Replay historical data for strategy testing (Defer to Sprint 4)

## Alternatives Considered

### Alternative 1: Event-Driven Architecture

Pub/sub with message queue (Redis, RabbitMQ):
- Decision-layer publishes trade signals
- Orchestrator subscribes and processes

**Rejected because:**
- Infrastructure complexity (queue setup, monitoring)
- Overkill for 5-minute cadence
- Debugging harder (async event flow)
- Rate-limiting more complex (backpressure, dead letters)

### Alternative 2: Serverless (Lambda-style)

AWS Lambda triggered by CloudWatch Events:
- One Lambda per module
- Step Functions for orchestration

**Rejected because:**
- Vendor lock-in (AWS-specific)
- Cold start latency
- State management harder (no in-memory state)
- Deployment complexity (many Lambdas)
- Overkill for single-service system

### Alternative 3: Monolithic Single-File Orchestrator

All logic in one file, no interfaces:

**Rejected because:**
- Testability suffers (no mocking)
- Module coupling tight
- Gradual rollout impossible
- Violates separation of concerns

## References

- ADR-001 (Engine Architecture) - package structure, safety principles
- ADR-002 (Risk Framework) - position limits, kill switches
- Issue #14 (Orchestrator) - requirements
- Circuit Breaker Pattern: Martin Fowler (https://martinfowler.com/bliki/CircuitBreaker.html)

---

**Decision outcome:** Implement dependency-injection orchestrator with event loop, circuit breaker, health checks, and graceful degradation. Use stubs for incomplete modules. Deploy in Sprint 2 as integration backbone.
