/**
 * Audit Logger Adapter
 *
 * Adapts @trade-aiorkesta/audit to orchestrator interface
 */

import { AuditWriter } from '../../../../packages/audit/src/writer';
import type { AuditEvent } from '../../../../packages/audit/src/types';
import type { IAuditLogger, HealthCheckResult, DatabaseConfig } from '../types';

export class AuditLoggerAdapter implements IAuditLogger {
  private writer: AuditWriter;
  private healthy = false;

  constructor(dbConfig: DatabaseConfig) {
    // Connection string for PostgreSQL
    const connectionString =
      `postgresql://${dbConfig.user}:${dbConfig.password}@` +
      `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

    this.writer = new AuditWriter(connectionString);
  }

  async initialize(): Promise<void> {
    try {
      await this.writer.initialize();
      this.healthy = true;
    } catch (error) {
      console.error('[AuditLogger] Initialization failed:', error);
      this.healthy = false;
      throw error;
    }
  }

  async log(event: AuditEvent): Promise<void> {
    try {
      await this.writer.log(event);
    } catch (error) {
      console.error('[AuditLogger] Failed to log event:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Simple health check - verify database connection
      const testEvent: AuditEvent = {
        eventType: 'CONFIG_CHANGED',
        timestamp: new Date(),
        data: { healthCheck: true },
        metadata: {},
      };

      await this.writer.log(testEvent);

      const responseTime = Date.now() - start;
      this.healthy = true;

      return {
        component: 'audit-logger',
        healthy: true,
        message: 'Database connection healthy',
        lastCheck: new Date(),
        responseTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.healthy = false;

      return {
        component: 'audit-logger',
        healthy: false,
        message: `Database error: ${errorMsg}`,
        lastCheck: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }

  async close(): Promise<void> {
    await this.writer.close();
    this.healthy = false;
  }
}
