import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IssueList, { Issue } from "./IssueList";
import IssueDetail from "./IssueDetail";

const issue: Issue = {
  id: "42",
  title: "Fix flaky API retries",
  description: "Retry policy should be bounded",
  status: "open",
  priority: "high",
  labels: [{ id: "l1", name: "bug", color: "#f00" }],
  assignees: [{ id: "u1", name: "alice" }],
  createdAt: new Date("2025-01-10T10:00:00.000Z"),
  updatedAt: new Date("2025-01-11T10:00:00.000Z"),
  createdBy: { id: "u1", name: "alice" },
  commentCount: 3,
};

describe("issue components", () => {
  it("renders issue list entries and invokes click callback", async () => {
    const user = userEvent.setup();
    const onIssueClick = vi.fn();

    render(<IssueList issues={[issue]} onIssueClick={onIssueClick} />);

    expect(screen.getByText("Fix flaky API retries")).toBeInTheDocument();
    await user.click(screen.getByText("Fix flaky API retries"));
    expect(onIssueClick).toHaveBeenCalledWith(issue);
  });

  it("renders issue detail and allows description edit", async () => {
    const user = userEvent.setup();
    const onDescriptionEdit = vi.fn();

    render(<IssueDetail issue={issue} onDescriptionEdit={onDescriptionEdit} />);

    expect(screen.getByText("Fix flaky API retries")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Updated details");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onDescriptionEdit).toHaveBeenCalledWith("Updated details");
  });
});
