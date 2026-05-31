"use client";

import { useState, useEffect, useCallback } from "react";

export interface TradeExecution {
  id: string;
  decisionId?: string;
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalValue: number;
  executedAt: string;
  eToroTradeId: string;
  auditTrailUrl: string;
  source: "AI" | "MANUAL";
}

interface UseTradeLogResult {
  trades: TradeExecution[];
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  hasMore: boolean;
}

export function useTradeLog(): UseTradeLogResult {
  const [trades, setTrades] = useState<TradeExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;

  const fetchTrades = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const since = new Date();
      since.setHours(0, 0, 0, 0); // Start of day

      const response = await fetch(
        `/api/trades?since=${since.toISOString()}&limit=${limit}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      const data = await response.json();

      if (reset) {
        setTrades(data);
        setOffset(limit);
      } else {
        setTrades(prev => [...prev, ...data]);
        setOffset(prev => prev + limit);
      }

      setHasMore(data.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchTrades(true);
    // Refresh every 15 seconds for new trades
    const interval = setInterval(() => fetchTrades(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchTrades(false);
    }
  };

  return {
    trades,
    isLoading,
    error,
    loadMore,
    hasMore,
  };
}
