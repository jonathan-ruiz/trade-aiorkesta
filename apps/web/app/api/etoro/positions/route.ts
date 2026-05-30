import { NextResponse } from "next/server";

// Mock data - replace with actual eToro API integration
const mockPositions = [
  {
    id: "etoro-1",
    symbol: "AAPL",
    quantity: 10,
    entryPrice: 150.0,
    currentPrice: 155.0,
    unrealizedPnL: 50.0,
    unrealizedPnLPercent: 3.33,
    openedAt: new Date(Date.now() - 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "etoro-2",
    symbol: "GOOGL",
    quantity: 5,
    entryPrice: 140.0,
    currentPrice: 138.0,
    unrealizedPnL: -10.0,
    unrealizedPnLPercent: -1.43,
    openedAt: new Date(Date.now() - 172800000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "etoro-3",
    symbol: "TSLA",
    quantity: 8,
    entryPrice: 245.0,
    currentPrice: 250.0,
    unrealizedPnL: 40.0,
    unrealizedPnLPercent: 2.04,
    openedAt: new Date(Date.now() - 43200000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];

export async function GET() {
  // TODO: Replace with actual eToro API call
  // const positions = await eToroClient.getOpenPositions();

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(mockPositions);
}
