import { createHmac } from 'crypto';

/**
 * Generate HMAC-SHA256 signature for audit log entry
 * Used for tamper detection
 */
export function generateSignature(
  entry: Record<string, unknown>,
  secret: string = process.env.AUDIT_SECRET || 'default-secret-change-in-production'
): string {
  // Serialize entry deterministically (sorted keys)
  const payload = JSON.stringify(entry, Object.keys(entry).sort());

  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * Verify signature of an audit log entry
 */
export function verifySignature(
  entry: Record<string, unknown>,
  signature: string,
  secret: string = process.env.AUDIT_SECRET || 'default-secret-change-in-production'
): boolean {
  const expectedSignature = generateSignature(entry, secret);
  return expectedSignature === signature;
}
