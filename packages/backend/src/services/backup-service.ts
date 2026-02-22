import { existsSync, mkdirSync, cpSync, statSync, readdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { getDb } from "../db/connection.js";
import { getConfig } from "../config/app-config.js";

/**
 * Backup service for database and git repository data.
 *
 * Supports:
 * - SQLite database backups using the `.backup()` API
 * - Git pack backups by copying the repository storage directory
 * - Configurable schedule and retention policy
 */

/** Backup metadata. */
export interface BackupInfo {
  /** Unique identifier (timestamp-based). */
  id: string;
  /** Type of backup: "database" or "git". */
  type: "database" | "git";
  /** Absolute path to the backup file or directory. */
  path: string;
  /** Size in bytes. */
  sizeBytes: number;
  /** ISO timestamp when the backup was created. */
  createdAt: string;
}

/** Backup configuration options. */
export interface BackupConfig {
  /** Directory to store backups in. */
  backupDir: string;
  /** Maximum number of backups to retain. Oldest are pruned. */
  maxRetained: number;
  /** Backup interval in milliseconds (for scheduling). */
  intervalMs: number;
}

/** Default backup configuration. */
const DEFAULT_CONFIG: BackupConfig = {
  backupDir: "./data/backups",
  maxRetained: 10,
  intervalMs: 24 * 60 * 60 * 1000, // 24 hours
};

/** Interval handle for scheduled backups. */
let _scheduleInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Generate a timestamped backup ID.
 */
function generateBackupId(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-");
}

/**
 * Ensure the backup directory exists.
 */
function ensureBackupDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get the size of a file or directory in bytes.
 */
function getSize(path: string): number {
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      let total = 0;
      const entries = readdirSync(path, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(path, entry.name);
        total += getSize(fullPath);
      }
      return total;
    }
    return stat.size;
  } catch {
    return 0;
  }
}

/**
 * Back up the SQLite database using the better-sqlite3
 * `.backup()` API. This creates a consistent point-in-time
 * snapshot even while the database is being written to.
 *
 * @param config - Backup configuration (uses defaults if omitted).
 * @returns Metadata about the created backup.
 */
export async function backupDatabase(
  config: Partial<BackupConfig> = {},
): Promise<BackupInfo> {
  const opts = { ...DEFAULT_CONFIG, ...config };
  ensureBackupDir(opts.backupDir);

  const id = generateBackupId();
  const backupPath = resolve(opts.backupDir, `db-${id}.sqlite`);

  const db = getDb();

  // Use better-sqlite3's backup API
  await db.backup(backupPath);

  const sizeBytes = getSize(backupPath);
  const info: BackupInfo = {
    id,
    type: "database",
    path: backupPath,
    sizeBytes,
    createdAt: new Date().toISOString(),
  };

  console.log(
    `[backup] Database backup created: ${backupPath} (${Math.round(sizeBytes / 1024)}KB)`,
  );

  // Prune old backups
  pruneBackups(opts.backupDir, "db-", opts.maxRetained);

  return info;
}

/**
 * Back up all git repositories by copying the storage directory.
 *
 * This performs a filesystem-level copy of the git pack files.
 * For bare repositories this captures the complete state.
 *
 * @param config - Backup configuration (uses defaults if omitted).
 * @returns Metadata about the created backup.
 */
export function backupGitRepos(
  config: Partial<BackupConfig> = {},
): BackupInfo {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const appConfig = getConfig();

  const repoDir = resolve(appConfig.dataDir, "repos");
  if (!existsSync(repoDir)) {
    console.warn("[backup] No repos directory found, skipping git backup");
    return {
      id: generateBackupId(),
      type: "git",
      path: "",
      sizeBytes: 0,
      createdAt: new Date().toISOString(),
    };
  }

  const id = generateBackupId();
  const backupPath = resolve(opts.backupDir, `git-${id}`);

  ensureBackupDir(backupPath);

  // Copy the entire repos directory
  cpSync(repoDir, backupPath, { recursive: true });

  const sizeBytes = getSize(backupPath);
  const info: BackupInfo = {
    id,
    type: "git",
    path: backupPath,
    sizeBytes,
    createdAt: new Date().toISOString(),
  };

  console.log(
    `[backup] Git repos backup created: ${backupPath} (${Math.round(sizeBytes / 1024 / 1024)}MB)`,
  );

  // Prune old backups
  pruneBackups(opts.backupDir, "git-", opts.maxRetained);

  return info;
}

