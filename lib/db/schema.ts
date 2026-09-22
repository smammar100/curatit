/**
 * Local development schema (SQLite via `node:sqlite`).
 *
 * This mirrors the production Postgres contract in
 * `supabase/migrations/0001_init.sql`. Keep the two in step: the service layer
 * is written against these table and column names.
 */
export const SCHEMA = /* sql */ `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('candidate', 'active', 'deferred'))
);

CREATE TABLE IF NOT EXISTS brands (
  id                     TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  primary_category_id    TEXT NOT NULL REFERENCES categories(id),
  handle                 TEXT NOT NULL,
  profile_url            TEXT NOT NULL,
  market                 TEXT NOT NULL,
  language               TEXT NOT NULL DEFAULT 'en',
  identity_status        TEXT NOT NULL DEFAULT 'unverified'
                         CHECK (identity_status IN ('unverified', 'confirmed', 'ambiguous', 'rejected')),
  audit_status           TEXT NOT NULL DEFAULT 'pending'
                         CHECK (audit_status IN ('pending', 'passed', 'failed')),
  source_approval_status TEXT NOT NULL DEFAULT 'pending'
                         CHECK (source_approval_status IN ('pending', 'approved', 'blocked')),
  ingestion_enabled      INTEGER NOT NULL DEFAULT 0,
  is_demo                INTEGER NOT NULL DEFAULT 0,
  last_success_at        TEXT
);

CREATE TABLE IF NOT EXISTS source_posts (
  id                 TEXT PRIMARY KEY,
  platform           TEXT NOT NULL CHECK (platform IN ('instagram')),
  platform_post_id   TEXT NOT NULL,
  source_url         TEXT NOT NULL,
  brand_id           TEXT NOT NULL REFERENCES brands(id),
  caption            TEXT,
  media_type         TEXT NOT NULL CHECK (media_type IN ('static', 'carousel')),
  published_at       TEXT,
  captured_at        TEXT NOT NULL,
  last_checked_at    TEXT,
  editorial_status   TEXT NOT NULL DEFAULT 'candidate'
                     CHECK (editorial_status IN ('candidate', 'shortlisted', 'rejected')),
  processing_status  TEXT NOT NULL DEFAULT 'pending'
                     CHECK (processing_status IN ('pending', 'running', 'ready', 'failed')),
  publication_status TEXT NOT NULL DEFAULT 'unpublished'
                     CHECK (publication_status IN ('unpublished', 'published', 'removed')),
  reference_status   TEXT NOT NULL DEFAULT 'reference-only'
                     CHECK (reference_status IN ('reference-only', 'licensed', 'owned')),
  rejection_reason   TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  UNIQUE (platform, platform_post_id)
);
CREATE INDEX IF NOT EXISTS source_posts_publication ON source_posts (publication_status, published_at);
CREATE INDEX IF NOT EXISTS source_posts_brand ON source_posts (brand_id);

-- Ordered slides. Static posts have exactly one. 'art' holds the generated
-- demo artwork spec; real ingestion would reference a post_assets row instead.
CREATE TABLE IF NOT EXISTS post_slides (
  id        TEXT PRIMARY KEY,
  post_id   TEXT NOT NULL REFERENCES source_posts(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  alt_text  TEXT NOT NULL,
  art       TEXT NOT NULL,
  ocr_text  TEXT,
  UNIQUE (post_id, position)
);

CREATE TABLE IF NOT EXISTS creative_analyses (
  id                   TEXT PRIMARY KEY,
  post_id              TEXT NOT NULL UNIQUE REFERENCES source_posts(id) ON DELETE CASCADE,
  objective_id         TEXT NOT NULL,
  secondary_objectives TEXT NOT NULL DEFAULT '[]',
  format_id            TEXT NOT NULL,
  hook                 TEXT,
  summary              TEXT NOT NULL,
  visual_styles        TEXT NOT NULL DEFAULT '[]',
  narrative_id         TEXT NOT NULL DEFAULT 'unknown',
  narrative_sequence   TEXT NOT NULL DEFAULT '[]',
  text_density         TEXT NOT NULL CHECK (text_density IN ('low', 'medium', 'high')),
  dominant_colors      TEXT NOT NULL DEFAULT '[]',
  composition          TEXT,
  cta_type             TEXT,
  editorial_reason     TEXT,
  confidence           REAL NOT NULL DEFAULT 0,
  human_reviewed       INTEGER NOT NULL DEFAULT 0,
  taxonomy_version     TEXT NOT NULL,
  prompt_version       TEXT NOT NULL,
  model_version        TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

-- Keyword index over captions, OCR, and reviewed descriptions (plan §26.3).
CREATE VIRTUAL TABLE IF NOT EXISTS post_search USING fts5 (
  post_id UNINDEXED,
  brand,
  caption,
  ocr,
  analysis,
  tokenize = 'porter unicode61'
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS collections (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS collections_workspace ON collections (workspace_id, updated_at);

CREATE TABLE IF NOT EXISTS collection_items (
  id             TEXT PRIMARY KEY,
  collection_id  TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  source_post_id TEXT NOT NULL REFERENCES source_posts(id),
  position       INTEGER NOT NULL,
  note           TEXT NOT NULL DEFAULT '',
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  UNIQUE (collection_id, source_post_id)
);

-- Only the SHA-256 of the share secret is stored, never the secret itself.
CREATE TABLE IF NOT EXISTS collection_shares (
  id            TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT,
  created_at    TEXT NOT NULL,
  created_by    TEXT NOT NULL REFERENCES users(id)
);

-- Pseudonymous product analytics: resource IDs and outcomes, no query text,
-- note text, names, or tokens (plan §30, §34.7).
CREATE TABLE IF NOT EXISTS product_events (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  user_id      TEXT,
  workspace_id TEXT,
  resource_id  TEXT,
  request_id   TEXT,
  success      INTEGER NOT NULL,
  properties   TEXT NOT NULL DEFAULT '{}',
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id            TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  outcome       TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
`;
