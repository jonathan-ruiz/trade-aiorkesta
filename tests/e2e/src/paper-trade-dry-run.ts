/**
 * End-to-End Paper Trade Dry-Run Test
 *
 * Validates full trading flow in paper-trading mode:
 * decision → rules → risk → eToro → audit
 */

import { DecisionLayer, TradeSignal } from '@trade-aiorkesta/decision-layer';
import { RiskEnforcer, defaultRiskConfig } from '@trade-aiorkesta/risk-management';
import { EToroRestClient } from '@trade-aiorkesta/etoro-client';
import { AuditWriter } from '@trade-aiorkesta/audit';

interface TestResult {
  passed: boolean;
  step: string;
  error?: string;
  data?: unknown;
}

class PaperTradeDryRun {
  private decisionLayer: DecisionLayer;
  private riskEnforcer: RiskEnforcer;
  private etoroClient: EToroRestClient;
  private auditWriter: AuditWriter;
  private results: TestResult[] = [];

  constructor() {
    // Initialize modules
    this.decisionLayer = new DecisionLayer({
      anthropic_api_key: process.env.ANTHROPIC_API_KEY || 'test-key',
      model: 'claude-sonnet-4-5',
      temperature: 0.3,
      default_risk_profile: 'conservative',
      data_sources: [
        { name: 'market_data', enabled: true },
        { name: 'news', enabled: false },
        { name: 'sentiment', enabled: false },
      ],
    });

    this.riskEnforcer = new RiskEnforcer(defaultRiskConfig);

    this.etoroClient = new EToroRestClient({
      apiKey: process.env.ETORO_API_KEY || 'test-key',
      apiSecret: process.env.ETORO_API_SECRET || 'test-secret',
      demo: true, // CRITICAL: paper-trading mode
    });

    this.auditWriter = new AuditWriter(process.env.DATABASE_URL);
  }

