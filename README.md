# trade.aiorkesta.com

Autonomous trading bot for eToro. Rule engine + AI decision layer evaluating real-time external data.

## ⚠ RISK

**This software places real trades using your eToro API key. Trading involves substantial risk of loss. You can lose all invested capital.**

- AI decisions can be wrong.
- Software bugs can cause losses.
- External data can be incorrect, delayed, or manipulated.
- Past performance does not predict future results.

**Provide a simulated/demo eToro API key first. Switch to real-money credentials only after auditing every decision path.**

This tool is provided as-is with no warranty. Authors accept no liability for trading losses or any consequence of using this software. You are 100% responsible for trades placed.

## Architecture (planned)

- `packages/etoro-client/` — REST + WebSocket client for https://api-portal.etoro.com/
- `packages/rule-engine/` — user-configurable rules (entry/exit conditions, position sizing, stop-loss)
- `packages/decision-layer/` — AI evaluation of rules + external data → trade decision
- `packages/data-sources/` — pluggable external sources (news, sentiment, market indicators)
- `packages/audit/` — every decision + data input logged immutably
- `packages/web/` — config UI + portfolio dashboard + decision-trace viewer
- `apps/server/` — orchestrator: poll rules, evaluate, dispatch trades
- `apps/web/` — Next.js or Vue frontend

## Safety defaults

- Paper-trading mode default until explicitly disabled
- Daily loss kill switch
- Max position size cap
- Manual approval gate for trades > configured threshold
- Full audit trail
- Manual override at any time
