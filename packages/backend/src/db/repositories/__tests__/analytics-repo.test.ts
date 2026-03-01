import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, getDb } from "../../connection.js";
import { resetConfig } from "../../../config/app-config.js";
import { runMigrations } from "../../migrations.js";
import { ensureAnalyticsTables } from "../analytics-repo.js";

describe("ensureAnalyticsTables", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "analytics-test-"));
    process.env.SQLITE_PATH = join(tempDir, "platform.sqlite");
    resetConfig();
    closeDb();
    runMigrations();
    getDb().exec("DROP TABLE IF EXISTS analytics_events; DROP TABLE IF EXISTS analytics_rollups_daily;");
  });

  afterEach(() => {
    closeDb();
    resetConfig();
    delete process.env.SQLITE_PATH;
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates analytics tables when missing", () => {
    const ready = ensureAnalyticsTables();
    const rows = getDb()
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('analytics_events', 'analytics_rollups_daily')`,
      )
      .all() as Array<{ name: string }>;

    const names = new Set(rows.map((r) => r.name));
    expect(ready).toBe(true);
    expect(names.has("analytics_events")).toBe(true);
    expect(names.has("analytics_rollups_daily")).toBe(true);
  });
});
