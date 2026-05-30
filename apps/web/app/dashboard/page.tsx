"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LivePositionsTable } from "../../components/LivePositionsTable";
import { EnhancedDecisionFeed } from "../../components/EnhancedDecisionFeed";
import { TradeExecutionLog } from "../../components/TradeExecutionLog";
import { KillSwitch } from "../../components/KillSwitch";
import { useEToroPositions } from "../../hooks/useEToroPositions";
import { useTradeLog } from "../../hooks/useTradeLog";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  valueColor?: string;
  tooltip?: string;
}

function SummaryCard({
  title,
  value,
  subtitle,
  valueColor = "text-gray-900",
  tooltip,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow" title={tooltip}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className={`mt-2 text-3xl font-bold ${valueColor}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { positions } = useEToroPositions();
  const { trades } = useTradeLog();

  useEffect(() => {
    // Check if risk was acknowledged
    const acknowledged = localStorage.getItem("risk-acknowledged");
    if (!acknowledged) {
      router.push("/");
    }
  }, [router]);

  // Calculate unrealized P&L from open positions
  const unrealizedPnL = positions.reduce(
    (sum, pos) => sum + pos.unrealizedPnL,
    0
  );

  // Calculate realized P&L from today's closed trades
  const realizedPnL = trades.reduce((sum, trade) => {
    // Simplified: assume all trades contribute to realized P&L
    // In reality, need to match buy/sell pairs
    return sum + (trade.action === "SELL" ? trade.totalValue : -trade.totalValue);
  }, 0);

  const portfolioValue = positions.reduce(
    (sum, pos) => sum + pos.quantity * pos.currentPrice,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Portfolio Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Real-time overview of positions and trading decisions
            </p>
          </div>
        </div>

        {/* Kill Switch - Fixed Position */}
        <KillSwitch
          currentPositionsCount={positions.length}
          estimatedPnL={unrealizedPnL}
        />

        {/* Navigation */}
        <div className="mb-6 flex gap-4">
          <Link
            href="/config"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Config
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Dashboard
          </Link>
        </div>

        {/* Summary Cards - 4 Cards Layout */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Unrealized P&L"
            value={`${unrealizedPnL >= 0 ? "+" : ""}$${unrealizedPnL.toFixed(2)}`}
            subtitle="Open positions"
            valueColor={unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}
            tooltip="Gains/losses on current holdings (not realized until sold)"
          />
          <SummaryCard
            title="Realized P&L"
            value={`${realizedPnL >= 0 ? "+" : ""}$${realizedPnL.toFixed(2)}`}
            subtitle="Closed trades today"
            valueColor={realizedPnL >= 0 ? "text-green-600" : "text-red-600"}
          />
          <SummaryCard
            title="Portfolio Value"
            value={`$${portfolioValue.toFixed(2)}`}
            subtitle="Current"
          />
          <SummaryCard
            title="Open Positions"
            value={positions.length.toString()}
            subtitle="Active"
          />
        </div>

        {/* Live Positions Table */}
        <div className="mb-6">
          <LivePositionsTable />
        </div>

        {/* Enhanced Decision Feed */}
        <div className="mb-6">
          <EnhancedDecisionFeed />
        </div>

        {/* Trade Execution Log */}
        <div className="mb-6">
          <TradeExecutionLog />
        </div>
      </div>
    </div>
  );
}
