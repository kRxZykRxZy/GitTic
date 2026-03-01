import express from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const project = {
  id: "project-1",
  ownerId: "owner-1",
  slug: "repo-one",
  name: "Repo One",
  description: "",
  isPrivate: false,
  defaultBranch: "main",
  starCount: 0,
  storagePath: "/tmp/repo-one",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const owner = {
  id: "owner-1",
  username: "alice",
};

let stars = new Set<string>();

vi.mock("../../middleware/auth-guard.js", () => ({
  requireAuth: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
      return;
    }
    req.user = { id: userId, userId, username: "test", role: "user" };
    next();
  },
  optionalAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const userId = req.header("x-user-id");
    if (userId) {
      req.user = { id: userId, userId, username: "test", role: "user" };
    }
    next();
  },
}));

vi.mock("../../db/repositories/user-repo.js", () => ({
  findByUsername: vi.fn((username: string) => (username === "alice" ? owner : null)),
  findById: vi.fn((id: string) => (id === owner.id ? owner : null)),
}));

vi.mock("../../db/repositories/project-repo.js", () => ({
  findBySlug: vi.fn((_ownerId: string, slug: string) => (slug === "repo-one" ? { ...project, starCount: stars.size } : null)),
  updateProject: vi.fn((_id: string, update: { starCount?: number }) => ({ ...project, starCount: update.starCount ?? stars.size })),
  countForksBySourceProject: vi.fn(() => 3),
}));

vi.mock("../../db/repositories/pr-repo.js", () => ({ countByProject: vi.fn(() => 2) }));

vi.mock("../../db/repositories/star-repo.js", () => ({
  addStar: vi.fn((userId: string) => {
    const before = stars.size;
    stars.add(userId);
    return stars.size > before;
  }),
  removeStar: vi.fn((userId: string) => stars.delete(userId)),
  hasStarred: vi.fn((userId: string) => stars.has(userId)),
  countStarsForProject: vi.fn(() => stars.size),
}));

vi.mock("@platform/git", () => ({
  listBranches: vi.fn(async () => [{ name: "main", sha: "abc", isDefault: true }]),
  listTags: vi.fn(async () => [{ name: "v1.0.0", sha: "def" }]),
  getCommitCount: vi.fn(async () => 42),
  searchCode: vi.fn(async () => [
    { path: "src/app.ts", lineNumber: 10, line: "const hello = 'world';" },
    { path: "src/main.ts", lineNumber: 15, line: "console.log('hello world');" },
  ]),
}));

const { default: repositoryRouter } = await import("../repository-routes.js");

async function httpCall(path: string, init: RequestInit = {}) {
  const app = express();
  app.use(express.json());
  app.use("/", repositoryRouter);

  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const response = await fetch(`http://127.0.0.1:${port}${path}`, init);
    const body = await response.json();
    return { status: response.status, body };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

beforeEach(() => {
  stars = new Set();
});

describe("repository routes", () => {
  it("returns real stats payload values from git/db-backed modules", async () => {
    const response = await httpCall("/alice/repo-one/stats");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ commits: 42, branches: 1, tags: 1, openPullRequests: 2, stars: 0, forks: 3 });
  });

  it("enforces auth on star creation", async () => {
    const response = await httpCall("/alice/repo-one/star", { method: "POST" });
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("tracks per-user star state for star/unstar/starred endpoints", async () => {
    const star = await httpCall("/alice/repo-one/star", { method: "POST", headers: { "x-user-id": "u1" } });
    expect(star.status).toBe(200);
    expect(star.body).toMatchObject({ starred: true, stars: 1 });

    const starred = await httpCall("/alice/repo-one/starred", { headers: { "x-user-id": "u1" } });
    expect(starred.status).toBe(200);
    expect(starred.body).toEqual({ starred: true, stars: 1 });

    const unstar = await httpCall("/alice/repo-one/star", { method: "DELETE", headers: { "x-user-id": "u1" } });
    expect(unstar.status).toBe(200);
    expect(unstar.body).toEqual({ message: "Repository unstarred successfully", starred: false, stars: 0 });
  });

  it("returns paginated code search results and validation errors", async () => {
    const invalid = await httpCall("/alice/repo-one/search");
    expect(invalid.status).toBe(400);

    const response = await httpCall("/alice/repo-one/search?q=hello&page=1&perPage=1");
    expect(response.status).toBe(200);
    expect(response.body.query).toBe("hello");
    expect(response.body.total).toBe(2);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.pagination).toEqual({
      page: 1,
      perPage: 1,
      total: 2,
      totalPages: 2,
      hasMore: true,
      capped: false,
    });
  });
});
