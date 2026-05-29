// Example health check endpoint for /api/health
// Add this to your Next.js app/api/health/route.ts or Express app

// Next.js App Router example:
export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      paperTradingMode: process.env.PAPER_TRADING_MODE === 'true',
    },
    { status: 200 }
  );
}

// Express example:
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     environment: process.env.NODE_ENV,
//     paperTradingMode: process.env.PAPER_TRADING_MODE === 'true',
//   });
// });

// This endpoint should:
// - Return 200 status when healthy
// - Return quickly (< 1s)
// - Check critical dependencies if needed (database, eToro API connectivity)
// - Not require authentication
