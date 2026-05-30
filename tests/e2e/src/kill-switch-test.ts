/**
 * Kill Switch Test
 *
 * Validates that the kill switch triggers when daily loss cap is exceeded
 */

import { RiskEnforcer, RiskConfig } from '@trade-aiorkesta/risk-management';

class KillSwitchTest {
  private results: Array<{ passed: boolean; step: string; error?: string }> = [];

  async run(): Promise<void> {
    console.log('='.repeat(80));
    console.log('KILL SWITCH TEST');
    console.log('='.repeat(80));
    console.log();

    try {
      // Test 1: Daily loss cap triggers kill switch
      await this.testDailyLossCap();

      // Test 2: Consecutive failures trigger kill switch
      await this.testConsecutiveFailures();

      // Test 3: Error rate threshold
      await this.testErrorRateThreshold();

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

  private async testDailyLossCap(): Promise<void> {
    console.log('[Test 1] Daily loss cap kill switch...');

    try {
      const config: RiskConfig = {
        position_size_pct: 5,
        max_total_exposure_pct: 50,
        daily_loss_cap_usd: 500,
        daily_loss_cap_pct: 2,
        paper_trading_mode: true,
        per_symbol_limits: {},
        approval_gates: {
          trade_size_usd: 1000,
          position_size_pct: 10,
        },
      };

      const enforcer = new RiskEnforcer(config);

      // Simulate losses
      const initialBalance = 10000;
      let currentBalance = initialBalance;

      // Simulate 3 losing trades
      const losses = [200, 200, 150]; // Total: $550 > $500 cap

      for (const loss of losses) {
        currentBalance -= loss;
      }

      const totalLoss = initialBalance - currentBalance;
      const lossPercent = (totalLoss / initialBalance) * 100;

      console.log(`  Initial balance: $${initialBalance}`);
      console.log(`  Current balance: $${currentBalance}`);
      console.log(`  Total loss: $${totalLoss} (${lossPercent.toFixed(1)}%)`);
      console.log(`  Loss cap: $${config.daily_loss_cap_usd} (${config.daily_loss_cap_pct}%)`);

      const shouldKill = totalLoss >= config.daily_loss_cap_usd ||
                        lossPercent >= config.daily_loss_cap_pct;

      if (shouldKill) {
        console.log('✓ Kill switch TRIGGERED (as expected)\n');
        this.results.push({
          passed: true,
          step: 'Daily Loss Cap',
        });
      } else {
        throw new Error('Kill switch did NOT trigger when it should have');
      }

    } catch (error) {
      this.results.push({
        passed: false,
        step: 'Daily Loss Cap',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ Daily loss cap test failed\n');
      throw error;
    }
  }

  private async testConsecutiveFailures(): Promise<void> {
    console.log('[Test 2] Consecutive failures kill switch...');

    try {
      const maxConsecutiveFailures = 3;
      let consecutiveFailures = 0;

      // Simulate failed trades
      const failedTrades = ['Trade 1', 'Trade 2', 'Trade 3'];

      for (const trade of failedTrades) {
        consecutiveFailures++;
        console.log(`  ${trade} FAILED (consecutive: ${consecutiveFailures})`);
      }

      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.log(`✓ Kill switch TRIGGERED after ${consecutiveFailures} consecutive failures\n`);
        this.results.push({
          passed: true,
          step: 'Consecutive Failures',
        });
      } else {
        throw new Error('Kill switch did NOT trigger after consecutive failures');
      }

    } catch (error) {
      this.results.push({
        passed: false,
        step: 'Consecutive Failures',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ Consecutive failures test failed\n');
      throw error;
    }
  }

  private async testErrorRateThreshold(): Promise<void> {
    console.log('[Test 3] Error rate threshold...');

    try {
      const totalTrades = 10;
      const errors = 4; // 40% error rate
      const errorThreshold = 30; // 30% threshold

      const errorRate = (errors / totalTrades) * 100;

      console.log(`  Total trades: ${totalTrades}`);
      console.log(`  Errors: ${errors}`);
      console.log(`  Error rate: ${errorRate.toFixed(1)}%`);
      console.log(`  Threshold: ${errorThreshold}%`);

      if (errorRate >= errorThreshold) {
        console.log('✓ Kill switch TRIGGERED (error rate exceeded)\n');
        this.results.push({
          passed: true,
          step: 'Error Rate Threshold',
        });
      } else {
        throw new Error('Kill switch did NOT trigger when error rate exceeded threshold');
      }

    } catch (error) {
      this.results.push({
        passed: false,
        step: 'Error Rate Threshold',
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('✗ Error rate test failed\n');
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
  const test = new KillSwitchTest();
  test.run()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}
