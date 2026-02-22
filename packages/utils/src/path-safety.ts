import path from "node:path";

/**
 * Validates that a resolved path stays within an allowed base directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 */
export function isPathSafe(basePath: string, userPath: string): boolean {
  const resolved = path.resolve(basePath, userPath);
  const normalizedBase = path.resolve(basePath) + path.sep;
  return resolved.startsWith(normalizedBase) || resolved === path.resolve(basePath);
}

/**
 * Resolve a user path safely within a base directory.
 * Returns null if the path escapes the base.
 */
export function safeResolvePath(basePath: string, userPath: string): string | null {
  if (!isPathSafe(basePath, userPath)) return null;
  return path.resolve(basePath, userPath);
}
