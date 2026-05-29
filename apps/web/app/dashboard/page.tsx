"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface Decision {
  id: string;
  timestamp: string;
  action: string;
  symbol: string;
  amount: number;
  reason: string;
  status: "pending" | "executed" | "rejected";
}

export default function DashboardPage() {
  const router = useRouter();
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  // Mock data - in real app, would fetch from backend
  const [positions] = useState<Position[]>([
    {
      id: "1",
      symbol: "AAPL",
      quantity: 10,
      entryPrice: 150.0,
      currentPrice: 155.0,
      pnl: 50.0,
      pnlPercent: 3.33,
    },
    {
      id: "2",
      symbol: "GOOGL",
      quantity: 5,
      entryPrice: 140.0,
      currentPrice: 138.0,
      pnl: -10.0,
      pnlPercent: -1.43,
    },
  ]);

  const [decisions] = useState<Decision[]>([
    {
      id: "1",
      timestamp: "2026-05-29 14:23:15",
      action: "BUY",
      symbol: "TSLA",
      amount: 500,
      reason: "AI detected positive sentiment + upward momentum",
      status: "pending",
    },
    {
      id: "2",
      timestamp: "2026-05-29 13:45:32",
      action: "SELL",
      symbol: "GOOGL",
      amount: 280,
      reason: "Stop-loss triggered at -5%",
      status: "executed",
    },
    {
      id: "3",
      timestamp: "2026-05-29 12:10:08",
      action: "BUY",
      symbol: "AAPL",
      amount: 1500,
      reason: "Entry rule: RSI < 30 + news sentiment positive",
      status: "executed",
    },
  ]);

  useEffect(() => {
    // Check if risk was acknowledged
    const acknowledged = localStorage.getItem("risk-acknowledged");
    if (!acknowledged) {
      router.push("/");
    }
  }, [router]);

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalValue = positions.reduce(
    (sum, pos) => sum + pos.quantity * pos.currentPrice,
    0
  );

  const handleKillSwitch = () => {
    if (
      confirm(
        "Are you sure you want to activate the kill switch? This will halt all trading and close open positions."
      )
    ) {
      setKillSwitchActive(true);
      alert("Kill switch activated. All trading halted.");
    }
  };

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
          {/* Kill Switch */}
          <button
            onClick={handleKillSwitch}
            disabled={killSwitchActive}
            className={`rounded-lg px-6 py-3 font-bold text-white transition-colors ${
              killSwitchActive
                ? "cursor-not-allowed bg-gray-400"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {killSwitchActive ? "🛑 HALTED" : "🛑 KILL SWITCH"}
          </button>
        </div>

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

        {/* Status Banner */}
        {killSwitchActive && (
          <div className="mb-6 rounded-lg bg-red-100 p-4">
            <p className="font-semibold text-red-900">
              ⚠️ Kill switch activated. All trading is halted.
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total P&L */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm text-gray-600">Total P&L</div>
            <div
              className={`mt-2 text-3xl font-bold ${
                totalPnL >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-gray-500">Today</div>
          </div>

          {/* Portfolio Value */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm text-gray-600">Portfolio Value</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              ${totalValue.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-gray-500">Current</div>
          </div>

          {/* Open Positions */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm text-gray-600">Open Positions</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {positions.length}
            </div>
            <div className="mt-1 text-xs text-gray-500">Active</div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Current Positions
          </h2>
          {positions.length === 0 ? (
            <p className="text-sm text-gray-600">No open positions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">Entry Price</th>
                    <th className="pb-3">Current Price</th>
                    <th className="pb-3">P&L</th>
                    <th className="pb-3">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.id} className="border-b text-sm">
                      <td className="py-3 font-semibold text-gray-900">
                        {position.symbol}
                      </td>
                      <td className="py-3 text-gray-700">
                        {position.quantity}
                      </td>
                      <td className="py-3 text-gray-700">
                        ${position.entryPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-gray-700">
                        ${position.currentPrice.toFixed(2)}
                      </td>
                      <td
                        className={`py-3 font-semibold ${
                          position.pnl >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {position.pnl >= 0 ? "+" : ""}$
                        {position.pnl.toFixed(2)}
                      </td>
                      <td
                        className={`py-3 font-semibold ${
                          position.pnlPercent >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {position.pnlPercent >= 0 ? "+" : ""}
                        {position.pnlPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Decisions */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Recent Trading Decisions
          </h2>
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="flex items-start gap-4 rounded-lg border border-gray-200 p-4"
              >
                {/* Action Badge */}
                <div
                  className={`rounded px-3 py-1 text-xs font-bold ${
                    decision.action === "BUY"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {decision.action}
                </div>

                {/* Decision Details */}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {decision.symbol}
                    </span>
                    <span className="text-sm text-gray-600">
                      ${decision.amount}
                    </span>
                    <span
                      className={`ml-auto text-xs font-medium ${
                        decision.status === "executed"
                          ? "text-green-600"
                          : decision.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {decision.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mb-1 text-sm text-gray-700">
                    {decision.reason}
                  </p>
                  <p className="text-xs text-gray-500">{decision.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
