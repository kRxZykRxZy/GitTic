import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RepositoryPageNew } from "./RepositoryPageNew";
import { apiClientMockModule, apiMock, resetApiMock } from "../test/mocks/api-client";

vi.mock("../services/api-client", () => apiClientMockModule);
vi.mock("../hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));

vi.mock("../components/repository/FileBrowserNew", () => ({ FileBrowserNew: () => <div>file-browser</div> }));
vi.mock("../components/repository/ReadmePreview", () => ({ ReadmePreview: () => <div>readme-preview</div> }));
vi.mock("../components/repository/SummarySidebar", () => ({ SummarySidebar: () => <aside>summary-sidebar</aside> }));
vi.mock("./CommitsPage", () => ({ CommitsPage: () => <div>commits-view</div> }));
vi.mock("./BranchesPage", () => ({ BranchesPage: () => <div>branches-view</div> }));
vi.mock("./TagsPage", () => ({ TagsPage: () => <div>tags-view</div> }));

describe("RepositoryPageNew", () => {
  beforeEach(() => {
    resetApiMock();
    apiMock.get.mockImplementation((path: string) => {
      if (path.includes("/branches")) {
        return Promise.resolve({ success: true, data: [{ name: "main" }, { name: "dev" }] });
      }
      return Promise.resolve({
        success: true,
        data: {
          id: "r1",
          name: "demo",
          owner: { id: "o1", username: "octo" },
          slug: "octo/demo",
          url: "/octo/demo",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
      });
    });
  });

  it("renders repository shell at owner/repo route", async () => {
    render(
      <MemoryRouter initialEntries={["/octo/demo"]}>
        <Routes>
          <Route path="/:owner/:repo" element={<RepositoryPageNew />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Code Repository")).toBeInTheDocument());
    expect(screen.getByText("demo")).toBeInTheDocument();
    expect(screen.getByText("file-browser")).toBeInTheDocument();
    expect(screen.getByText("summary-sidebar")).toBeInTheDocument();
  });

  it("switches repository tabs from sidebar navigation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/octo/demo"]}>
        <Routes>
          <Route path="/:owner/:repo" element={<RepositoryPageNew />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Files")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Commits/i }));
    expect(screen.getByText("commits-view")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Branches/i }));
    expect(screen.getByText("branches-view")).toBeInTheDocument();
  });
});
