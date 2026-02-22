import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Commit count statistics for a single contributor. */
export interface ContributorStat {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
  firstCommitDate: Date;
  lastCommitDate: Date;
}

/** Activity timeline entry for a contributor. */
export interface ActivityEntry {
  week: string;
  author: string;
  commits: number;
  additions: number;
  deletions: number;
}

/**
 * Get commit counts grouped by author across the repository.
 * Returns a sorted list with the most prolific contributors first.
 */
export async function commitCountByAuthor(
  repoPath: string,
  ref = "HEAD"
): Promise<Array<{ name: string; email: string; count: number }>> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "shortlog", "-sne", ref,
  ]);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = /^\s*(\d+)\s+(.+?)\s+<(.+?)>$/.exec(line.trim());
      if (!match) return null;
      return {
        count: parseInt(match[1], 10),
        name: match[2],
        email: match[3],
      };
    })
    .filter((e): e is { name: string; email: string; count: number } => e !== null)
    .sort((a, b) => b.count - a.count);
}

/**
 * Get lines added and removed by each author across the repository.
 * Uses git log with numstat to aggregate per-author line changes.
 */
export async function linesAddedRemoved(
  repoPath: string,
  ref = "HEAD"
): Promise<Array<{ author: string; email: string; additions: number; deletions: number }>> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", "--format=%aN%x00%aE", "--numstat", ref,
  ]);

  const authorStats = new Map<string, { email: string; additions: number; deletions: number }>();
  let currentAuthor = "";
  let currentEmail = "";

  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;

    if (line.includes("\0")) {
      const [name, email] = line.split("\0");
      currentAuthor = name;
      currentEmail = email;
      if (!authorStats.has(currentAuthor)) {
        authorStats.set(currentAuthor, { email: currentEmail, additions: 0, deletions: 0 });
      }
      continue;
    }

    const numMatch = /^(\d+|-)\s+(\d+|-)\s+/.exec(line);
    if (numMatch && currentAuthor) {
      const stats = authorStats.get(currentAuthor)!;
      if (numMatch[1] !== "-") stats.additions += parseInt(numMatch[1], 10);
      if (numMatch[2] !== "-") stats.deletions += parseInt(numMatch[2], 10);
    }
  }

  return Array.from(authorStats.entries())
    .map(([author, stats]) => ({
      author,
      email: stats.email,
      additions: stats.additions,
      deletions: stats.deletions,
    }))
    .sort((a, b) => (b.additions + b.deletions) - (a.additions + a.deletions));
}

/**
 * Get the top contributors by total commit count.
 * Returns a limited number of the most active contributors.
 */
export async function topContributors(
  repoPath: string,
  limit = 10,
  ref = "HEAD"
): Promise<ContributorStat[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log",
    "--format=%aN%x00%aE%x00%aI",
    ref,
  ]);

  const contributors = new Map<string, ContributorStat>();

  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const [name, email, dateStr] = line.split("\0");
    const date = new Date(dateStr);

    if (!contributors.has(email)) {
      contributors.set(email, {
        name,
        email,
        commits: 0,
        additions: 0,
        deletions: 0,
        firstCommitDate: date,
        lastCommitDate: date,
      });
    }

    const stat = contributors.get(email)!;
    stat.commits++;
    if (date < stat.firstCommitDate) stat.firstCommitDate = date;
    if (date > stat.lastCommitDate) stat.lastCommitDate = date;
  }

  return Array.from(contributors.values())
    .sort((a, b) => b.commits - a.commits)
    .slice(0, limit);
}

/**
 * Generate an activity timeline showing commits per week per author.
 * Groups commit activity into weekly buckets for charting.
 */
export async function activityTimeline(
  repoPath: string,
  ref = "HEAD",
  weeks = 52
): Promise<ActivityEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log",
    `--since=${since.toISOString()}`,
    "--format=%aN%x00%aI",
    ref,
  ]);

  const weekMap = new Map<string, Map<string, number>>();

  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const [author, dateStr] = line.split("\0");
    const date = new Date(dateStr);
    const weekStart = getWeekStart(date);

    if (!weekMap.has(weekStart)) {
      weekMap.set(weekStart, new Map());
    }

    const authorMap = weekMap.get(weekStart)!;
    authorMap.set(author, (authorMap.get(author) ?? 0) + 1);
  }

  const entries: ActivityEntry[] = [];
  for (const [week, authors] of weekMap) {
    for (const [author, commits] of authors) {
      entries.push({
        week,
        author,
        commits,
        additions: 0,
        deletions: 0,
      });
    }
  }

  return entries.sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * Get the ISO week start date for a given date.
 * Returns the Monday of the week as a YYYY-MM-DD string.
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/**
 * Count the total number of unique contributors in the repository.
 * Uses email addresses to deduplicate authors.
 */
export async function uniqueContributorCount(
  repoPath: string,
  ref = "HEAD"
): Promise<number> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", "--format=%aE", ref,
  ]);

  const emails = new Set(stdout.trim().split("\n").filter(Boolean));
  return emails.size;
}
