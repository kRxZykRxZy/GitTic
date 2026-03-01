import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PullRequestDetail from "./PullRequestDetail";
import { PullRequest } from "./types";

const pullRequest: PullRequest = {
  id: "pr-1",
  number: 101,
  title: "Add frontend tests",
  description: "Builds a testing baseline",
  status: "open",
  author: { id: "u1", username: "alice", avatarUrl: "https://example.com/a.png" },
  head: { name: "feature/tests", sha: "abc" },
  base: { name: "main", sha: "def" },
  commits: 2,
  additions: 120,
  deletions: 10,
  changedFiles: 3,
  createdAt: "2025-01-10T00:00:00.000Z",
  updatedAt: "2025-01-10T00:00:00.000Z",
  isDraft: false,
  comments: [],
  fileChanges: [],
  commits_list: [],
  checks: [],
};

describe("PullRequestDetail", () => {
  it("renders PR metadata and supports tab switching", async () => {
    const user = userEvent.setup();
    render(<PullRequestDetail pullRequest={pullRequest} />);

    expect(screen.getByText("Add frontend tests")).toBeInTheDocument();
    expect(screen.getByText("#101")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Files Changed/i }));
    expect(screen.getByText("No files changed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Commits/i }));
    expect(screen.getByText("No commits")).toBeInTheDocument();
  });

  it("runs comment action callback from conversation tab", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn().mockResolvedValue(undefined);

    render(<PullRequestDetail pullRequest={pullRequest} onAddComment={onAddComment} />);

    await user.type(screen.getByPlaceholderText("Leave a comment..."), "Looks good");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(onAddComment).toHaveBeenCalledWith("Looks good");
  });
});
