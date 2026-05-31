import { NextRequest, NextResponse } from "next/server";
import {
  authenticateRequest,
  validatePaginationParams,
} from "@/lib/auth";

// Mock data - replace with actual database query
const mockDecisions = [
  {
    id: "dec-1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: "BUY",
    symbol: "TSLA",
    recommendedAmount: 500,
    aiConfidence: 87,
    triggerRules: ["RSI < 30", "News sentiment: +0.82"],
    dataSourcesUsed: ["eToro API", "News API", "Technical indicators"],
    status: "pending",
    reason: "Entry rule matched + positive momentum",
  },
  {
    id: "dec-2",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    action: "SELL",
    symbol: "GOOGL",
    recommendedAmount: 280,
    aiConfidence: 95,
    triggerRules: ["Stop-loss at -5%", "Downtrend confirmed"],
    dataSourcesUsed: ["eToro API", "Technical indicators"],
    status: "executed",
    executedAmount: 280,
    executedAt: new Date(Date.now() - 7100000).toISOString(),
    tradeId: "trade-2",
    reason: "Stop-loss triggered at -5%",
  },
  {
    id: "dec-3",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    action: "BUY",
    symbol: "AAPL",
    recommendedAmount: 1500,
    aiConfidence: 72,
    triggerRules: ["RSI < 30", "Price bounce from support"],
    dataSourcesUsed: ["eToro API", "Technical indicators"],
    status: "executed",
    executedAmount: 1500,
    executedAt: new Date(Date.now() - 14300000).toISOString(),
    tradeId: "trade-1",
    reason: "Entry rule: RSI < 30 + news sentiment positive",
  },
  {
    id: "dec-4",
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    action: "BUY",
    symbol: "NVDA",
    recommendedAmount: 800,
    aiConfidence: 65,
    triggerRules: ["Moving average crossover"],
    dataSourcesUsed: ["eToro API", "Technical indicators"],
    status: "rejected",
    rejectionReason: "Insufficient funds",
    reason: "Technical indicator bullish signal",
  },
];

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authError = await authenticateRequest(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const { limit, errors } = validatePaginationParams(searchParams);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database query
    // const decisions = await db.decisions.findMany({ limit });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json(mockDecisions.slice(0, limit));
  } catch (error) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