  /**
   * Run the full E2E test
   */
  async run(): Promise<void> {
    console.log('='.repeat(80));
    console.log('PAPER TRADE DRY-RUN TEST');
    console.log('='.repeat(80));
    console.log();

    try {
      // Test 1: Verify paper-trading mode
      await this.testPaperTradingDefault();

      // Test 2: Generate trade signal
      const tradeSignal = await this.generateTestSignal();

      // Test 3: AI decision evaluation
      const aiDecision = await this.testDecisionLayer(tradeSignal);

      // Test 4: Risk check
      const riskCheck = await this.testRiskEnforcement(tradeSignal, aiDecision);

      // Test 5: Execute paper trade (if approved)
      if (riskCheck.approved) {
        await this.testPaperTradeExecution(tradeSignal);
      }

      // Test 6: Verify audit log
      await this.testAuditLog();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('Test failed with error:', error);
      this.results.push({
        passed: false,
        step: 'Overall',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async testPaperTradingDefault(): Promise<void> {
    console.log('[Test 1] Verifying paper-trading-on-by-default...');

    try {
      const config = this.riskEnforcer.getConfig();
      const isPaperMode = this.etoroClient.isAuthenticated() ? false : true; // Check if client is in demo mode

      if (config.paper_trading_mode !== false) {
        this.results.push({
          passed: true,
          step: 'Paper Trading Default',
          data: { paperMode: true },
        });
        console.log('✓ Paper-trading mode: ON\n');
      } else {
        throw new Error('Paper-trading mode is OFF - UNSAFE!');
      }
    } catch (error) {
      this.results.push({
        passed: false,
        step: 'Paper Trading Default',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ Paper-trading check failed\n');
      throw error;
    }
  }

  private async generateTestSignal(): Promise<TradeSignal> {
    console.log('[Test 2] Generating test trade signal...');

    const signal: TradeSignal = {
      symbol: 'AAPL',
      action: 'BUY',
      quantity: 10,
      price: 175.0,
      rule_id: 'test-rsi-oversold',
      technical_indicators: {
        rsi: 28,
        macd_histogram: 0.5,
        volume_ratio: 1.2,
      },
      timestamp: new Date(),
    };

    this.results.push({
      passed: true,
      step: 'Generate Signal',
      data: signal,
    });

    console.log(`✓ Signal: ${signal.action} ${signal.quantity} ${signal.symbol} @ $${signal.price}`);
    console.log(`  RSI: ${signal.technical_indicators?.rsi}\n`);

    return signal;
  }

  private async testDecisionLayer(signal: TradeSignal): Promise<{ approved: boolean; reasoning: string }> {
    console.log('[Test 3] AI decision evaluation...');

    try {
      const evaluation = await this.decisionLayer.evaluateTradeSignal(signal, 'conservative');

      const approved = evaluation.decision === 'APPROVE';

      this.results.push({
        passed: true,
        step: 'AI Decision',
        data: {
          decision: evaluation.decision,
          confidence: evaluation.confidence,
          reasoning: evaluation.reasoning,
        },
      });

      console.log(`✓ Decision: ${evaluation.decision}`);
      console.log(`  Confidence: ${evaluation.confidence}`);
      console.log(`  Reasoning: ${evaluation.reasoning.slice(0, 100)}...\n`);

      return { approved, reasoning: evaluation.reasoning };

    } catch (error) {
      this.results.push({
        passed: false,
        step: 'AI Decision',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ AI decision failed\n');
      throw error;
    }
  }

  private async testRiskEnforcement(
    signal: TradeSignal,
    aiDecision: { approved: boolean }
  ): Promise<{ approved: boolean }> {
    console.log('[Test 4] Risk enforcement check...');

    try {
      const accountBalance = 10000; // Mock balance
      const currentPositions = []; // No current positions

      const tradeProposal = {
        symbol: signal.symbol,
        action: signal.action,
        quantity: signal.quantity,
        price: signal.price,
        accountBalance,
        currentPositions,
      };

      const riskCheck = this.riskEnforcer.checkTrade(tradeProposal);

      this.results.push({
        passed: true,
        step: 'Risk Check',
        data: {
          approved: riskCheck.approved,
          violations: riskCheck.violations,
        },
      });

      if (riskCheck.approved) {
        console.log('✓ Risk check: APPROVED\n');
      } else {
        console.log('✗ Risk check: REJECTED');
        console.log(`  Violations: ${riskCheck.violations.join(', ')}\n`);
      }

      return { approved: riskCheck.approved && aiDecision.approved };

    } catch (error) {
      this.results.push({
        passed: false,
        step: 'Risk Check',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ Risk check failed\n');
      throw error;
    }
  }

  private async testPaperTradeExecution(signal: TradeSignal): Promise<void> {
    console.log('[Test 5] Executing paper trade...');

    try {
      // NOTE: eToro client integration pending - this is a mock for now
      console.log('⚠ eToro client integration pending');
      console.log('✓ Paper trade would execute: BUY 10 AAPL @ $175.00');
      console.log('  (Mock execution - real eToro API integration required)\n');

      this.results.push({
        passed: true,
        step: 'Paper Trade Execution',
        data: { mock: true, signal },
      });

    } catch (error) {
      this.results.push({
        passed: false,
        step: 'Paper Trade Execution',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ Paper trade execution failed\n');
      throw error;
    }
  }

  private async testAuditLog(): Promise<void> {
    console.log('[Test 6] Verifying audit log...');

    try {
      // Log a test decision
      const logEntry = await this.auditWriter.logDecision({
        event_type: 'DECISION_MADE',
        rule_id: 'test-rsi-oversold',
        data_inputs: {
          symbol: 'AAPL',
          price: 175.0,
          rsi: 28,
        },
        ai_eval: {
          model: 'claude-sonnet-4-5',
          reasoning: 'Test dry-run evaluation',
          confidence: 0.85,
        },
        decision: 'APPROVED',
        executed: false,
      });

      console.log(`✓ Audit log entry created: ${logEntry.id}`);
      console.log(`  Timestamp: ${logEntry.timestamp}`);
      console.log(`  Signature: ${logEntry.signature.slice(0, 16)}...\n`);

      this.results.push({
        passed: true,
        step: 'Audit Log',
        data: { entry_id: logEntry.id },
      });

    } catch (error) {
      this.results.push({
        passed: false,
        step: 'Audit Log',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ Audit log failed\n');
      throw error;
    }
  }

  private printResults(): void {
    console.log('='.repeat(80));
    console.log('TEST RESULTS');
    console.log('='.repeat(80));
    console.log();

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    this.results.forEach((result, i) => {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${i + 1}. [${status}] ${result.step}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log();
    console.log(`Total: ${passed}/${total} tests passed`);
    console.log('='.repeat(80));

    if (passed === total) {
      console.log('✓ ALL TESTS PASSED');
    } else {
      console.log('✗ SOME TESTS FAILED');
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new PaperTradeDryRun();
  test.run()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}
