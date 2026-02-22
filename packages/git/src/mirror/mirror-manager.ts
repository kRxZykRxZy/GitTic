import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

/** Configuration for a repository mirror. */
export interface MirrorConfig {
  sourceUrl: string;
  targetPath: string;
  interval: number;
  lastSync: Date | undefined;
  enabled: boolean;
  branches: string[];
}

/** Status of a mirror sync operation. */
export interface MirrorSyncResult {
  success: boolean;
  sourceUrl: string;
  targetPath: string;
  updatedRefs: string[];
  duration: number;
  error: string | undefined;
}

/** Overall mirror status with health information. */
export interface MirrorStatus {
  config: MirrorConfig;
  isHealthy: boolean;
  lastSyncResult: MirrorSyncResult | undefined;
  behindCount: number;
}

/**
 * Set up a new mirror by cloning the source as a mirror repository.
 * Creates a bare repository with all refs mirrored from the source.
 */
export async function setupMirror(
  sourceUrl: string,
  targetPath: string,
  branches?: string[]
): Promise<MirrorConfig> {
  await mkdir(path.dirname(targetPath), { recursive: true });

  await execFileAsync("git", [
    "clone", "--mirror", sourceUrl, targetPath,
  ]);

  const config: MirrorConfig = {
    sourceUrl,
    targetPath,
    interval: 300,
    lastSync: new Date(),
    enabled: true,
    branches: branches ?? [],
  };

  await saveMirrorConfig(targetPath, config);

  return config;
}

/**
 * Synchronize a mirror with its source repository.
 * Fetches all updates and returns the list of changed refs.
 */
export async function syncMirror(
  targetPath: string
): Promise<MirrorSyncResult> {
  const startTime = Date.now();
  const config = await loadMirrorConfig(targetPath);
  const sourceUrl = config?.sourceUrl ?? "origin";

  try {
    const { stderr } = await execFileAsync("git", [
      "-C", targetPath, "fetch", "--prune", sourceUrl,
      "+refs/*:refs/*",
    ]);

    const updatedRefs = stderr
      .split("\n")
      .filter((l) => l.includes("->"))
      .map((l) => l.trim());

    const duration = Date.now() - startTime;

    if (config) {
      config.lastSync = new Date();
      await saveMirrorConfig(targetPath, config);
    }

    return {
      success: true,
      sourceUrl,
      targetPath,
      updatedRefs,
      duration,
      error: undefined,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      sourceUrl,
      targetPath,
      updatedRefs: [],
      duration: Date.now() - startTime,
      error: msg,
    };
  }
}

/**
 * Remove a mirror configuration from the repository.
 * Does not delete the repository itself, only the mirror metadata.
 */
export async function removeMirror(targetPath: string): Promise<void> {
  try {
    await execFileAsync("git", [
      "-C", targetPath, "remote", "remove", "origin",
    ]);
  } catch {
    // Remote may not exist
  }

  const configPath = path.join(targetPath, "mirror.json");
  const { unlink } = await import("node:fs/promises");
  await unlink(configPath).catch(() => {});
}

/**
 * Get the current status of a mirrored repository.
 * Checks health by running ls-remote against the source.
 */
export async function getMirrorStatus(
  targetPath: string
): Promise<MirrorStatus> {
  const config = await loadMirrorConfig(targetPath);
  const defaultConfig: MirrorConfig = {
    sourceUrl: "unknown",
    targetPath,
    interval: 300,
    lastSync: undefined,
    enabled: false,
    branches: [],
  };

  const effectiveConfig = config ?? defaultConfig;

  let isHealthy = false;
  let behindCount = 0;

  try {
    const { stdout: remoteOut } = await execFileAsync("git", [
      "-C", targetPath, "ls-remote", "--heads", effectiveConfig.sourceUrl,
    ]);

    const remoteRefs = new Map<string, string>();
    for (const line of remoteOut.trim().split("\n").filter(Boolean)) {
      const [sha, ref] = line.split("\t");
      remoteRefs.set(ref, sha);
    }

    const { stdout: localOut } = await execFileAsync("git", [
      "-C", targetPath, "for-each-ref",
      "--format=%(refname) %(objectname)", "refs/heads/",
    ]);

    for (const line of localOut.trim().split("\n").filter(Boolean)) {
      const [ref, sha] = line.split(" ");
      const remoteSha = remoteRefs.get(ref);
      if (remoteSha && remoteSha !== sha) {
        behindCount++;
      }
    }

    isHealthy = true;
  } catch {
    isHealthy = false;
  }

  return {
    config: effectiveConfig,
    isHealthy,
    lastSyncResult: undefined,
    behindCount,
  };
}

/**
 * Schedule periodic mirror synchronization at the configured interval.
 * Returns a timer handle that can be used to cancel the schedule.
 */
export function scheduledSync(
  targetPath: string,
  intervalMs: number,
  onResult?: (result: MirrorSyncResult) => void
): NodeJS.Timeout {
  return setInterval(async () => {
    const result = await syncMirror(targetPath);
    onResult?.(result);
  }, intervalMs);
}

/**
 * Save mirror configuration to a JSON file in the repository.
 * Persists the config alongside the bare repository.
 */
async function saveMirrorConfig(
  repoPath: string,
  config: MirrorConfig
): Promise<void> {
  const configPath = path.join(repoPath, "mirror.json");
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Load mirror configuration from the repository's JSON config file.
 * Returns undefined if no configuration file exists.
 */
async function loadMirrorConfig(
  repoPath: string
): Promise<MirrorConfig | undefined> {
  const configPath = path.join(repoPath, "mirror.json");
  try {
    const content = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(content) as MirrorConfig;
    if (parsed.lastSync) {
      parsed.lastSync = new Date(parsed.lastSync);
    }
    return parsed;
  } catch {
    return undefined;
  }
}
