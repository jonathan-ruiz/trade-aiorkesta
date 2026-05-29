"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RiskDisclaimer() {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    if (acknowledged) {
      // Store acknowledgment in localStorage
      localStorage.setItem("risk-acknowledged", "true");
      router.push("/config");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-8 shadow-2xl">
        {/* Header with warning icon */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Risk Disclosure
            </h1>
            <p className="text-sm text-gray-600">
              trade.aiorkesta.com
            </p>
          </div>
        </div>

        {/* Main warning content */}
        <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-6">
          <h2 className="mb-4 text-xl font-bold text-red-900">
            ⚠️ THIS SOFTWARE PLACES REAL TRADES
          </h2>
          <p className="mb-4 text-base font-semibold text-red-800">
            Trading involves substantial risk of loss. You can lose all invested
            capital.
          </p>
          <ul className="space-y-2 text-sm text-gray-800">
            <li className="flex gap-2">
              <span className="text-red-600">•</span>
              <span>AI decisions can be wrong</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-600">•</span>
              <span>Software bugs can cause losses</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-600">•</span>
              <span>
                External data can be incorrect, delayed, or manipulated
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-600">•</span>
              <span>Past performance does not predict future results</span>
            </li>
          </ul>
        </div>

        {/* Recommendation */}
        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">
            ✓ Recommendation
          </h3>
          <p className="text-sm text-blue-800">
            Provide a <strong>demo/simulated eToro API key</strong> first. Switch
            to real-money credentials only after auditing every decision path.
          </p>
        </div>

        {/* Liability disclaimer */}
        <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4">
          <p className="text-xs text-gray-700">
            This tool is provided as-is with <strong>no warranty</strong>.
            Authors accept <strong>no liability</strong> for trading losses or
            any consequence of using this software. You are 100% responsible for
            trades placed.
          </p>
        </div>

        {/* Acknowledgment checkbox */}
        <div className="mb-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <span className="text-sm text-gray-800">
              I acknowledge that I have read and understood the risk disclosure
              above. I understand that this software can place real trades using
              my eToro API key, and I accept full responsibility for any trades
              executed and any resulting financial losses.
            </span>
          </label>
        </div>

        {/* Action button */}
        <button
          onClick={handleAcknowledge}
          disabled={!acknowledged}
          className={`w-full rounded-lg px-6 py-3 text-base font-semibold text-white transition-colors ${
            acknowledged
              ? "bg-red-600 hover:bg-red-700"
              : "cursor-not-allowed bg-gray-300"
          }`}
        >
          I Acknowledge and Proceed
        </button>
      </div>
    </div>
  );
}
