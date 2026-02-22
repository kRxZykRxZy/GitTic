import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getConfig } from "../config/app-config.js";

/** Singleton database instance */
let _db: Database.Database | null = null;

/**
 * Returns the singleton better-sqlite3 Database instance.
 * Creates the database file and parent directories on first call.
 * Configures WAL mode and production pragmas for optimal performance.
 */
export function getDb(): Database.Database {
  if (_db) return _db;

  const config = getConfig();
  const dbPath = config.db.sqlitePath || "./data/platform.sqlite";

  // Ensure parent directory exists
  mkdirSync(dirname(dbPath), { recursive: true });

  _db = new Database(dbPath);

  // ── Production-optimized pragmas ──────────────────
  // WAL mode for concurrent reads + single writer
  _db.pragma("journal_mode = WAL");

  // Wait up to 5 seconds when the database is locked
  _db.pragma("busy_timeout = 5000");

  // Synchronous NORMAL is safe with WAL and much faster than FULL
  _db.pragma("synchronous = NORMAL");

  // Store temp tables in memory
  _db.pragma("temp_store = MEMORY");

  // Increase cache size to ~64 MB (negative = KiB)
  _db.pragma("cache_size = -64000");

  // Enable memory-mapped I/O (256 MB)
  _db.pragma("mmap_size = 268435456");

  // Enable foreign key enforcement
  _db.pragma("foreign_keys = ON");

  return _db;
}

/**
 * Close the database connection and reset the singleton.
 * Call during graceful shutdown.
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Run a function inside a transaction.
 * Automatically rolls back on error.
 */
export function withTransaction<T>(fn: () => T): T {
  const db = getDb();
  const transaction = db.transaction(fn);
  return transaction();
}
