import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Configuration for post-receive hook actions. */
export interface PostReceiveConfig {
  notificationEndpoint: string | undefined;
  searchIndexEndpoint: string | undefined;
  ciPipelineEndpoint: string | undefined;
  enableNotifications: boolean;
  enableSearchIndex: boolean;
  enableCiTrigger: boolean;
}

/** Payload sent to notification and CI endpoints. */
export interface PushPayload {
  repository: string;
  ref: string;
  oldSha: string;
  newSha: string;
  pusher: string | undefined;
  commits: PushCommitInfo[];
  timestamp: string;
}

/** Abbreviated commit info included in push payloads. */
export interface PushCommitInfo {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  timestamp: string;
}

/** A single ref update parsed from post-receive stdin. */
export interface PostReceiveUpdate {
  oldSha: string;
  newSha: string;
  refName: string;
}

/**
 * Parse the stdin of a post-receive hook into structured ref updates.
 * Format: oldSha newSha refName, one per line.
 */
export function parsePostReceiveInput(input: string): PostReceiveUpdate[] {
  return input
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(" ");
      return {
        oldSha: parts[0],
        newSha: parts[1],
        refName: parts[2],
      };
    });
}

/**
 * Build a push payload for notification and CI systems.
 * Gathers commit information for the pushed ref update.
 */
export async function buildPushPayload(
  repoPath: string,
  update: PostReceiveUpdate,
  pusher?: string
): Promise<PushPayload> {
  const zeroPad = "0000000000000000000000000000000000000000";
  const commits: PushCommitInfo[] = [];

  if (update.newSha !== zeroPad && update.oldSha !== zeroPad) {
    try {
      const { stdout } = await execFileAsync("git", [
        "-C", repoPath, "log", "--format=%H%x00%s%x00%an%x00%ae%x00%aI",
        `${update.oldSha}..${update.newSha}`,
      ]);

      for (const line of stdout.trim().split("\n").filter(Boolean)) {
        const [sha, message, author, authorEmail, timestamp] = line.split("\0");
        commits.push({ sha, message, author, authorEmail, timestamp });
      }
    } catch {
      // New branch or empty range
    }
  }

  return {
    repository: repoPath,
    ref: update.refName,
    oldSha: update.oldSha,
    newSha: update.newSha,
    pusher,
    commits,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Trigger notification callbacks for a push event.
 * Serializes the push payload and returns it for the caller to deliver.
 */
export function buildNotificationPayload(payload: PushPayload): string {
  const branchName = payload.ref.replace("refs/heads/", "");
  const commitCount = payload.commits.length;
  const summary = commitCount > 0
    ? payload.commits[0].message
    : "Branch update";

  const notification = {
    type: "push",
    branch: branchName,
    commitCount,
    summary,
    pusher: payload.pusher ?? "unknown",
    repository: payload.repository,
    timestamp: payload.timestamp,
    commits: payload.commits.map((c) => ({
      sha: c.sha.substring(0, 8),
      message: c.message,
      author: c.author,
    })),
  };

  return JSON.stringify(notification);
}

/**
 * Build a search index update payload for changed files.
 * Identifies files that need reindexing after a push.
 */
export async function buildSearchIndexPayload(
  repoPath: string,
  update: PostReceiveUpdate
): Promise<{ filesToIndex: string[]; filesToRemove: string[] }> {
  const zeroPad = "0000000000000000000000000000000000000000";

  if (update.newSha === zeroPad) {
    return { filesToIndex: [], filesToRemove: [] };
  }

  if (update.oldSha === zeroPad) {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "ls-tree", "-r", "--name-only", update.newSha,
    ]);
    return {
      filesToIndex: stdout.trim().split("\n").filter(Boolean),
      filesToRemove: [],
    };
  }

  const { stdout: addedModified } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--name-only", "--diff-filter=ACM",
    update.oldSha, update.newSha,
  ]).catch(() => ({ stdout: "" }));

  const { stdout: deleted } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--name-only", "--diff-filter=D",
    update.oldSha, update.newSha,
  ]).catch(() => ({ stdout: "" }));

  return {
    filesToIndex: addedModified.trim().split("\n").filter(Boolean),
    filesToRemove: deleted.trim().split("\n").filter(Boolean),
  };
}

/**
 * Build a CI pipeline trigger payload from a push event.
 * Includes branch, commit info, and changed file list.
 */
export async function buildCiTriggerPayload(
  repoPath: string,
  payload: PushPayload
): Promise<string> {
  const branchName = payload.ref.replace("refs/heads/", "");
  const zeroPad = "0000000000000000000000000000000000000000";

  let changedFiles: string[] = [];
  if (payload.oldSha !== zeroPad && payload.newSha !== zeroPad) {
    try {
      const { stdout } = await execFileAsync("git", [
        "-C", repoPath, "diff", "--name-only",
        payload.oldSha, payload.newSha,
      ]);
      changedFiles = stdout.trim().split("\n").filter(Boolean);
    } catch {
      changedFiles = [];
    }
  }

  const trigger = {
    type: "ci_trigger",
    branch: branchName,
    headSha: payload.newSha,
    repository: payload.repository,
    commits: payload.commits.length,
    changedFiles,
    timestamp: payload.timestamp,
  };

  return JSON.stringify(trigger);
}