/**
 * Remove old backups that exceed the retention limit.
 *
 * @param dir      - The backup directory to scan.
 * @param prefix   - File/directory name prefix to filter by.
 * @param maxKeep  - Maximum number of backups to retain.
 */
function pruneBackups(dir: string, prefix: string, maxKeep: number): void {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir)
    .filter((name) => name.startsWith(prefix))
    .sort(); // Oldest first (timestamp-based names)

  const toDelete = entries.slice(0, Math.max(0, entries.length - maxKeep));

  for (const entry of toDelete) {
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        // Use recursive rm
        const { rmSync } = require("node:fs");
        rmSync(fullPath, { recursive: true, force: true });
      } else {
        const { unlinkSync } = require("node:fs");
        unlinkSync(fullPath);
      }
      console.log(`[backup] Pruned old backup: ${entry}`);
    } catch (err) {
      console.error(`[backup] Failed to prune ${entry}:`, err);
    }
  }
}

/**
 * Run a full backup (database + git repos).
 *
 * @param config - Backup configuration.
 * @returns Array of backup metadata.
 */
export async function runFullBackup(
  config: Partial<BackupConfig> = {},
): Promise<BackupInfo[]> {
  const results: BackupInfo[] = [];

  const dbBackup = await backupDatabase(config);
  results.push(dbBackup);

  const gitBackup = backupGitRepos(config);
  results.push(gitBackup);

  return results;
}

/**
 * Schedule periodic backups.
 *
 * @param config - Backup configuration including schedule interval.
 * @returns A function that stops the scheduler.
 */
export function scheduleBackups(
  config: Partial<BackupConfig> = {},
): () => void {
  const opts = { ...DEFAULT_CONFIG, ...config };

  if (_scheduleInterval) {
    clearInterval(_scheduleInterval);
  }

  console.log(
    `[backup] Scheduled every ${opts.intervalMs / 1000 / 60} minutes, retaining ${opts.maxRetained} backups`,
  );

  _scheduleInterval = setInterval(async () => {
    try {
      const results = await runFullBackup(opts);
      console.log(`[backup] Scheduled backup completed: ${results.length} items`);
    } catch (err) {
      console.error("[backup] Scheduled backup failed:", err);
    }
  }, opts.intervalMs);

  _scheduleInterval.unref();

  return () => {
    if (_scheduleInterval) {
      clearInterval(_scheduleInterval);
      _scheduleInterval = null;
      console.log("[backup] Backup scheduler stopped");
    }
  };
}

/**
 * List existing backups in the backup directory.
 *
 * @param config - Backup configuration for directory path.
 * @returns Array of backup metadata.
 */
export function listBackups(
  config: Partial<BackupConfig> = {},
): BackupInfo[] {
  const opts = { ...DEFAULT_CONFIG, ...config };

  if (!existsSync(opts.backupDir)) return [];

  const entries = readdirSync(opts.backupDir).sort().reverse();
  return entries.map((name) => {
    const fullPath = join(opts.backupDir, name);
    const type = name.startsWith("db-") ? "database" as const : "git" as const;
    return {
      id: basename(name).replace(/^(db|git)-/, "").replace(/\.sqlite$/, ""),
      type,
      path: fullPath,
      sizeBytes: getSize(fullPath),
      createdAt: "", // Would need to parse from filename
    };
  });
}
