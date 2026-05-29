import { Pool, PoolClient } from 'pg';
import { DecisionLogEntry, DecisionLogRow, AuditLogQuery } from './types';
import { generateSignature, verifySignature } from './signature';

export class AuditWriter {
  private pool: Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString:
        connectionString || process.env.DATABASE_URL || 'postgresql://localhost:5432/trade_aiorkesta',
    });
  }

  /**
   * Write an entry to the decision log
   * Returns the created entry with id, timestamp, and signature
   */
  async logDecision(entry: DecisionLogEntry): Promise<DecisionLogRow> {
    const client = await this.pool.connect();

    try {
      // Prepare entry for signing (without signature field)
      const entryForSigning = {
        event_type: entry.event_type,
        rule_id: entry.rule_id || null,
        data_inputs: entry.data_inputs,
        ai_eval: entry.ai_eval || null,
        decision: entry.decision,
        executed: entry.executed,
        error: entry.error || null,
        metadata: entry.metadata || {},
      };

      // Generate signature
      const signature = generateSignature(entryForSigning);

      // Insert into database
      const result = await client.query<DecisionLogRow>(
        `INSERT INTO decision_log (
          event_type,
          rule_id,
          data_inputs,
          ai_eval,
          decision,
          executed,
          error,
          signature,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          entryForSigning.event_type,
          entryForSigning.rule_id,
          JSON.stringify(entryForSigning.data_inputs),
          entryForSigning.ai_eval ? JSON.stringify(entryForSigning.ai_eval) : null,
          entryForSigning.decision,
          entryForSigning.executed,
          entryForSigning.error,
          signature,
          JSON.stringify(entryForSigning.metadata),
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Query decision log entries
   */
  async query(params: AuditLogQuery = {}): Promise<DecisionLogRow[]> {
    const client = await this.pool.connect();

    try {
      const conditions: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (params.event_type) {
        conditions.push(`event_type = $${paramIndex++}`);
        values.push(params.event_type);
      }

      if (params.rule_id) {
        conditions.push(`rule_id = $${paramIndex++}`);
        values.push(params.rule_id);
      }

      if (params.start_time) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        values.push(params.start_time);
      }

      if (params.end_time) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        values.push(params.end_time);
      }

      if (params.executed !== undefined) {
        conditions.push(`executed = $${paramIndex++}`);
        values.push(params.executed);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = params.limit || 100;
      const offset = params.offset || 0;

      const query = `
        SELECT * FROM decision_log
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      values.push(limit, offset);

      const result = await client.query<DecisionLogRow>(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Verify integrity of a log entry
   */
  async verifyEntry(id: string): Promise<{ valid: boolean; entry?: DecisionLogRow }> {
    const client = await this.pool.connect();

    try {
      const result = await client.query<DecisionLogRow>(
        'SELECT * FROM decision_log WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      const entry = result.rows[0];
      const { signature, ...entryWithoutSignature } = entry;

      const isValid = verifySignature(entryWithoutSignature, signature);

      return { valid: isValid, entry };
    } finally {
      client.release();
    }
  }

  /**
   * Get statistics about logged decisions
   */
  async getStats(): Promise<{
    total_entries: number;
    by_event_type: Record<string, number>;
    executed_count: number;
    error_count: number;
  }> {
    const client = await this.pool.connect();

    try {
      const [totalResult, eventTypeResult, executedResult, errorResult] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM decision_log'),
        client.query(`
          SELECT event_type, COUNT(*) as count
          FROM decision_log
          GROUP BY event_type
        `),
        client.query('SELECT COUNT(*) as count FROM decision_log WHERE executed = true'),
        client.query('SELECT COUNT(*) as count FROM decision_log WHERE error IS NOT NULL'),
      ]);

      const by_event_type: Record<string, number> = {};
      for (const row of eventTypeResult.rows) {
        by_event_type[row.event_type] = parseInt(row.count, 10);
      }

      return {
        total_entries: parseInt(totalResult.rows[0].count, 10),
        by_event_type,
        executed_count: parseInt(executedResult.rows[0].count, 10),
        error_count: parseInt(errorResult.rows[0].count, 10),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
