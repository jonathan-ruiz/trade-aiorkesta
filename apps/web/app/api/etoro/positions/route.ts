import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";

// Mock data - replace with actual eToro API integration
const mockPositions = [
  {
    id: "etoro-1",
    symbol: "AAPL",
    quantity: 10,
    entryPrice: 150.0,
    currentPrice: 155.0,
    // Correct P&L calculation: (currentPrice - entryPrice) * quantity
    unrealizedPnL: (155.0 - 150.0) * 10,
    unrealizedPnLPercent: ((155.0 - 150.0) / 150.0) * 100,
    openedAt: new Date(Date.now() - 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "etoro-2",
    symbol: "GOOGL",
    quantity: 5,
    entryPrice: 140.0,
    currentPrice: 138.0,
    unrealizedPnL: (138.0 - 140.0) * 5,
    unrealizedPnLPercent: ((138.0 - 140.0) / 140.0) * 100,
    openedAt: new Date(Date.now() - 172800000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "etoro-3",
    symbol: "TSLA",
    quantity: 8,
    entryPrice: 245.0,
    currentPrice: 250.0,
    unrealizedPnL: (250.0 - 245.0) * 8,
    unrealizedPnLPercent: ((250.0 - 245.0) / 245.0) * 100,
    openedAt: new Date(Date.now() - 43200000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authError = await authenticateRequest(request);
    if (authError) return authError;

    // TODO: Replace with actual eToro API call
    // const positions = await eToroClient.getOpenPositions();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(mockPositions);
  } catch (error) {
    console.error("Error fetching positions:", error);
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
