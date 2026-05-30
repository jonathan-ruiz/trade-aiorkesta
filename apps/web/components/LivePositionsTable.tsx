"use client";

import { useEToroPositions } from "../hooks/useEToroPositions";

export function LivePositionsTable() {
  const { positions, isLoading, error, isStale, refresh } = useEToroPositions();

  if (isLoading && positions.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Current Positions
        </h2>
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Current Positions
        </h2>
        <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
          <span className="text-sm text-red-800">
            ⚠️ Unable to fetch positions. Retry in 30s.
          </span>
          <button
            onClick={refresh}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Current Positions
        </h2>
        <p className="text-sm text-gray-600">
          No open positions. Trading rules active.
        </p>
      </div>
    );
  }

  const lastUpdated = positions[0]?.lastUpdated
    ? Math.floor((Date.now() - new Date(positions[0].lastUpdated).getTime()) / 1000)
    : 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Current Positions
        </h2>
        <button
          onClick={refresh}
          aria-label={`Refresh positions, last updated ${lastUpdated} seconds ago`}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b text-left text-sm text-gray-600">
              <th scope="col" className="pb-3">Symbol</th>
              <th scope="col" className="pb-3">Quantity</th>
              <th scope="col" className="pb-3">Entry Price</th>
              <th scope="col" className="pb-3">Current Price</th>
              <th scope="col" className="pb-3">P&L</th>
              <th scope="col" className="pb-3">P&L %</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id} className="border-b text-sm">
                <td className="py-3 font-semibold text-gray-900">
                  {position.symbol}
                </td>
                <td className="py-3 text-gray-700">{position.quantity}</td>
                <td className="py-3 text-gray-700">
                  ${position.entryPrice.toFixed(2)}
                </td>
                <td className="py-3 text-gray-700" aria-live="polite">
                  ${position.currentPrice.toFixed(2)}
                  {isStale && (
                    <span
                      className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500"
                      title="Data may be stale (>60s old)"
                    />
                  )}
                </td>
                <td
                  className={`py-3 font-semibold ${
                    position.unrealizedPnL >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {position.unrealizedPnL >= 0 ? "+" : ""}$
                  {position.unrealizedPnL.toFixed(2)}
                </td>
                <td
                  className={`py-3 font-semibold ${
                    position.unrealizedPnLPercent >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {position.unrealizedPnLPercent >= 0 ? "+" : ""}
                  {position.unrealizedPnLPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
