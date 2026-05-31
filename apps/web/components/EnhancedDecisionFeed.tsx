"use client";

import { useDecisions } from "../hooks/useDecisions";

export function EnhancedDecisionFeed() {
  const { decisions, isLoading, error, filterStatus, setFilterStatus } =
    useDecisions();

  const scrollToTrade = (tradeId: string) => {
    const element = document.getElementById(`trade-${tradeId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-yellow-100");
      setTimeout(() => element.classList.remove("bg-yellow-100"), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        className: "bg-amber-100 text-amber-800",
        icon: "●",
        text: "PENDING",
      },
      executed: {
        className: "bg-green-100 text-green-800",
        icon: "✓",
        text: "EXECUTED",
      },
      rejected: {
        className: "bg-red-100 text-red-800",
        icon: "✕",
        text: "REJECTED",
      },
      partial: {
        className: "bg-blue-100 text-blue-800",
        icon: "◐",
        text: "PARTIAL",
      },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Decision History Feed
        </h2>
        <div className="flex gap-2" role="group" aria-label="Filter decisions by status">
          {["all", "pending", "executed", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              aria-pressed={filterStatus === status}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3">
          <span className="text-sm text-red-800">⚠️ {error}</span>
        </div>
      )}

      {isLoading && decisions.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-gray-200"
            />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <p className="text-sm text-gray-600">No decisions found.</p>
      ) : (
        <div className="space-y-4">
          {decisions.map((decision) => {
            const badge = getStatusBadge(decision.status);
            return (
              <div
                key={decision.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-3 py-1 text-xs font-bold ${
                        decision.action === "BUY"
                          ? "bg-green-100 text-green-800"
                          : decision.action === "SELL"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {decision.action}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {decision.symbol}
                    </span>
                    <span className="text-sm text-gray-600">
                      ${decision.recommendedAmount}
                    </span>
                    <span className={`text-xs font-medium ${badge.className}`}>
                      <span aria-hidden="true">{badge.icon}</span> {badge.text}
                    </span>
                  </div>
                  <time
                    className="text-xs text-gray-500"
                    dateTime={decision.timestamp}
                  >
                    {new Date(decision.timestamp).toLocaleTimeString()}
                  </time>
                </div>

                {/* AI Confidence */}
                <div className="mb-2">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-600">AI Confidence:</span>
                    <span className="font-semibold text-gray-900">
                      {decision.aiConfidence}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      role="meter"
                      aria-label="AI Confidence"
                      aria-valuenow={decision.aiConfidence}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${decision.aiConfidence}%` }}
                    />
                  </div>
                </div>

                {/* Triggers */}
                <div className="mb-2 text-xs text-gray-600">
                  <span className="font-medium">Triggers: </span>
                  {decision.triggerRules.join(", ")}
                </div>

                {/* Reason */}
                <p className="mb-2 text-sm text-gray-700">{decision.reason}</p>

                {/* Trade Link */}
                {decision.status === "executed" && decision.tradeId && (
                  <button
                    onClick={() => scrollToTrade(decision.tradeId!)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    View Trade Execution →
                  </button>
                )}

                {/* Rejection Reason */}
                {decision.status === "rejected" && decision.rejectionReason && (
                  <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-800">
                    Rejected: {decision.rejectionReason}
                  </div>
                )}

                {/* Partial Execution */}
                {decision.status === "partial" && decision.executedAmount && (
                  <div className="mt-2 text-xs text-blue-600">
                    Executed {decision.executedAmount} of{" "}
                    {decision.recommendedAmount} (
                    {(
                      (decision.executedAmount / decision.recommendedAmount) *
                      100
                    ).toFixed(0)}
                    %)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
