/** Base class for all Git-related errors in the platform. */
export class GitError extends Error {
  /** The git command that caused the error, if available. */
  public readonly command: string | undefined;

  /** The exit code from the git process, if available. */
  public readonly exitCode: number | undefined;

  /** The stderr output from the git process, if available. */
  public readonly stderr: string | undefined;

  constructor(
    message: string,
    options?: {
      command?: string;
      exitCode?: number;
      stderr?: string;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "GitError";
    this.command = options?.command;
    this.exitCode = options?.exitCode;
    this.stderr = options?.stderr;
  }
}

/** Thrown when a merge operation encounters conflicts that cannot be auto-resolved. */
export class MergeConflictError extends GitError {
  /** List of file paths with unresolved conflicts. */
  public readonly conflictFiles: string[];

  constructor(message: string, conflictFiles: string[], cause?: Error) {
    super(message, { cause });
    this.name = "MergeConflictError";
    this.conflictFiles = conflictFiles;
  }
}

/** Thrown when a Git reference (branch, tag, SHA) cannot be found. */
export class RefNotFoundError extends GitError {
  /** The ref that was not found. */
  public readonly ref: string;

  constructor(ref: string, cause?: Error) {
    super(`Ref not found: ${ref}`, { cause });
    this.name = "RefNotFoundError";
    this.ref = ref;
  }
}

/** Thrown when a repository path is invalid or does not exist. */
export class RepositoryNotFoundError extends GitError {
  /** The repository path that was not found. */
  public readonly repoPath: string;

  constructor(repoPath: string, cause?: Error) {
    super(`Repository not found: ${repoPath}`, { cause });
    this.name = "RepositoryNotFoundError";
    this.repoPath = repoPath;
  }
}

/** Thrown when a user does not have permission to perform an operation. */
export class AccessDeniedError extends GitError {
  /** The user ID that was denied access. */
  public readonly userId: string;

  /** The operation that was denied. */
  public readonly operation: string;

  constructor(userId: string, operation: string, cause?: Error) {
    super(`Access denied: user ${userId} cannot ${operation}`, { cause });
    this.name = "AccessDeniedError";
    this.userId = userId;
    this.operation = operation;
  }
}

/** Thrown when an LFS operation fails. */
export class LfsError extends GitError {
  /** The OID of the LFS object that caused the error, if applicable. */
  public readonly oid: string | undefined;

  constructor(message: string, oid?: string, cause?: Error) {
    super(message, { cause });
    this.name = "LfsError";
    this.oid = oid;
  }
}

/** Thrown when a cherry-pick operation fails due to conflicts. */
export class CherryPickError extends GitError {
  /** The SHA of the commit that failed to cherry-pick. */
  public readonly sha: string;

  constructor(sha: string, message: string, cause?: Error) {
    super(message, { cause });
    this.name = "CherryPickError";
    this.sha = sha;
  }
}

/** Thrown when a rebase operation fails. */
export class RebaseError extends GitError {
  /** The target ref the rebase was attempting to apply onto. */
  public readonly onto: string;

  constructor(onto: string, message: string, cause?: Error) {
    super(message, { cause });
    this.name = "RebaseError";
    this.onto = onto;
  }
}

/**
 * Check if an error is a specific Git error type.
 * Type guard for narrowing caught errors to specific Git error classes.
 */
export function isGitError(error: unknown): error is GitError {
  return error instanceof GitError;
}

/**
 * Create a GitError from a child_process exec error.
 * Extracts command, exit code, and stderr from the process error.
 */
export function fromExecError(error: unknown, command?: string): GitError {
  if (error instanceof GitError) return error;

  const execErr = error as {
    message?: string;
    code?: number;
    stderr?: string;
    killed?: boolean;
  };

  const message = execErr.message ?? "Unknown git error";
  return new GitError(message, {
    command,
    exitCode: execErr.code,
    stderr: typeof execErr.stderr === "string" ? execErr.stderr : undefined,
  });
}

/**
 * Format a GitError for user-friendly display.
 * Includes the error type, message, and command details if available.
 */
export function formatGitError(error: GitError): string {
  const parts = [`[${error.name}] ${error.message}`];

  if (error.command) {
    parts.push(`Command: ${error.command}`);
  }
  if (error.exitCode !== undefined) {
    parts.push(`Exit code: ${error.exitCode}`);
  }
  if (error.stderr) {
    parts.push(`Stderr: ${error.stderr.trim()}`);
  }

  return parts.join("\n");
}
