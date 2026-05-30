"use client";

import { useState, useEffect } from "react";

interface KillSwitchProps {
  currentPositionsCount: number;
  estimatedPnL: number;
}

export function KillSwitch({
  currentPositionsCount,
  estimatedPnL,
}: KillSwitchProps) {
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    // Check for active kill switch in localStorage
    const active = localStorage.getItem("kill-switch-active");
    const endTime = localStorage.getItem("kill-switch-cooldown-end");

    if (active === "true" && endTime) {
      const end = new Date(endTime);
      if (end > new Date()) {
        setIsActive(true);
        setCooldownEnd(end);
      } else {
        // Cooldown expired, clear
        localStorage.removeItem("kill-switch-active");
        localStorage.removeItem("kill-switch-cooldown-end");
      }
    }
  }, []);

  useEffect(() => {
    if (!cooldownEnd) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = cooldownEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setIsActive(false);
        setCooldownEnd(null);
        localStorage.removeItem("kill-switch-active");
        localStorage.removeItem("kill-switch-cooldown-end");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const openModal = () => {
    setShowModal(true);
    setStep(1);
    setConfirmText("");
  };

  const handleStep1Continue = () => {
    if (confirmText.toLowerCase() === "stop trading") {
      setStep(2);
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);

    try {
      const response = await fetch("/api/kill-switch/activate", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to activate kill switch");
      }

      // Set 24-hour cooldown
      const end = new Date();
      end.setHours(end.getHours() + 24);

      setIsActive(true);
      setCooldownEnd(end);
      setShowModal(false);

      localStorage.setItem("kill-switch-active", "true");
      localStorage.setItem("kill-switch-cooldown-end", end.toISOString());
    } catch (err) {
      alert(
        `Error activating kill switch: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsActivating(false);
    }
  };

  if (isActive) {
    return (
      <div className="fixed right-6 top-6 w-80 rounded-lg border-2 border-red-600 bg-white p-4 shadow-lg">
        <div className="text-center">
          <div className="mb-2 text-lg font-bold text-red-600">
            🛑 TRADING HALTED
          </div>
          <p className="mb-2 text-sm text-gray-700">All positions closed.</p>
          <p className="mb-2 text-sm text-gray-700">
            Trading disabled for{" "}
            <span className="font-semibold" role="status" aria-live="polite">
              {timeRemaining}
            </span>
            .
          </p>
          <p className="mb-4 text-xs text-gray-500">
            Reactivate at:{" "}
            {cooldownEnd?.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <button
            disabled
            className="w-full rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500"
          >
            Override Lock (requires PIN)
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Kill Switch Button */}
      <button
        onClick={openModal}
        aria-label="Emergency stop: halt all trading and close positions"
        className="fixed right-6 top-6 min-h-[48px] rounded-lg border-2 border-red-600 bg-red-600 px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700"
      >
        🛑 EMERGENCY STOP
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            {step === 1 ? (
              <>
                <h3 className="mb-4 text-xl font-bold text-gray-900">
                  ⚠️ CONFIRM EMERGENCY STOP
                </h3>
                <div className="mb-4 space-y-2 text-sm text-gray-700">
                  <p>This will:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Halt all pending AI decisions</li>
                    <li>Close all open positions at market</li>
                    <li>Disable trading for 24 hours</li>
                  </ul>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="confirm-input"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Type "STOP TRADING" to confirm:
                  </label>
                  <input
                    id="confirm-input"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    aria-required="true"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStep1Continue}
                    disabled={confirmText.toLowerCase() !== "stop trading"}
                    className="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    Continue →
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mb-4 text-xl font-bold text-red-600">
                  🛑 FINAL CONFIRMATION
                </h3>
                <div className="mb-4 text-sm text-gray-700">
                  <p className="mb-3">
                    You are about to stop all trading. This action CANNOT be
                    undone.
                  </p>
                  <div className="rounded bg-gray-50 p-3">
                    <p className="mb-1">
                      Current open positions:{" "}
                      <span className="font-semibold">
                        {currentPositionsCount}
                      </span>
                    </p>
                    <p>
                      Estimated P&L if closed now:{" "}
                      <span
                        className={`font-semibold ${
                          estimatedPnL >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {estimatedPnL >= 0 ? "+" : ""}${estimatedPnL.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isActivating}
                    className="flex-1 rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300 disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActivate}
                    disabled={isActivating}
                    className="flex-1 rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-red-400"
                  >
                    {isActivating ? "Activating..." : "🛑 ACTIVATE KILL SWITCH"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
