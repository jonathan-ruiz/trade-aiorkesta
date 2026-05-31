import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication middleware for API routes
 * Validates API key from Authorization header or X-API-Key header
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<NextResponse | null> {
  // Check for API key in headers
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");

  const apiKey = authHeader?.replace("Bearer ", "") || apiKeyHeader;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Unauthorized", message: "API key required" },
      { status: 401 }
    );
  }

  // TODO: Replace with actual API key validation from database
  // For now, check against environment variable
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.error("API_KEY not configured in environment");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (apiKey !== validApiKey) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid API key" },
      { status: 401 }
    );
  }

  // Authentication successful
  return null;
}

/**
 * Validates query parameters for pagination
 */
export function validatePaginationParams(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
  errors: string[];
} {
  const errors: string[] = [];
  let limit = parseInt(searchParams.get("limit") || "20");
  let offset = parseInt(searchParams.get("offset") || "0");

  // Validate limit
  if (isNaN(limit) || limit < 1) {
    errors.push("limit must be a positive integer");
    limit = 20; // default
  }
  if (limit > 100) {
    errors.push("limit cannot exceed 100");
    limit = 100; // cap at max
  }

  // Validate offset
  if (isNaN(offset) || offset < 0) {
    errors.push("offset must be a non-negative integer");
    offset = 0; // default
  }

  return { limit, offset, errors };
}
