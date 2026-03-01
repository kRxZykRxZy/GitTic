import { getDb } from "../connection.js";

interface BranchProtectionRow {
  project_id: string;
  require_pull_request: number;
  required_approving_review_count: number;
  require_status_checks: number;
  required_status_checks: string;
  enforce_admins: number;
  require_linear_history: number;
}

export interface BranchProtectionSettings {
  projectId: string;
  requirePullRequest: boolean;
  requiredApprovingReviewCount: number;
  requireStatusChecks: boolean;
  requiredStatusChecks: string[];
  enforceAdmins: boolean;
  requireLinearHistory: boolean;
}

const DEFAULT_BRANCH_PROTECTION: Omit<BranchProtectionSettings, "projectId"> = {
  requirePullRequest: true,
  requiredApprovingReviewCount: 0,
  requireStatusChecks: false,
  requiredStatusChecks: [],
  enforceAdmins: false,
  requireLinearHistory: false,
};

function toSettings(row: BranchProtectionRow): BranchProtectionSettings {
  let requiredStatusChecks: string[] = [];
  try {
    const parsed = JSON.parse(row.required_status_checks);
    if (Array.isArray(parsed)) {
      requiredStatusChecks = parsed.filter((check): check is string => typeof check === "string");
    }
  } catch {
    requiredStatusChecks = [];
  }

  return {
    projectId: row.project_id,
    requirePullRequest: row.require_pull_request === 1,
    requiredApprovingReviewCount: row.required_approving_review_count,
    requireStatusChecks: row.require_status_checks === 1,
    requiredStatusChecks,
    enforceAdmins: row.enforce_admins === 1,
    requireLinearHistory: row.require_linear_history === 1,
  };
}

export function findByProjectId(projectId: string): BranchProtectionSettings {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM project_branch_protection WHERE project_id = ?")
    .get(projectId) as BranchProtectionRow | undefined;

  if (!row) {
    return {
      projectId,
      ...DEFAULT_BRANCH_PROTECTION,
    };
  }

  return toSettings(row);
}

export function upsertByProjectId(
  projectId: string,
  input: Partial<Omit<BranchProtectionSettings, "projectId">>
): BranchProtectionSettings {
  const db = getDb();
  const now = new Date().toISOString();
  const current = findByProjectId(projectId);

  const next: BranchProtectionSettings = {
    ...current,
    ...input,
    projectId,
  };

  db.prepare(
    `INSERT INTO project_branch_protection (
      project_id,
      require_pull_request,
      required_approving_review_count,
      require_status_checks,
      required_status_checks,
      enforce_admins,
      require_linear_history,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      require_pull_request = excluded.require_pull_request,
      required_approving_review_count = excluded.required_approving_review_count,
      require_status_checks = excluded.require_status_checks,
      required_status_checks = excluded.required_status_checks,
      enforce_admins = excluded.enforce_admins,
      require_linear_history = excluded.require_linear_history,
      updated_at = excluded.updated_at`,
  ).run(
    projectId,
    next.requirePullRequest ? 1 : 0,
    next.requiredApprovingReviewCount,
    next.requireStatusChecks ? 1 : 0,
    JSON.stringify(next.requiredStatusChecks),
    next.enforceAdmins ? 1 : 0,
    next.requireLinearHistory ? 1 : 0,
    now,
    now,
  );

  return findByProjectId(projectId);
}
