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

## Development

```bash
# Install dependencies
npm install  # or pnpm/yarn

# Run development server
npm run dev

# Run tests
npm test

# Typecheck
npm run typecheck

# Lint
npm run lint
```

## Deployment

### Quick Start (Local)

```bash
# Copy environment template
cp .env.example .env
# Edit .env with your eToro demo API key

# Start with Docker Compose
make deploy-local
# or: docker-compose up -d --build

# Verify
make health
```

### Production Deployment to trade.aiorkesta.com

See [docs/runbooks/deployment.md](docs/runbooks/deployment.md) for full deployment procedures, monitoring, and troubleshooting.

**Prerequisites:**
- SSL certificates in `deploy/certs/`
- Environment variables configured
- Docker & Docker Compose on server

**CI/CD:**
- GitHub Actions runs typecheck + test + build on all PRs
- Auto-merge enabled for green PRs (no `no-auto-merge` label)
- Deployment to production on main branch merge

**Commands:**
```bash
make help          # Show all commands
make build         # Build Docker images
make up            # Start services
make logs          # Tail logs
make health        # Check service health
make clean         # Clean up containers
```

## Infrastructure

- **CI:** GitHub Actions (`.github/workflows/ci.yml`)
- **Deployment:** Docker + nginx reverse proxy
- **Domain:** trade.aiorkesta.com
- **Monitoring:** Container health checks + nginx logs
- **Security:** SSL/TLS, rate limiting, CSP headers
