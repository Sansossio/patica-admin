-- Admin panel (panel.patica.app) — owned by THIS repo.
--
-- These tables live in the SAME D1 database (patica-db) as the API. The split:
--   * api repo owns the ban columns on `users` (migration
--     20260608120000_add_user_ban.sql) + ban enforcement.
--   * admin repo (this file) owns `admin_users` + `admin_audit_log`.
-- Because both repos point wrangler at the same database and wrangler tracks
-- applied migrations by filename (timestamps are globally unique), each repo
-- only applies its own files and they never collide. Keep both repos' DDL in
-- sync — any further schema change must be reflected in both.

-- Allowlist of Google accounts permitted to sign into the admin panel.
CREATE TABLE IF NOT EXISTS admin_users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login_at DATETIME,
  created_at    DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email COLLATE NOCASE);

-- Append-only audit trail of every privileged action taken from the panel.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action      TEXT NOT NULL,                 -- user.ban | user.unban | report.resolve | report.review | dog.deactivate | dog.activate | auth.login | ...
  target_type TEXT,                          -- user | dog | report | conversation | ...
  target_id   TEXT,
  metadata    TEXT NOT NULL DEFAULT '{}',    -- stringified JSON (reason, before/after, etc.)
  created_at  DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id, created_at DESC);

-- Append-only ban/unban history. Holds the detail of each moderation action;
-- the live enforcement state is the single `users.banned_until` column (owned
-- by the api repo migration 20260608120000_add_user_ban.sql).
--
--   action='ban'   -> banned_until = applied expiry (NULL row value = permanent;
--                     users.banned_until is set to the far-future sentinel).
--   action='unban' -> banned_until = NULL (users.banned_until cleared).
CREATE TABLE IF NOT EXISTS user_bans (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  action       TEXT NOT NULL CHECK (action IN ('ban', 'unban')),
  banned_until DATETIME,                    -- NULL on a 'ban' row = permanent; always NULL on 'unban'
  reason       TEXT,
  admin_email  TEXT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_bans_created ON user_bans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_bans_admin ON user_bans(admin_email, created_at DESC);

-- Seed the first admin (the only allowed account for now).
INSERT OR IGNORE INTO admin_users (id, email, name, role)
VALUES ('adm_seed_julio', 'juliosansossio@gmail.com', 'Julio Sansossio', 'superadmin');
