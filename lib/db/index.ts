import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { SCHEMA } from "./schema";
import { seedDemoLibrary } from "./seed";

/**
 * Local persistence for development and demos.
 *
 * Production targets Supabase Postgres (see supabase/migrations). Everything
 * outside `lib/db` and `lib/services` talks to the service layer, so swapping
 * the store does not touch routes or components.
 */

const DB_PATH = process.env.CURATIT_DB_PATH ?? path.join(process.cwd(), "data", "curatit.db");

type GlobalWithDb = typeof globalThis & { __curatitDb?: DatabaseSync };

function open(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA busy_timeout = 5000;");
  database.exec(SCHEMA);

  const { count } = database.prepare("SELECT COUNT(*) AS count FROM categories").get() as {
    count: number;
  };
  if (count === 0) seedDemoLibrary(database);

  return database;
}

/** One connection per server process; survives dev hot reloads. */
export function db(): DatabaseSync {
  const store = globalThis as GlobalWithDb;
  store.__curatitDb ??= open();
  return store.__curatitDb;
}

export type Row = Record<string, SQLInputValue>;

export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return db().prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return db().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: SQLInputValue[]) {
  return db().prepare(sql).run(...params);
}

/**
 * Run `fn` atomically. node:sqlite is synchronous, so a transaction can never
 * interleave with another request inside the same process.
 */
export function transaction<T>(fn: () => T): T {
  const database = db();
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function now() {
  return new Date().toISOString();
}

export function newId() {
  return randomUUID();
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
