# Security Implementation - PR #20

## Critical Security Fixes Applied

This document outlines the security measures implemented to address the critical vulnerabilities identified in PR #20.

### 1. Authentication Middleware ✅

**Location:** `lib/auth.ts`

**Implementation:**
- API key-based authentication for all API routes
- Supports both `Authorization: Bearer <key>` and `X-API-Key` headers
- Returns 401 for missing or invalid API keys

**Usage:**
```typescript
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = await authenticateRequest(request);
  if (authError) return authError;
  
  // Proceed with authenticated logic
}
```

**Protected Routes:**
- ✅ `/api/decisions`
- ✅ `/api/etoro/positions`
- ✅ `/api/trades`
- ✅ `/api/kill-switch/activate`

### 2. Server-Side Kill Switch with DB Persistence ✅

**Location:** `app/api/kill-switch/activate/route.ts`

**Security Features:**
- **Idempotency Check:** Prevents duplicate kill switch activations
- **Server-Side Persistence:** Kill switch state stored in database (not localStorage)
- **Audit Logging:** All activation attempts logged with timestamp, user, and IP
- **24-Hour Cooldown:** Enforced at database level

**Database Schema:**
```sql
-- Kill switch record
CREATE TABLE kill_switches (
  id TEXT PRIMARY KEY,
  activated_at TIMESTAMP DEFAULT NOW(),
  activated_by TEXT NOT NULL,
  cooldown_end TIMESTAMP NOT NULL,
  positions_closed INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  reason TEXT
);

-- Audit trail
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Input Validation ✅

**Location:** `lib/auth.ts` - `validatePaginationParams()`

**Rules Enforced:**
- `limit`: Must be positive integer, capped at 100 (default: 20)
- `offset`: Must be non-negative integer (default: 0)
- Returns validation errors in standardized format

**Example Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    "limit cannot exceed 100",
    "offset must be a non-negative integer"
  ]
}
```

### 4. Error Handling ✅

**All GET routes now wrapped in try/catch:**
- `/api/decisions` - Returns 500 with error details on failure
- `/api/etoro/positions` - Returns 500 with error details on failure
- `/api/trades` - Returns 500 with error details on failure
- `/api/kill-switch/activate` - Returns 500 with error details on failure

**Error Response Format:**
```json
{
  "error": "Internal server error",
  "message": "Descriptive error message"
}
```

### 5. P&L Calculation Fix ✅

**Fixed Cost Basis Tracking:**

**Before (Incorrect):**
```typescript
// Just summed trades without tracking cost basis
unrealizedPnL: 50.0  // Hard-coded, no calculation
```

**After (Correct):**
```typescript
// Positions: Proper unrealized P&L calculation
unrealizedPnL: (currentPrice - entryPrice) * quantity
unrealizedPnLPercent: ((currentPrice - entryPrice) / entryPrice) * 100

// Trades: Track cost basis for realized P&L
{
  action: "SELL",
  price: 140.0,
  costBasis: 135.0,  // Original entry price
  realizedPnL: (140.0 - 135.0) * quantity  // Actual profit/loss
}
```

### 6. TypeScript Interfaces ✅

**Location:** `types/index.ts`

All API responses now have strict TypeScript types:
- `Decision`
- `Position`
- `Trade`
- `KillSwitchResponse`
- `KillSwitchRecord`
- `AuditLog`
- `ValidationError`
- `ApiError`

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/web
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/etoro_trader?schema=public"

# API Authentication
# Generate with: openssl rand -base64 32
API_KEY="your-secure-api-key-here"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 4. Test Authentication

```bash
# Should return 401 Unauthorized
curl http://localhost:3000/api/positions

# Should return 200 OK
curl -H "X-API-Key: your-secure-api-key-here" \
  http://localhost:3000/api/positions
```

## Security Checklist

- [x] Auth middleware on all API routes
- [x] Server-side kill switch with DB persistence
- [x] Kill switch idempotency check
- [x] Audit logging for critical actions
- [x] Input validation (limit max 100, offset >= 0)
- [x] Error handling on all routes
- [x] P&L calculation with cost basis tracking
- [x] TypeScript interfaces for type safety
- [ ] CSRF protection (future enhancement)
- [ ] Rate limiting (future enhancement)

## Future Enhancements

### Rate Limiting
Add rate limiting to prevent API abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### CSRF Protection
For browser-based clients, add CSRF tokens:

```typescript
import csrf from 'csurf';
const csrfProtection = csrf({ cookie: true });
```

## Questions?

Contact: @jordan-backend-engineer in #general
