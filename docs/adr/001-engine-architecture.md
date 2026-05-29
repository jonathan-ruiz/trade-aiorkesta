# ADR-001: Engine Architecture and Safety Design

**Status:** Accepted  
**Date:** 2026-05-29  
**Author:** Sam (Solution Architect)

## Context

Building an autonomous trading bot for eToro that places real-money trades carries substantial risk. The system must:

1. **Execute user-defined trading rules** (technical indicators, entry/exit conditions)
2. **Apply AI judgment** to evaluate whether rule-triggered trades make sense given broader context
3. **Maintain complete audit trail** for post-trade analysis and compliance
4. **Enforce safety defaults** (paper-trading mode, loss limits, manual approval gates)
5. **Integrate external data sources** (news, sentiment, macro indicators)
6. **Provide transparent UI** for configuration and monitoring

Key constraints:
- Real-money consequences demand defensive architecture
- AI decisions must be explainable (not black-box)
- Users must retain manual override at all times
- Bugs or data errors can cause financial loss

## Decision

### 1. Monorepo Structure

Organize as monorepo with `packages/` (shared libraries) and `apps/` (deployable services):

```
packages/
  etoro-client/      → eToro API client (REST + WebSocket)
  rule-engine/       → Rule definition, validation, evaluation
  decision-layer/    → AI-augmented decision logic
  data-sources/      → Pluggable external data providers
  audit/             → Immutable audit trail
  web/               → Shared UI components

apps/
  server/            → Orchestrator backend
  web/               → Frontend SPA
```

**Why monorepo?**
- Atomic changes across packages (e.g., rule schema change + UI update)
- Shared TypeScript types eliminate drift
- Single CI/CD pipeline for consistent versioning
- Local development easier (no publish/install cycles)

### 2. Rule Engine vs Decision Layer Separation

**Rule engine:** Deterministic, user-configured logic. Outputs candidate trades based purely on technical rules.

**Decision layer:** Non-deterministic AI evaluation. Receives candidate trade + external context → APPROVE/REJECT/DEFER + rationale.

**Why separate?**
- Rule engine is testable, reproducible, auditable
- Decision layer adds judgment but can be disabled/overridden
- Users can run rules-only mode (no AI) or AI-assisted mode
- Clear boundary: rules = "what the numbers say", decision = "does this make sense?"

### 3. Immutable Audit Trail

Every event logged with:
- Unique ID, microsecond timestamp
- Event type (RULE_EVAL | DECISION_MADE | TRADE_EXECUTED | CONFIG_CHANGED)
- Full input snapshot (market data, rule state, external sources)
- Output/decision + rationale
- Digital signature (tamper detection)

**Why immutable?**
- Post-loss investigation requires full context reconstruction
- Regulatory compliance (if expanding to regulated users)
- Debugging AI decisions demands input/output pairs
- Users must trust the system → transparency via audit

**Implementation:** Append-only log (SQLite or Postgres with append-only table). No updates/deletes. Retention policy TBD (default: keep forever).

### 4. Server Orchestration Pattern

`apps/server` owns the execution loop:

```
Loop every N seconds:
  1. Fetch market data (etoro-client)
  2. Evaluate rules (rule-engine) → candidate trades
  3. For each candidate:
     a. Fetch external context (data-sources)
     b. Request decision (decision-layer)
     c. If APPROVED + safety checks pass → execute trade (etoro-client)
     d. Log everything (audit)
  4. Update UI (WebSocket push)
```

**State machine:** STOPPED → PAPER_TRADING → LIVE_TRADING

**Why orchestrator pattern?**
- Single source of truth for system state
- Enforces safety checks in one place (can't bypass)
- Clear control flow for debugging
- UI is read-only observer (cannot directly execute trades)

### 5. Safety Defaults

**Paper-trading mode:** Default on. Requires explicit flip to live-trading after user acknowledges risk.

**Kill switches:**
- Daily loss limit exceeded → STOP (manual restart required)
- Error rate threshold → STOP
- Manual emergency stop button

**Position limits:**
- Max position size per trade (% of portfolio)
- Max total exposure (sum of all positions)

**Manual approval gate:**
- Trades above configured threshold → queue for manual review
- User can approve/reject via UI

**Credential handling:**
- eToro API key stored encrypted
- Recommend demo/simulated key first
- UI prompts to verify key type before enabling live-trading

**Why these defaults?**
- Fail-safe: opt-in to risk, not opt-out
- Catches runaway losses early
- Gives users control over high-stakes decisions
- Reduces blame surface (user must actively choose risk)

### 6. Technology Stack (Initial)

- **Language:** TypeScript (type safety for financial logic)
- **Runtime:** Node.js (server + packages)
- **Frontend:** Next.js or Vue (TBD by UX designer)
- **Database:** PostgreSQL (audit log, config, state)
- **Queue:** In-memory initially (scale to Redis if needed)
- **Deployment:** Container (Docker) to trade.aiorkesta.com

**Why TypeScript?**
- Type safety reduces class of bugs in financial calculations
- Shared types across packages prevent integration errors
- Better IDE support for complex rule schemas

## Consequences

### Enables
- ✅ Clear separation of concerns (rules vs AI vs execution)
- ✅ Full auditability (every decision traceable)
- ✅ Safety-first defaults (paper-trading, kill switches)
- ✅ Pluggable data sources (easy to add new signals)
- ✅ User control (manual override, approval gates)
- ✅ Monorepo velocity (atomic cross-package changes)

### Constraints
- ⚠️ Monorepo tooling required (Nx, Turborepo, or pnpm workspaces)
- ⚠️ Decision layer adds latency (AI inference time)
- ⚠️ Audit log grows unbounded (need retention policy)
- ⚠️ Orchestrator is single point of failure (needs health checks)
- ⚠️ Complex mental model (rules → decision → execution pipeline)

### Risks
- 🔴 **AI decisions can be wrong** → Mitigated by: manual approval gate, paper-trading default, user can disable AI
- 🔴 **Bugs cause financial loss** → Mitigated by: TypeScript, comprehensive tests, paper-trading validation period
- 🔴 **External data incorrect/delayed** → Mitigated by: data source health checks, decision layer flags low-confidence sources
- 🔴 **User misconfigures rules** → Mitigated by: rule validation, position limits, daily loss kill switch

### Open Questions
1. **Monorepo tool:** Nx vs Turborepo vs pnpm workspaces? (Defer to DevOps)
2. **Frontend framework:** Next.js vs Vue? (Defer to UX designer)
3. **AI model:** OpenAI API vs self-hosted? (Defer to Sprint 2)
4. **Audit retention:** Keep forever vs rolling window? (Defer to Sprint 2)
5. **Deployment:** Single container vs service per app? (Defer to DevOps)

## References
- README.md (risk disclaimer, architecture overview)
- Issue #1 (Sprint 1 scope)
- eToro API docs: https://api-portal.etoro.com/

---

**Decision outcome:** Proceed with monorepo structure, rule/decision separation, immutable audit, orchestrator pattern, safety defaults as documented. Implementation begins Sprint 1.
