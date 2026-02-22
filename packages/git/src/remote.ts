import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Information about a configured remote repository. */
export interface RemoteInfo {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

/** Result of a fetch or push operation. */
export interface TransferResult {
  success: boolean;
  remote: string;
  message: string;
  updatedRefs: string[];
}

/**
 * Add a named remote to the repository with the specified URL.
 * Configures both fetch and push URLs to the same value.
 */
export async function addRemote(
  repoPath: string,
  name: string,
  url: string
): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "remote", "add", name, url]);
}

/**
 * Remove a named remote from the repository.
 * Also removes all remote-tracking branches and configuration.
 */
export async function removeRemote(
  repoPath: string,
  name: string
): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "remote", "remove", name]);
}

/**
 * List all configured remotes with their fetch and push URLs.
 * Returns structured remote information for each configured remote.
 */
export async function listRemotes(
  repoPath: string
): Promise<RemoteInfo[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "remote", "-v",
  ]);

  const remotes = new Map<string, RemoteInfo>();

  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const match = /^(\S+)\s+(\S+)\s+\((fetch|push)\)$/.exec(line);
    if (!match) continue;

    const [, name, url, direction] = match;

    if (!remotes.has(name)) {
      remotes.set(name, { name, fetchUrl: "", pushUrl: "" });
    }

    const remote = remotes.get(name)!;
    if (direction === "fetch") {
      remote.fetchUrl = url;
    } else {
      remote.pushUrl = url;
    }
  }

  return Array.from(remotes.values());
}

/**
 * Fetch objects and refs from a remote repository.
 * Optionally prune deleted remote-tracking branches.
 */
export async function fetchRemote(
  repoPath: string,
  remote = "origin",
  prune = false
): Promise<TransferResult> {
  try {
    const args = ["-C", repoPath, "fetch", remote];
    if (prune) {
      args.push("--prune");
    }

    const { stderr } = await execFileAsync("git", args);

    const updatedRefs = stderr
      .split("\n")
      .filter((l) => l.includes("->"))
      .map((l) => l.trim());

    return {
      success: true,
      remote,
      message: `Fetched from ${remote}`,
      updatedRefs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      remote,
      message: `Fetch failed: ${msg}`,
      updatedRefs: [],
    };
  }
}

/**
 * Push refs to a remote repository.
 * Supports force push and setting upstream tracking.
 */
export async function pushRemote(
  repoPath: string,
  remote = "origin",
  refSpec?: string,
  force = false
): Promise<TransferResult> {
  try {
    const args = ["-C", repoPath, "push", remote];
    if (refSpec) {
      args.push(refSpec);
    }
    if (force) {
      args.push("--force");
    }

    const { stderr } = await execFileAsync("git", args);

    const updatedRefs = stderr
      .split("\n")
      .filter((l) => l.includes("->"))
      .map((l) => l.trim());

    return {
      success: true,
      remote,
      message: `Pushed to ${remote}`,
      updatedRefs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      remote,
      message: `Push failed: ${msg}`,
      updatedRefs: [],
    };
  }
}

/**
 * Get the URL for a specific remote by name.
 * Returns the fetch URL for the named remote.
 */
export async function getRemoteUrl(
  repoPath: string,
  name = "origin"
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "remote", "get-url", name,
  ]);
  return stdout.trim();
}

/**
 * Set the URL for an existing remote.
 * Updates the remote's fetch URL to the new value.
 */
export async function setRemoteUrl(
  repoPath: string,
  name: string,
  url: string
): Promise<void> {
  await execFileAsync("git", [
    "-C", repoPath, "remote", "set-url", name, url,
  ]);
}

/**
 * Rename an existing remote to a new name.
 * Also updates all remote-tracking branch names.
 */
export async function renameRemote(
  repoPath: string,
  oldName: string,
  newName: string
): Promise<void> {
  await execFileAsync("git", [
    "-C", repoPath, "remote", "rename", oldName, newName,
  ]);
}
