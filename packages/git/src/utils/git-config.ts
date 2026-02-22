import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** A single Git configuration entry with section, key, and value. */
export interface GitConfigEntry {
  key: string;
  value: string;
  scope: "local" | "global" | "system" | "worktree";
}

/** Parsed Git configuration with section grouping. */
export interface GitConfigSection {
  section: string;
  subsection: string | undefined;
  entries: Record<string, string>;
}

/**
 * Get a single configuration value by key from the repository.
 * Returns undefined if the key does not exist.
 */
export async function getConfig(
  repoPath: string,
  key: string
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "config", "--get", key,
    ]);
    return stdout.trim();
  } catch {
    return undefined;
  }
}

/**
 * Set a configuration value for the repository.
 * Creates the key if it doesn't exist, or updates it if it does.
 */
export async function setConfig(
  repoPath: string,
  key: string,
  value: string
): Promise<void> {
  await execFileAsync("git", [
    "-C", repoPath, "config", key, value,
  ]);
}

/**
 * Remove a configuration key from the repository.
 * Silently succeeds if the key does not exist.
 */
export async function unsetConfig(
  repoPath: string,
  key: string
): Promise<void> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "config", "--unset", key,
    ]);
  } catch {
    // Key may not exist
  }
}

/**
 * List all configuration entries in the repository.
 * Returns a flat list of key-value pairs with their scope.
 */
export async function listConfig(
  repoPath: string
): Promise<GitConfigEntry[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "config", "--list", "--show-scope",
  ]);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const scopeMatch = /^(\w+)\s+(.+?)=(.*)$/.exec(line);
      if (!scopeMatch) {
        const simpleMatch = /^(.+?)=(.*)$/.exec(line);
        return {
          key: simpleMatch?.[1] ?? line,
          value: simpleMatch?.[2] ?? "",
          scope: "local" as const,
        };
      }
      return {
        scope: scopeMatch[1] as GitConfigEntry["scope"],
        key: scopeMatch[2],
        value: scopeMatch[3],
      };
    });
}

/**
 * Get a global Git configuration value (user-level config).
 * Reads from ~/.gitconfig or $XDG_CONFIG_HOME/git/config.
 */
export async function getGlobalConfig(
  key: string
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", [
      "config", "--global", "--get", key,
    ]);
    return stdout.trim();
  } catch {
    return undefined;
  }
}

/**
 * Set a global Git configuration value.
 * Writes to the user-level gitconfig file.
 */
export async function setGlobalConfig(
  key: string,
  value: string
): Promise<void> {
  await execFileAsync("git", ["config", "--global", key, value]);
}

/**
 * Get multiple configuration values matching a regex pattern.
 * Returns all matching key-value pairs from the local config.
 */
export async function getConfigRegex(
  repoPath: string,
  pattern: string
): Promise<Record<string, string>> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "config", "--get-regexp", pattern,
    ]);

    const result: Record<string, string> = {};
    for (const line of stdout.trim().split("\n").filter(Boolean)) {
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx > 0) {
        const key = line.substring(0, spaceIdx);
        const value = line.substring(spaceIdx + 1);
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Parse the full configuration into grouped sections.
 * Returns configuration organized by section and subsection.
 */
export async function getConfigSections(
  repoPath: string
): Promise<GitConfigSection[]> {
  const entries = await listConfig(repoPath);
  const sectionMap = new Map<string, GitConfigSection>();

  for (const entry of entries) {
    const parts = entry.key.split(".");
    let section: string;
    let subsection: string | undefined;
    let keyName: string;

    if (parts.length === 3) {
      section = parts[0];
      subsection = parts[1];
      keyName = parts[2];
    } else {
      section = parts[0];
      subsection = undefined;
      keyName = parts.slice(1).join(".");
    }

    const sectionKey = subsection ? `${section}.${subsection}` : section;

    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        section,
        subsection,
        entries: {},
      });
    }

    sectionMap.get(sectionKey)!.entries[keyName] = entry.value;
  }

  return Array.from(sectionMap.values());
}

/**
 * Get the configured user name and email for a repository.
 * Returns the user identity used for commits in this repository.
 */
export async function getUserIdentity(
  repoPath: string
): Promise<{ name: string | undefined; email: string | undefined }> {
  const name = await getConfig(repoPath, "user.name");
  const email = await getConfig(repoPath, "user.email");
  return { name, email };
}
