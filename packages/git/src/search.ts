import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CodeSearchResult {
  path: string;
  lineNumber: number;
  line: string;
}

export interface SearchCodeOptions {
  ref?: string;
  caseInsensitive?: boolean;
  limit?: number;
}

/**
 * Search repository code using git-grep against a ref.
 */
export async function searchCode(
  repoPath: string,
  query: string,
  options: SearchCodeOptions = {}
): Promise<CodeSearchResult[]> {
  const { ref = "HEAD", caseInsensitive = true, limit = 200 } = options;
  const args = ["-C", repoPath, "grep", "-n", "-I", "--full-name"];

  if (caseInsensitive) {
    args.push("-i");
  }

  args.push("-F", query, ref);

  try {
    const { stdout } = await execFileAsync("git", args, { maxBuffer: 10 * 1024 * 1024 });
    return stdout
      .split("\n")
      .filter(Boolean)
      .slice(0, Math.max(1, limit))
      .map((line) => {
        const [path, lineNumber, ...contentParts] = line.split(":");
        return {
          path,
          lineNumber: Number(lineNumber) || 1,
          line: contentParts.join(":"),
        };
      });
  } catch (error: unknown) {
    // git grep exits with code 1 when there are no matches
    const err = error as { code?: number; stdout?: string };
    if (err?.code === 1 && !String(err.stdout || "").trim()) {
      return [];
    }
    throw error;
  }
}
