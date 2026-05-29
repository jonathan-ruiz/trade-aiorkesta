# @trade-aiorkesta/audit

Immutable audit trail for all decisions and trades.

## Responsibilities
- Log every rule evaluation (input data, rule state, outcome)
- Log every decision-layer evaluation (sources queried, AI reasoning, verdict)
- Log every trade execution (order details, timestamp, outcome)
- Log system state changes (config updates, mode switches)
- Provide query interface for post-trade analysis

## Design
Append-only log. Each entry:
- Unique ID
- Timestamp (microsecond precision)
- Event type (RULE_EVAL | DECISION_MADE | TRADE_EXECUTED | CONFIG_CHANGED)
- Full context (serialized input data, rule snapshot, decision rationale)
- Digital signature (tamper detection)

Critical for debugging losses and regulatory compliance.
