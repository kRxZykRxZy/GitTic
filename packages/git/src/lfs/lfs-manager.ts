import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

/** Parsed LFS pointer file content. */
export interface LfsPointer {
  version: string;
  oid: string;
  size: number;
}

/** LFS tracking pattern configuration. */
export interface LfsTrackPattern {
  pattern: string;
  lockable: boolean;
}

/** LFS storage configuration and paths. */
export interface LfsStorageConfig {
  storagePath: string;
  tempPath: string;
}

/**
 * Parse an LFS pointer file content into structured data.
 * Returns undefined if the content is not a valid LFS pointer.
 */
export function parseLfsPointer(content: string): LfsPointer | undefined {
  const lines = content.trim().split("\n");

  if (!lines[0]?.startsWith("version https://git-lfs.github.com/spec/")) {
    return undefined;
  }

  let oid = "";
  let size = 0;

  for (const line of lines) {
    if (line.startsWith("oid sha256:")) {
      oid = line.substring(11);
    } else if (line.startsWith("size ")) {
      size = parseInt(line.substring(5), 10);
    }
  }

  if (!oid || size <= 0) return undefined;

  return {
    version: lines[0].split("/").pop() ?? "v1",
    oid,
    size,
  };
}

/**
 * Create an LFS pointer file content string from object metadata.
 * Generates a valid pointer file that can replace the actual content.
 */
export function createLfsPointer(oid: string, size: number): string {
  return [
    "version https://git-lfs.github.com/spec/v1",
    `oid sha256:${oid}`,
    `size ${size}`,
    "",
  ].join("\n");
}

/**
 * Check if a file content string is an LFS pointer.
 * LFS pointers are small text files with a specific format.
 */
export function isLfsPointer(content: string): boolean {
  return (
    content.length < 200 &&
    content.startsWith("version https://git-lfs.github.com/spec/")
  );
}

/**
 * Compute the SHA-256 hash of content for use as an LFS OID.
 * Returns the hex-encoded hash string.
 */
export function computeLfsOid(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Resolve the storage path for an LFS object by its OID.
 * Uses the standard 2-level sharding scheme: aa/bb/aabb...
 */
export function resolveObjectPath(
  storagePath: string,
  oid: string
): string {
  const dir1 = oid.substring(0, 2);
  const dir2 = oid.substring(2, 4);
  return path.join(storagePath, "lfs", "objects", dir1, dir2, oid);
}

/**
 * Read and parse tracking patterns from a .gitattributes file.
 * Extracts patterns that use the LFS filter configuration.
 */
export async function getTrackedPatterns(
  repoPath: string
): Promise<LfsTrackPattern[]> {
  const attrPath = path.join(repoPath, ".gitattributes");
  const patterns: LfsTrackPattern[] = [];

  try {
    const content = await readFile(attrPath, "utf-8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      if (trimmed.includes("filter=lfs")) {
        const parts = trimmed.split(/\s+/);
        const pattern = parts[0];
        const lockable = trimmed.includes("lockable");
        patterns.push({ pattern, lockable });
      }
    }
  } catch {
    return patterns;
  }

  return patterns;
}

/**
 * Add a tracking pattern for LFS to the .gitattributes file.
 * Configures the pattern with filter, diff, and merge attributes.
 */
export async function trackPattern(
  repoPath: string,
  pattern: string,
  lockable = false
): Promise<void> {
  const attrPath = path.join(repoPath, ".gitattributes");

  let existing = "";
  try {
    existing = await readFile(attrPath, "utf-8");
  } catch {
    // File doesn't exist yet
  }

  const attrs = `filter=lfs diff=lfs merge=lfs -text${lockable ? " lockable" : ""}`;
  const line = `${pattern} ${attrs}`;

  if (existing.includes(pattern)) {
    return;
  }

  const newContent = existing ? `${existing.trimEnd()}\n${line}\n` : `${line}\n`;
  await writeFile(attrPath, newContent, "utf-8");
}

/**
 * Remove a tracking pattern from the .gitattributes file.
 * Removes the line matching the pattern from the attributes file.
 */
export async function untrackPattern(
  repoPath: string,
  pattern: string
): Promise<void> {
  const attrPath = path.join(repoPath, ".gitattributes");

  try {
    const content = await readFile(attrPath, "utf-8");
    const lines = content.split("\n").filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith(pattern);
    });
    await writeFile(attrPath, lines.join("\n"), "utf-8");
  } catch {
    // File doesn't exist, nothing to untrack
  }
}

/**
 * Ensure the LFS storage directory structure exists.
 * Creates the objects and temp directories if needed.
 */
export async function ensureStorageDirs(config: LfsStorageConfig): Promise<void> {
  await mkdir(path.join(config.storagePath, "lfs", "objects"), { recursive: true });
  await mkdir(config.tempPath, { recursive: true });
}

/**
 * List all LFS objects stored in the local LFS cache.
 * Returns an array of OID strings found in the storage directory.
 */
export async function listStoredObjects(
  storagePath: string
): Promise<string[]> {
  const objectsDir = path.join(storagePath, "lfs", "objects");
  const oids: string[] = [];

  try {
    const level1 = await readdir(objectsDir);
    for (const dir1 of level1) {
      const level2 = await readdir(path.join(objectsDir, dir1));
      for (const dir2 of level2) {
        const files = await readdir(path.join(objectsDir, dir1, dir2));
        oids.push(...files);
      }
    }
  } catch {
    return oids;
  }

  return oids;
}
