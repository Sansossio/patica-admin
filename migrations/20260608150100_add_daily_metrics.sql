-- Daily metric snapshots — schema mirror of api/migrations/20260608150000.
--
-- The api/ cron (`0 0 * * *`, services/daily-metrics.ts) OWNS the writes and the
-- backfill from user_events; this panel only READS the table (DAU chart on the
-- dashboard). This mirror just guarantees the table exists for the panel's local
-- D1 (CREATE TABLE IF NOT EXISTS → harmless no-op against the shared remote D1
-- where api already created it). No backfill here: user_events lives in api/ and
-- may be absent from the panel's local D1.
CREATE TABLE IF NOT EXISTS daily_metrics (
  day        TEXT NOT NULL,        -- 'YYYY-MM-DD' (UTC)
  metric     TEXT NOT NULL,        -- e.g. 'active_users'
  value      INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (day, metric)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_metric ON daily_metrics(metric, day DESC);
