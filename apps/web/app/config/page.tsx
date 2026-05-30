"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RuleConfig {
  paperTradingMode: boolean;
  dailyLossLimit: number;
  maxPositionSize: number;
  stopLossPercent: number;
  manualApprovalThreshold: number;
  etoroApiKey: string;
}

export default function ConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<RuleConfig>({
    paperTradingMode: true,
    dailyLossLimit: 500,
    maxPositionSize: 1000,
    stopLossPercent: 5,
    manualApprovalThreshold: 100,
    etoroApiKey: "",
  });

  useEffect(() => {
    // Check if risk was acknowledged
    const acknowledged = localStorage.getItem("risk-acknowledged");
    if (!acknowledged) {
      router.push("/");
    }
  }, [router]);

  const handleSave = () => {
    // Save config to localStorage (in real app, would send to backend)
    localStorage.setItem("trading-config", JSON.stringify(config));
    alert("Configuration saved successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Trading Rule Configuration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure your trading rules, risk limits, and API credentials
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex gap-4">
          <Link
            href="/config"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Config
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Dashboard
          </Link>
        </div>

        {/* Config Form */}
        <div className="space-y-6">
          {/* Safety Mode */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Safety Mode
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">
                  Paper Trading Mode
                </label>
                <p className="text-sm text-gray-600">
                  Simulate trades without real money (Recommended: ON)
                </p>
              </div>
              <button
                onClick={() =>
                  setConfig({
                    ...config,
                    paperTradingMode: !config.paperTradingMode,
                  })
                }
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  config.paperTradingMode ? "bg-green-600" : "bg-red-600"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    config.paperTradingMode ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Risk Limits */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Risk Limits
            </h2>
            <div className="space-y-4">
              {/* Daily Loss Limit */}
              <div>
                <label className="mb-2 block font-medium text-gray-900">
                  Daily Loss Limit ($)
                </label>
                <input
                  type="number"
                  value={config.dailyLossLimit}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dailyLossLimit: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Trading stops automatically when daily loss exceeds this amount
                </p>
              </div>

              {/* Max Position Size */}
              <div>
                <label className="mb-2 block font-medium text-gray-900">
                  Maximum Position Size ($)
                </label>
                <input
                  type="number"
                  value={config.maxPositionSize}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxPositionSize: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Maximum dollar amount for a single trade
                </p>
              </div>

              {/* Stop Loss */}
              <div>
                <label className="mb-2 block font-medium text-gray-900">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  value={config.stopLossPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      stopLossPercent: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Automatically exit position when loss exceeds this percentage
                </p>
              </div>

              {/* Manual Approval Threshold */}
              <div>
                <label className="mb-2 block font-medium text-gray-900">
                  Manual Approval Threshold ($)
                </label>
                <input
                  type="number"
                  value={config.manualApprovalThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      manualApprovalThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Trades above this amount require manual approval before
                  execution
                </p>
              </div>
            </div>
          </div>

          {/* API Credentials */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              eToro API Credentials
            </h2>
            <div className="mb-4 rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Security Note:</strong> Use a demo/simulated API key
                for testing. Never share your API key.
              </p>
            </div>
            <div>
              <label className="mb-2 block font-medium text-gray-900">
                API Key
              </label>
              <input
                type="password"
                value={config.etoroApiKey}
                onChange={(e) =>
                  setConfig({ ...config, etoroApiKey: e.target.value })
                }
                placeholder="Enter your eToro API key"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-600">
                Get your API key from{" "}
                <a
                  href="https://api-portal.etoro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  api-portal.etoro.com
                </a>
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Save Configuration
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-300"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
