import { describe, expect, it } from "vitest";
import { evaluateMergeDecision } from "../pr-merge-decision-service.js";
import type { MergeCheckResult } from "@platform/git";

const baseMergeCheck: MergeCheckResult = {
  mergeable: true,
  reason: "All merge checks passed",
  conflictFiles: [],
  checks: [],
};

const baseProtection = {
  projectId: "project-1",
  requirePullRequest: true,
  requiredApprovingReviewCount: 0,
  requireStatusChecks: false,
  requiredStatusChecks: [],
  enforceAdmins: false,
  requireLinearHistory: false,
};

describe("evaluateMergeDecision", () => {
  it("returns mergeable when all gates pass", () => {
    const decision = evaluateMergeDecision({
      mergeCheck: baseMergeCheck,
      canFastForward: true,
      statusChecks: [{
        id: "check-1",
        prId: "pr-1",
        checkName: "build",
        status: "success",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      branchProtection: {
        ...baseProtection,
        requireStatusChecks: true,
        requiredStatusChecks: ["build"],
      },
      approvedReviews: 2,
      prState: "open",
    });

    expect(decision.canMerge).toBe(true);
    expect(decision.failureReasons).toHaveLength(0);
  });

  it("blocks merge when required checks are failing", () => {
    const decision = evaluateMergeDecision({
      mergeCheck: baseMergeCheck,
      canFastForward: true,
      statusChecks: [{
        id: "check-1",
        prId: "pr-1",
        checkName: "build",
        status: "failure",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      branchProtection: {
        ...baseProtection,
        requireStatusChecks: true,
        requiredStatusChecks: ["build"],
      },
      approvedReviews: 0,
      prState: "open",
    });

    expect(decision.canMerge).toBe(false);
    expect(decision.failureReasons.some((reason) => reason.code === "STATUS_CHECKS")).toBe(true);
  });

  it("blocks merge when approvals are missing", () => {
    const decision = evaluateMergeDecision({
      mergeCheck: baseMergeCheck,
      canFastForward: true,
      statusChecks: [],
      branchProtection: {
        ...baseProtection,
        requiredApprovingReviewCount: 2,
      },
      approvedReviews: 1,
      prState: "open",
    });

    expect(decision.canMerge).toBe(false);
    expect(decision.failureReasons.some((reason) => reason.code === "REVIEWS")).toBe(true);
  });

  it("blocks merge when branch protection linear history is required", () => {
    const decision = evaluateMergeDecision({
      mergeCheck: baseMergeCheck,
      canFastForward: false,
      statusChecks: [],
      branchProtection: {
        ...baseProtection,
        requireLinearHistory: true,
      },
      approvedReviews: 0,
      prState: "open",
    });

    expect(decision.canMerge).toBe(false);
    expect(decision.failureReasons.some((reason) => reason.code === "PROTECTION_RULE")).toBe(true);
  });

  it("blocks merge when conflicts exist", () => {
    const decision = evaluateMergeDecision({
      mergeCheck: {
        ...baseMergeCheck,
        mergeable: false,
        conflictFiles: ["src/app.ts"],
        reason: "1 conflict",
      },
      canFastForward: false,
      statusChecks: [],
      branchProtection: baseProtection,
      approvedReviews: 0,
      prState: "open",
    });

    expect(decision.canMerge).toBe(false);
    expect(decision.failureReasons.some((reason) => reason.code === "CONFLICTS")).toBe(true);
  });
});
