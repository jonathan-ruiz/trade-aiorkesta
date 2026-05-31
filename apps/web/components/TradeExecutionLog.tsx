"use client";

import { useTradeLog } from "../hooks/useTradeLog";

export function TradeExecutionLog() {
  const { trades, isLoading, error, loadMore, hasMore } = useTradeLog();

  if (isLoading && trades.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Trade Execution Log
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
          Trade Execution Log
        </h2>
        <div className="rounded-lg bg-red-50 p-4">
          <span className="text-sm text-red-800">⚠️ {error}</span>
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Trade Execution Log
        </h2>
        <p className="text-sm text-gray-600">No trades executed today.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Trade Execution Log
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b text-left text-xs text-gray-600">
              <th scope="col" className="pb-3">Time</th>
              <th scope="col" className="pb-3">Symbol</th>
              <th scope="col" className="pb-3">Action</th>
              <th scope="col" className="pb-3">Qty</th>
              <th scope="col" className="pb-3">Price</th>
              <th scope="col" className="pb-3">Total</th>
              <th scope="col" className="pb-3">Source</th>
              <th scope="col" className="pb-3">Audit</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr
                key={trade.id}
                id={`trade-${trade.id}`}
                className="border-b text-sm transition-colors hover:bg-gray-50"
              >
                <td className="py-3 text-xs text-gray-600">
                  {new Date(trade.executedAt).toLocaleTimeString()}
                </td>
                <td className="py-3 font-semibold text-gray-900">
                  {trade.symbol}
                </td>
                <td className="py-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-bold ${
                      trade.action === "BUY"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {trade.action}
                  </span>
                </td>
                <td className="py-3 text-gray-700">{trade.quantity}</td>
                <td className="py-3 text-gray-700">
                  ${trade.price.toFixed(2)}
                </td>
                <td className="py-3 font-semibold text-gray-900">
                  ${trade.totalValue.toFixed(2)}
                </td>
                <td className="py-3">
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      trade.source === "AI"
                        ? "text-purple-600"
                        : "text-gray-600"
                    }`}
                  >
                    {trade.source === "AI" ? "🤖" : "✋"} {trade.source}
                  </span>
                </td>
                <td className="py-3">
                  <a
                    href={trade.auditTrailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View audit trail for ${trade.symbol} ${trade.action} at ${new Date(trade.executedAt).toLocaleTimeString()}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="rounded bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:bg-gray-100"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
