"use client";

import { useState, useEffect, useCallback } from "react";

export interface EnhancedDecision {
  id: string;
  timestamp: string;
  action: "BUY" | "SELL" | "HOLD";
  symbol: string;
  recommendedAmount: number;
  aiConfidence: number;
  triggerRules: string[];
  dataSourcesUsed: string[];
  status: "pending" | "executed" | "rejected" | "partial";
  executedAmount?: number;
  executedAt?: string;
  rejectionReason?: string;
  tradeId?: string;
  reason: string;
}

interface UseDecisionsResult {
  decisions: EnhancedDecision[];
  isLoading: boolean;
  error: string | null;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export function useDecisions(limit: number = 20): UseDecisionsResult {
  const [decisions, setDecisions] = useState<EnhancedDecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchDecisions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/decisions?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch decisions: ${response.statusText}`);
      }

      const data = await response.json();
      setDecisions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchDecisions();
    // Refresh every 30 seconds for new decisions
    const interval = setInterval(fetchDecisions, 30000);
    return () => clearInterval(interval);
  }, [fetchDecisions]);

  const filteredDecisions = filterStatus === "all"
    ? decisions
    : decisions.filter(d => d.status === filterStatus);

  return {
    decisions: filteredDecisions,
    isLoading,
    error,
    filterStatus,
    setFilterStatus,
  };
}
