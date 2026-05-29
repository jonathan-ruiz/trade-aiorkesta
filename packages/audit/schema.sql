-- Immutable audit log schema for trade-aiorkesta
-- All tables are append-only. No UPDATE or DELETE operations allowed.

CREATE TABLE IF NOT EXISTS decision_log (
    -- Unique identifier for this log entry
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Microsecond precision timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Event type classification
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'RULE_EVAL',
        'DECISION_MADE',
        'TRADE_EXECUTED',
        'CONFIG_CHANGED'
    )),

    -- Rule identifier (if applicable)
    rule_id VARCHAR(255),

    -- Full context serialized as JSON
    data_inputs JSONB NOT NULL,

    -- AI evaluation and reasoning (if applicable)
    ai_eval JSONB,

    -- Final decision/outcome
    decision VARCHAR(50) NOT NULL,

    -- Whether the decision was executed
    executed BOOLEAN NOT NULL DEFAULT false,

    -- Error message if execution failed
    error TEXT,

    -- Digital signature for tamper detection (HMAC-SHA256 of entry)
    signature VARCHAR(64) NOT NULL,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_decision_log_timestamp ON decision_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_decision_log_event_type ON decision_log(event_type);
CREATE INDEX IF NOT EXISTS idx_decision_log_rule_id ON decision_log(rule_id) WHERE rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decision_log_executed ON decision_log(executed);

-- Prevent updates and deletes (append-only enforcement)
CREATE OR REPLACE FUNCTION prevent_decision_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'UPDATE operations not allowed on decision_log (append-only table)';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'DELETE operations not allowed on decision_log (append-only table)';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_decision_log_update
    BEFORE UPDATE ON decision_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_decision_log_modification();

CREATE TRIGGER prevent_decision_log_delete
    BEFORE DELETE ON decision_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_decision_log_modification();
