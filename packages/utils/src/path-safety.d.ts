/**
 * Validates that a resolved path stays within an allowed base directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 */
export declare function isPathSafe(basePath: string, userPath: string): boolean;
/**
 * Resolve a user path safely within a base directory.
 * Returns null if the path escapes the base.
 */
export declare function safeResolvePath(basePath: string, userPath: string): string | null;
//# sourceMappingURL=path-safety.d.ts.map