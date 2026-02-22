import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Weekly code frequency data point with additions and deletions. */
export interface CodeFrequencyEntry {
  weekStart: string;
  additions: number;
  deletions: number;
  netChange: number;
}

/** Commit frequency histogram bucket. */
export interface CommitFrequencyBucket {
  period: string;
  commits: number;
  authors: number;
}

/** Daily commit distribution entry (0=Sunday, 6=Saturday). */
export interface DailyDistribution {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  commits: number;
}

/**
 * Get additions and deletions per week over the repository history.
 * Returns weekly data points suitable for charting code frequency.
 */
export async function codeFrequency(
  repoPath: string,
  ref = "HEAD",
  weeks = 52
): Promise<CodeFrequencyEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log",
    `--since=${since.toISOString()}`,
    "--format=%aI", "--numstat",
    ref,
  ]);

  const weeklyData = new Map<string, { additions: number; deletions: number }>();
  let currentWeek = "";

  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;

    const dateMatch = /^\d{4}-\d{2}-\d{2}/.exec(line);
    if (dateMatch) {
      currentWeek = getWeekStart(new Date(line.trim()));
      if (!weeklyData.has(currentWeek)) {
        weeklyData.set(currentWeek, { additions: 0, deletions: 0 });
      }
      continue;
    }

    const numMatch = /^(\d+|-)\s+(\d+|-)\s+/.exec(line);
    if (numMatch && currentWeek) {
      const data = weeklyData.get(currentWeek)!;
      if (numMatch[1] !== "-") data.additions += parseInt(numMatch[1], 10);
      if (numMatch[2] !== "-") data.deletions += parseInt(numMatch[2], 10);
    }
  }

  return Array.from(weeklyData.entries())
    .map(([weekStart, data]) => ({
      weekStart,
      additions: data.additions,
      deletions: data.deletions,
      netChange: data.additions - data.deletions,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Get commit frequency histogram grouped by month.
 * Shows how many commits and unique authors contributed each month.
 */
export async function commitFrequencyByMonth(
  repoPath: string,
  ref = "HEAD",
  months = 12
): Promise<CommitFrequencyBucket[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log",
    `--since=${since.toISOString()}`,
    "--format=%aI%x00%aE",
    ref,
  ]);

  const buckets = new Map<string, { commits: number; authors: Set<string> }>();

  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const [dateStr, email] = line.split("\0");
    const month = dateStr.substring(0, 7);

    if (!buckets.has(month)) {
      buckets.set(month, { commits: 0, authors: new Set() });
    }

    const bucket = buckets.get(month)!;
    bucket.commits++;
    bucket.authors.add(email);
  }

  return Array.from(buckets.entries())
    .map(([period, data]) => ({
      period,
      commits: data.commits,
      authors: data.authors.size,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get commit distribution by day of week and hour.
 * Useful for punch card visualizations of development activity.
 */
export async function commitDistribution(
  repoPath: string,
  ref = "HEAD"
): Promise<DailyDistribution[]> {
  const DAY_NAMES = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", "--format=%aI", ref,
  ]);

  const grid = new Map<string, number>();

  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const date = new Date(line);
    const day = date.getDay();
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  }

  const results: DailyDistribution[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const commits = grid.get(key) ?? 0;
      if (commits > 0) {
        results.push({
          dayOfWeek: day,
          dayName: DAY_NAMES[day],
          hour,
          commits,
        });
      }
    }
  }

  return results;
}

/**
 * Get the average number of commits per day over a time period.
 * Calculates the daily commit rate for the specified number of days.
 */
export async function averageCommitsPerDay(
  repoPath: string,
  ref = "HEAD",
  days = 90
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "rev-list", "--count",
    `--since=${since.toISOString()}`, ref,
  ]);

  const count = parseInt(stdout.trim(), 10);
  return count / days;
}

/**
 * Get the cumulative line count over time.
 * Shows total lines in the repository at each sampled point.
 */
export async function cumulativeLines(
  repoPath: string,
  ref = "HEAD",
  samplePoints = 10
): Promise<Array<{ sha: string; date: string; totalLines: number }>> {
  const { stdout: revListOut } = await execFileAsync("git", [
    "-C", repoPath, "rev-list", "--format=%aI", ref,
  ]);

  const commits: Array<{ sha: string; date: string }> = [];
  const lines = revListOut.trim().split("\n");

  for (let i = 0; i < lines.length; i += 2) {
    const sha = lines[i]?.replace("commit ", "");
    const date = lines[i + 1];
    if (sha && date) {
      commits.push({ sha, date });
    }
  }

  const step = Math.max(1, Math.floor(commits.length / samplePoints));
  const samples: Array<{ sha: string; date: string; totalLines: number }> = [];

  for (let i = commits.length - 1; i >= 0; i -= step) {
    const commit = commits[i];
    try {
      const { stdout: treeOut } = await execFileAsync("git", [
        "-C", repoPath, "ls-tree", "-r", "--long", commit.sha,
      ]);

      let totalLines = 0;
      for (const treeLine of treeOut.trim().split("\n").filter(Boolean)) {
        const sizeMatch = /\s(\d+)\s/.exec(treeLine);
        if (sizeMatch) {
          totalLines += parseInt(sizeMatch[1], 10);
        }
      }

      samples.push({
        sha: commit.sha,
        date: commit.date,
        totalLines,
      });
    } catch {
      continue;
    }
  }

  return samples.reverse();
}

/**
 * Calculate the Monday of the week containing the given date.
 * Returns ISO date string format (YYYY-MM-DD).
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}
