"use client";

import { useState, useEffect, useCallback } from "react";

export interface LivePosition {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  openedAt: string;
  lastUpdated: string;
}

interface UseEToroPositionsResult {
  positions: LivePosition[];
  isLoading: boolean;
  error: string | null;
  isStale: boolean;
  refresh: () => void;
}

export function useEToroPositions(): UseEToroPositionsResult {
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [canRefresh, setCanRefresh] = useState(true);

  const fetchPositions = useCallback(async () => {
    if (!canRefresh) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/etoro/positions");

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }

      const data = await response.json();
      setPositions(data);
      setLastRefresh(Date.now());

      // Cooldown for manual refresh
      setCanRefresh(false);
      setTimeout(() => setCanRefresh(true), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [canRefresh]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // Check if data is stale (>60s since last update)
  const isStale = Date.now() - lastRefresh > 60000;

  return {
    positions,
    isLoading,
    error,
    isStale,
    refresh: fetchPositions,
  };
}
