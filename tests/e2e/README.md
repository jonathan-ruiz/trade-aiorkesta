# End-to-End Tests

Validation tests for the trade-aiorkesta trading bot.

## Prerequisites

1. **PostgreSQL database** for audit logging
2. **Anthropic API key** for decision layer
3. **eToro API credentials** (demo account recommended)

## Setup

```bash
# Set environment variables
export DATABASE_URL="postgresql://localhost:5432/trade_aiorkesta"
export ANTHROPIC_API_KEY="your-key-here"
export ETORO_API_KEY="your-demo-key"
export ETORO_API_SECRET="your-demo-secret"

# Install dependencies
npm install
```

## Running Tests

### Full Paper Trade Dry-Run

Validates complete trading flow: decision → rules → risk → eToro → audit

```bash
npm test
```

### Kill Switch Test

Validates safety mechanisms (loss cap, failure thresholds, error rates)

```bash
npm run test:kill-switch
```

## Test Structure

```
tests/e2e/
├── src/
│   ├── paper-trade-dry-run.ts  # Main E2E validation
│   └── kill-switch-test.ts     # Safety mechanism tests
├── VALIDATION_REPORT.md        # Results documentation
├── package.json
└── README.md
```

## Tests Covered

### 1. Paper Trade Dry-Run (`paper-trade-dry-run.ts`)

- ✅ Paper-trading mode default verification
- ✅ Trade signal generation
- ✅ AI decision evaluation (Claude API)
- ✅ Risk enforcement checks
- ✅ Paper trade execution (eToro demo)
- ✅ Audit log integrity

### 2. Kill Switch (`kill-switch-test.ts`)

- ✅ Daily loss cap triggers halt
- ✅ Consecutive failures trigger halt
- ✅ Error rate threshold enforcement

## Expected Output

```
================================================================================
PAPER TRADE DRY-RUN TEST
================================================================================

[Test 1] Verifying paper-trading-on-by-default...
✓ Paper-trading mode: ON

[Test 2] Generating test trade signal...
✓ Signal: BUY 10 AAPL @ $175.0
  RSI: 28

[Test 3] AI decision evaluation...
✓ Decision: APPROVE
  Confidence: 0.85
  Reasoning: Technical indicators suggest oversold condition...

[Test 4] Risk enforcement check...
✓ Risk check: APPROVED

[Test 5] Executing paper trade...
✓ Paper trade executed: BUY 10 AAPL @ $175.00

[Test 6] Verifying audit log...
✓ Audit log entry created: abc-123-def
  Timestamp: 2026-05-30T10:00:00Z
  Signature: 3a7bd9f2e1c4...

================================================================================
TEST RESULTS
================================================================================

1. [✓ PASS] Paper Trading Default
2. [✓ PASS] Generate Signal
3. [✓ PASS] AI Decision
4. [✓ PASS] Risk Check
5. [✓ PASS] Paper Trade Execution
6. [✓ PASS] Audit Log

Total: 6/6 tests passed
================================================================================
✓ ALL TESTS PASSED
```

## Validation Report

After running tests, document results in `VALIDATION_REPORT.md`:
- Test outcomes (pass/fail)
- Bugs found
- Performance metrics
- Recommendations

## Integration with Orchestrator

**Note:** These tests currently run modules independently. Once PR #18 (orchestrator) merges, update tests to run through the orchestrator's event loop instead of direct module calls.

### Post-Orchestrator Integration

```typescript
// Future: run via orchestrator
import { Orchestrator } from '@trade-aiorkesta/server';

const orchestrator = new Orchestrator(config, modules);
await orchestrator.start();
await orchestrator.executeCycle();
```

## Troubleshooting

### Database Connection Errors

```bash
# Verify PostgreSQL is running
pg_isready

# Create database if needed
createdb trade_aiorkesta

# Run schema migration
psql trade_aiorkesta < packages/audit/schema.sql
```

### API Key Issues

```bash
# Verify Anthropic API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### eToro Client Errors

- Ensure using **demo account** credentials
- Verify API key has correct permissions
- Check eToro API portal for rate limits

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run E2E Tests
  run: |
    cd tests/e2e
    npm install
    npm test
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    ETORO_API_KEY: ${{ secrets.ETORO_DEMO_KEY }}
    ETORO_API_SECRET: ${{ secrets.ETORO_DEMO_SECRET }}
```

## License

MIT
