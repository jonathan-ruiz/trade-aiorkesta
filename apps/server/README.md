# @trade-aiorkesta/server

Orchestrator backend that coordinates rule evaluation, decision-making, and trade execution.

## Responsibilities
- Poll rule-engine on configured intervals
- Fetch market data via etoro-client
- Request decision-layer evaluation for candidate trades
- Execute approved trades via etoro-client
- Serve API for web frontend
- Enforce safety checks (paper-trading mode, kill switches, position limits)

## Design
Node.js service with:
- Scheduled jobs (cron-style rule evaluation)
- WebSocket server for real-time UI updates
- REST API for config/control
- State machine: STOPPED → PAPER_TRADING → LIVE_TRADING

Safety kill switches:
- Daily loss limit exceeded → STOP
- Unexpected error rate → STOP
- Manual intervention → STOP
