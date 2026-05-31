import { NextRequest, NextResponse } from "next/server";
import {
  authenticateRequest,
  validatePaginationParams,
} from "@/lib/auth";

// Mock data - replace with actual database query
// NOTE: For SELL trades, costBasis and realizedPnL should be calculated
const mockTrades = [
  {
    id: "trade-1",
    decisionId: "dec-3",
    symbol: "AAPL",
    action: "BUY",
    quantity: 10,
    price: 150.0,
    totalValue: 1500.0,
    costBasis: 150.0, // Entry price for buy
    realizedPnL: null, // No realized P&L on buy
    executedAt: new Date(Date.now() - 14300000).toISOString(),
    eToroTradeId: "etoro-trade-001",
    auditTrailUrl: "/audit/trade-1",
    source: "AI",
  },
  {
    id: "trade-2",
    decisionId: "dec-2",
    symbol: "GOOGL",
    action: "SELL",
    quantity: 2,
    price: 140.0,
    totalValue: 280.0,
    costBasis: 135.0, // Original entry price
    realizedPnL: (140.0 - 135.0) * 2, // $10 profit
    executedAt: new Date(Date.now() - 7100000).toISOString(),
    eToroTradeId: "etoro-trade-002",
    auditTrailUrl: "/audit/trade-2",
    source: "AI",
  },
  {
    id: "trade-3",
    decisionId: undefined,
    symbol: "MSFT",
    action: "BUY",
    quantity: 5,
    price: 320.0,
    totalValue: 1600.0,
    costBasis: 320.0,
    realizedPnL: null,
    executedAt: new Date(Date.now() - 21600000).toISOString(),
    eToroTradeId: "etoro-trade-003",
    auditTrailUrl: "/audit/trade-3",
    source: "MANUAL",
  },
  {
    id: "trade-4",
    decisionId: undefined,
    symbol: "TSLA",
    action: "BUY",
    quantity: 8,
    price: 245.0,
    totalValue: 1960.0,
    costBasis: 245.0,
    realizedPnL: null,
    executedAt: new Date(Date.now() - 43200000).toISOString(),
    eToroTradeId: "etoro-trade-004",
    auditTrailUrl: "/audit/trade-4",
    source: "AI",
  },
];

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authError = await authenticateRequest(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const { limit, offset, errors } = validatePaginationParams(searchParams);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database query
    // const trades = await db.trades.findMany({
    //   where: { executedAt: { gte: since } },
    //   take: limit,
    //   skip: offset,
    // });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const paginatedTrades = mockTrades.slice(offset, offset + limit);

    return NextResponse.json(paginatedTrades);
  } catch (error) {
    console.error("Error fetching trades:", error);
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
