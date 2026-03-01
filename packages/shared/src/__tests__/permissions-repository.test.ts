import { describe, expect, it } from "vitest";
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSION_LABELS,
  PERMISSION_LEVELS,
  getPermissionBadgeClass,
  hasPermission,
} from "../permissions/repository.js";

describe("permissions/repository", () => {
  it("keeps permission levels ordered from pull to admin", () => {
    expect(PERMISSION_LEVELS.pull).toBeLessThan(PERMISSION_LEVELS.triage);
    expect(PERMISSION_LEVELS.triage).toBeLessThan(PERMISSION_LEVELS.push);
    expect(PERMISSION_LEVELS.push).toBeLessThan(PERMISSION_LEVELS.maintain);
    expect(PERMISSION_LEVELS.maintain).toBeLessThan(PERMISSION_LEVELS.admin);
  });

  it("allows higher roles and blocks lower roles", () => {
    expect(hasPermission("admin", "pull")).toBe(true);
    expect(hasPermission("maintain", "push")).toBe(true);
    expect(hasPermission("pull", "push")).toBe(false);
  });

  it("returns stable labels, descriptions, and badge classes", () => {
    expect(PERMISSION_LABELS.push).toBe("Write");
    expect(PERMISSION_DESCRIPTIONS.admin).toContain("Full access");
    expect(getPermissionBadgeClass("admin")).toBe("badge-danger");
    expect(getPermissionBadgeClass("pull")).toBe("badge-secondary");
  });
});
