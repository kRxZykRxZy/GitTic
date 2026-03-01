import type { MergeCheckResult } from "@platform/git";
import type { BranchProtectionSettings } from "../db/repositories/branch-protection-repo.js";
import type { PrStatusCheck } from "../db/repositories/pr-status-check-repo.js";

export type MergeFailureReasonCode =
  | "CONFLICTS"
  | "STATUS_CHECKS"
  | "REVIEWS"
  | "PROTECTION_RULE"
  | "PR_NOT_OPEN";

export interface MergeFailureReason {
  code: MergeFailureReasonCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface MergeDecisionInput {
  mergeCheck: MergeCheckResult;
  canFastForward: boolean;
  statusChecks: PrStatusCheck[];
  branchProtection: BranchProtectionSettings;
  approvedReviews: number;
  prState: "open" | "closed" | "merged";
}

export interface MergeDecision {
  mergeable: boolean;
  canMerge: boolean;
  canFastForward: boolean;
  checksStatus: "success" | "pending" | "failure";
  reviewsApproved: boolean;
  requiresReview: boolean;
  requiredApprovals: number;
  approvedReviews: number;
  requiredStatusChecks: string[];
  statusChecks: PrStatusCheck[];
  failureReasons: MergeFailureReason[];
  message: string;
}

function computeChecksStatus(statusChecks: PrStatusCheck[], requiredStatusChecks: string[]): "success" | "pending" | "failure" {
  if (requiredStatusChecks.length === 0) {
    return "success";
  }

  const checksByName = new Map(statusChecks.map((check) => [check.checkName, check]));
  let hasPending = false;

  for (const checkName of requiredStatusChecks) {
    const check = checksByName.get(checkName);
    if (!check || check.status === "pending") {
      hasPending = true;
      continue;
    }
    if (check.status === "failure") {
      return "failure";
    }
  }

  return hasPending ? "pending" : "success";
}

export function evaluateMergeDecision(input: MergeDecisionInput): MergeDecision {
  const failureReasons: MergeFailureReason[] = [];
  const requiredApprovals = input.branchProtection.requiredApprovingReviewCount;
  const requiredStatusChecks = input.branchProtection.requireStatusChecks
    ? input.branchProtection.requiredStatusChecks
    : [];

  if (input.prState !== "open") {
    failureReasons.push({
      code: "PR_NOT_OPEN",
      message: input.prState === "closed" ? "Pull request is closed" : "Pull request is already merged",
      details: { state: input.prState },
    });
  }

  if (!input.mergeCheck.mergeable || input.mergeCheck.conflictFiles.length > 0) {
    failureReasons.push({
      code: "CONFLICTS",
      message: input.mergeCheck.conflictFiles.length > 0
        ? `Pull request has ${input.mergeCheck.conflictFiles.length} merge conflict(s)`
        : input.mergeCheck.reason,
      details: {
        conflictFiles: input.mergeCheck.conflictFiles,
        reason: input.mergeCheck.reason,
      },
    });
  }

  if (input.branchProtection.requireLinearHistory && !input.canFastForward) {
    failureReasons.push({
      code: "PROTECTION_RULE",
      message: "Branch protection requires linear history (fast-forward merge)",
      details: { requireLinearHistory: true },
    });
  }

  const checksStatus = computeChecksStatus(input.statusChecks, requiredStatusChecks);
  if (requiredStatusChecks.length > 0 && checksStatus !== "success") {
    const checksByName = new Map(input.statusChecks.map((check) => [check.checkName, check]));
    const missingChecks = requiredStatusChecks.filter((name) => !checksByName.has(name));
    const pendingChecks = requiredStatusChecks.filter((name) => checksByName.get(name)?.status === "pending");
    const failingChecks = requiredStatusChecks.filter((name) => checksByName.get(name)?.status === "failure");

    failureReasons.push({
      code: "STATUS_CHECKS",
      message: checksStatus === "failure"
        ? "Required status checks are failing"
        : "Required status checks are pending",
      details: {
        required: requiredStatusChecks,
        missing: missingChecks,
        pending: pendingChecks,
        failing: failingChecks,
      },
    });
  }

  const requiresReview = requiredApprovals > 0;
  const reviewsApproved = input.approvedReviews >= requiredApprovals;

  if (requiresReview && !reviewsApproved) {
    failureReasons.push({
      code: "REVIEWS",
      message: `Pull request requires ${requiredApprovals} approval(s) but has ${input.approvedReviews}`,
      details: {
        requiredApprovals,
        approvedReviews: input.approvedReviews,
      },
    });
  }

  const canMerge = failureReasons.length === 0;

  return {
    mergeable: input.mergeCheck.mergeable,
    canMerge,
    canFastForward: input.canFastForward,
    checksStatus,
    reviewsApproved,
    requiresReview,
    requiredApprovals,
    approvedReviews: input.approvedReviews,
    requiredStatusChecks,
    statusChecks: input.statusChecks,
    failureReasons,
    message: canMerge
      ? input.canFastForward
        ? "Pull request can be fast-forward merged"
        : "Pull request can be merged"
      : failureReasons[0]?.message ?? "Pull request cannot be merged",
  };
}
