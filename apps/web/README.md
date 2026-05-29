# @trade-aiorkesta/web

Frontend application for configuring rules, monitoring trades, and reviewing decisions.

## Responsibilities
- Risk disclaimer landing (must acknowledge before access)
- Rule configuration UI (visual rule builder)
- Portfolio dashboard (positions, P&L, active rules)
- Decision trace viewer (audit log browser with explanations)
- Manual intervention controls (approve/reject pending trades, emergency stop)

## Design
Next.js or Vue SPA. Connects to `apps/server` via REST + WebSocket.

Key pages:
- `/` — Risk disclaimer (acknowledge button)
- `/rules` — Rule editor
- `/portfolio` — Live positions and performance
- `/audit` — Decision history with full context
- `/settings` — API credentials, risk limits, mode toggle
