import { NextResponse } from "next/server";

// Mock data - replace with actual database query
const mockTrades = [
  {
    id: "trade-1",
    decisionId: "dec-3",
    symbol: "AAPL",
    action: "BUY",
    quantity: 10,
    price: 150.0,
    totalValue: 1500.0,
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
    executedAt: new Date(Date.now() - 43200000).toISOString(),
    eToroTradeId: "etoro-trade-004",
    auditTrailUrl: "/audit/trade-4",
    source: "AI",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // TODO: Replace with actual database query
  // const trades = await db.trades.findMany({
  //   where: { executedAt: { gte: since } },
  //   limit,
  //   offset,
  // });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const paginatedTrades = mockTrades.slice(offset, offset + limit);

  return NextResponse.json(paginatedTrades);
}
