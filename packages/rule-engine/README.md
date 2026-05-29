# @trade-aiorkesta/rule-engine

User-configurable trading rules and conditions.

## Responsibilities
- Rule definition schema (entry/exit conditions, position sizing, stop-loss)
- Rule validation and compilation
- Rule evaluation against market state
- Position sizing calculations
- Risk parameter enforcement (max position size, daily loss limits)

## Design
Rules are declarative JSON/YAML configurations, not code. Users configure, not program.

Example rule: "Enter long BTC when RSI < 30 AND price above 20-day MA, exit when RSI > 70 OR loss > 3%"
