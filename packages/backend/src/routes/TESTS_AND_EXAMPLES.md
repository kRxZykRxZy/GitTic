# Repository Routes - Usage Examples and Test Cases

## Test Cases

This document provides comprehensive test cases and usage examples for the repository routes API.

## Unit Test Examples

### Using Vitest

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import repositoryRoutes from "./repository-routes.js";
import { optionalAuth } from "../middleware/auth-guard.js";

describe("Repository Routes", () => {
  let app: ReturnType<typeof express>;
  let server: any;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(optionalAuth);
    app.use("/api/repositories", repositoryRoutes);
  });

  afterAll(() => {
    server?.close();
  });

  describe("GET /api/repositories/:owner/:repo", () => {
    it("should return repository details for public repo", async () => {
      const res = await request(app).get("/api/repositories/john/public-project");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("name");
      expect(res.body).toHaveProperty("owner");
      expect(res.body.owner.username).toBe("john");
    });

    it("should return 404 for non-existent repository", async () => {
      const res = await request(app).get("/api/repositories/john/non-existent");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should deny access to private repo without authentication", async () => {
      const res = await request(app).get("/api/repositories/john/private-project");

      expect(res.status).toBe(404);
    });

    it("should allow access to private repo with authentication", async () => {
      const token = "valid-jwt-token-for-john";
      const res = await request(app)
        .get("/api/repositories/john/private-project")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.isPrivate).toBe(true);
    });
  });

  describe("GET /api/repositories/:owner/:repo/commits", () => {
    it("should list commits with default pagination", async () => {
      const res = await request(app).get("/api/repositories/john/my-project/commits");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.perPage).toBe(20);
    });

    it("should filter commits by branch", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/commits?branch=develop"
      );

      expect(res.status).toBe(200);
      expect(res.body.filters.branch).toBe("develop");
    });

    it("should filter commits by author", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/commits?author=john@example.com"
      );

      expect(res.status).toBe(200);
      expect(res.body.filters.author).toBe("john@example.com");
    });

    it("should respect pagination limits", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/commits?page=2&perPage=50"
      );

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.perPage).toBe(50);
    });

    it("should cap perPage at maximum of 100", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/commits?perPage=200"
      );

      expect(res.status).toBe(200);
      expect(res.body.pagination.perPage).toBe(100);
    });
  });

  describe("GET /api/repositories/:owner/:repo/commits/:sha", () => {
    it("should return commit details", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/commits/abc1234567890"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("sha");
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("author");
      expect(res.body).toHaveProperty("stats");
      expect(res.body).toHaveProperty("files");
    });

    it("should reject SHA shorter than 7 characters", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/commits/abc123"
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject SHA longer than 40 characters", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/commits/abc12345678901234567890123456789012345678901"
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/repositories/:owner/:repo/branches", () => {
    it("should list branches", async () => {
      const res = await request(app).get("/api/repositories/john/my-project/branches");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should include commit information for each branch", async () => {
      const res = await request(app).get("/api/repositories/john/my-project/branches");

      if (res.body.data.length > 0) {
        const branch = res.body.data[0];
        expect(branch).toHaveProperty("name");
        expect(branch).toHaveProperty("commit");
        expect(branch.commit).toHaveProperty("sha");
        expect(branch.commit).toHaveProperty("message");
      }
    });
  });

  describe("GET /api/repositories/:owner/:repo/branches/:name", () => {
    it("should return branch details", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/branches/main"
      );

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("main");
      expect(res.body).toHaveProperty("commit");
      expect(res.body).toHaveProperty("protected");
    });

    it("should reject branch names with invalid characters", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/branches/main@invalid"
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/repositories/:owner/:repo/branches", () => {
    const token = "valid-jwt-token-for-john";

    it("should create a new branch", async () => {
      const res = await request(app)
        .post("/api/repositories/john/my-project/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "feature/new-feature",
          from: "main",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("feature/new-feature");
      expect(res.body).toHaveProperty("commit");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/repositories/john/my-project/branches")
        .send({
          name: "feature/new-feature",
          from: "main",
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("AUTH_REQUIRED");
    });

    it("should reject invalid branch names", async () => {
      const res = await request(app)
        .post("/api/repositories/john/my-project/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "feature@invalid",
          from: "main",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should require branch name", async () => {
      const res = await request(app)
        .post("/api/repositories/john/my-project/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          from: "main",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should deny access for non-owner users", async () => {
      const otherUserToken = "valid-jwt-token-for-jane";
      const res = await request(app)
        .post("/api/repositories/john/my-project/branches")
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({
          name: "feature/new-feature",
          from: "main",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  describe("DELETE /api/repositories/:owner/:repo/branches/:name", () => {
    const token = "valid-jwt-token-for-john";

    it("should delete a branch", async () => {
      const res = await request(app)
        .delete("/api/repositories/john/my-project/branches/feature/old-feature")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    it("should not delete default branch", async () => {
      const res = await request(app)
        .delete("/api/repositories/john/my-project/branches/main")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("CANNOT_DELETE_DEFAULT_BRANCH");
    });

    it("should require authentication", async () => {
      const res = await request(app).delete(
        "/api/repositories/john/my-project/branches/feature/old-feature"
      );

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/repositories/:owner/:repo/tags", () => {
    it("should list tags", async () => {
      const res = await request(app).get("/api/repositories/john/my-project/tags");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should include tagger information", async () => {
      const res = await request(app).get("/api/repositories/john/my-project/tags");

      if (res.body.data.length > 0) {
        const tag = res.body.data[0];
        expect(tag).toHaveProperty("name");
        expect(tag).toHaveProperty("commit");
        expect(tag).toHaveProperty("tagger");
      }
    });
  });

  describe("POST /api/repositories/:owner/:repo/tags", () => {
    const token = "valid-jwt-token-for-john";

    it("should create a new tag", async () => {
      const res = await request(app)
        .post("/api/repositories/john/my-project/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "v1.1.0",
          target: "main",
          message: "Release version 1.1.0",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("v1.1.0");
      expect(res.body).toHaveProperty("tagger");
    });

    it("should validate tag name format", async () => {
      const res = await request(app)
        .post("/api/repositories/john/my-project/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "v1.1/invalid",
          target: "main",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should require both name and target", async () => {
      const res = await request(app)
        .post("/api/repositories/john/my-project/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "v1.1.0",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/repositories/:owner/:repo/tags/:name", () => {
    const token = "valid-jwt-token-for-john";

    it("should delete a tag", async () => {
      const res = await request(app)
        .delete("/api/repositories/john/my-project/tags/v0.9.0")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    it("should require authentication", async () => {
      const res = await request(app).delete(
        "/api/repositories/john/my-project/tags/v0.9.0"
      );

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/repositories/:owner/:repo/blob/:branch/*path", () => {
    it("should retrieve file content", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/blob/main/README.md"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("path");
      expect(res.body).toHaveProperty("branch");
      expect(res.body).toHaveProperty("content");
      expect(res.body).toHaveProperty("encoding");
    });

    it("should support raw content retrieval", async () => {
      const res = await request(app)
        .get("/api/repositories/john/my-project/blob/main/README.md")
        .query({ raw: "true" });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/plain");
    });

    it("should require file path", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/blob/main/"
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/repositories/:owner/:repo/tree/:branch/*path", () => {
    it("should browse directory tree", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/tree/main"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("path");
      expect(res.body).toHaveProperty("branch");
      expect(Array.isArray(res.body.entries)).toBe(true);
    });

    it("should support nested paths", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/tree/main/src/components"
      );

      expect(res.status).toBe(200);
      expect(res.body.path).toBe("/src/components");
    });
  });

  describe("GET /api/repositories/:owner/:repo/contributors", () => {
    it("should list contributors", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/contributors"
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should include contributor statistics", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/contributors"
      );

      if (res.body.data.length > 0) {
        const contributor = res.body.data[0];
        expect(contributor).toHaveProperty("name");
        expect(contributor).toHaveProperty("email");
        expect(contributor).toHaveProperty("commits");
        expect(contributor).toHaveProperty("additions");
        expect(contributor).toHaveProperty("deletions");
      }
    });
  });

  describe("GET /api/repositories/:owner/:repo/stats", () => {
    it("should return repository statistics", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/stats"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("commits");
      expect(res.body).toHaveProperty("churn");
      expect(res.body).toHaveProperty("files");
      expect(res.body).toHaveProperty("contributors");
      expect(res.body).toHaveProperty("size");
      expect(res.body).toHaveProperty("activity");
    });

    it("should include commit statistics", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/stats"
      );

      expect(res.body.commits).toHaveProperty("total");
      expect(res.body.commits).toHaveProperty("weekly");
      expect(res.body.commits).toHaveProperty("monthly");
    });

    it("should include churn metrics", async () => {
      const res = await request(app).get(
        "/api/repositories/john/my-project/stats"
      );

      expect(res.body.churn).toHaveProperty("additions");
      expect(res.body.churn).toHaveProperty("deletions");
      expect(res.body.churn).toHaveProperty("total");
    });
  });
});
```

## Integration Test Examples

### Database-Level Tests

```typescript
describe("Repository Routes - Integration", () => {
  let db: Database;

  beforeAll(async () => {
    db = await initTestDatabase();
    await seedTestData(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it("should handle repository with real database", async () => {
    // Create a test repository in the database
    const project = await createTestProject(db, {
      name: "Test Project",
      slug: "test-project",
      ownerId: "user-123",
      isPrivate: false,
    });

    const res = await request(app).get("/api/repositories/testuser/test-project");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
    expect(res.body.name).toBe("Test Project");
  });

  it("should correctly handle pagination with large dataset", async () => {
    // Create 150 commits
    const commits = await createTestCommits(db, project.id, 150);

    const page1 = await request(app).get(
      "/api/repositories/testuser/test-project/commits?page=1&perPage=50"
    );

    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(50);
    expect(page1.body.pagination.total).toBe(150);
    expect(page1.body.pagination.totalPages).toBe(3);

    const page2 = await request(app).get(
      "/api/repositories/testuser/test-project/commits?page=2&perPage=50"
    );

    expect(page2.body.data).toHaveLength(50);
    // Ensure different data on different pages
    expect(page1.body.data[0].sha).not.toBe(page2.body.data[0].sha);
  });
});
```

## cURL Examples

### Basic Repository Operations

```bash
# Get repository info
curl -s https://api.example.com/api/repositories/john/my-project | jq

# List public repositories (no auth needed)
curl -s https://api.example.com/api/repositories/john/my-project

# Access private repository (with token)
curl -s https://api.example.com/api/repositories/john/private-project \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Commit Operations

```bash
# List all commits
curl -s https://api.example.com/api/repositories/john/my-project/commits

# List commits from specific branch
curl -s "https://api.example.com/api/repositories/john/my-project/commits?branch=develop"

# Get specific commit
curl -s https://api.example.com/api/repositories/john/my-project/commits/abc1234567890

# Get commit with pagination
curl -s "https://api.example.com/api/repositories/john/my-project/commits?page=2&perPage=50"
```

### Branch Operations

```bash
# List all branches
curl -s https://api.example.com/api/repositories/john/my-project/branches

# Get specific branch
curl -s https://api.example.com/api/repositories/john/my-project/branches/main

# Create branch (requires auth)
curl -X POST https://api.example.com/api/repositories/john/my-project/branches \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "feature/new-feature",
    "from": "main"
  }' | jq

# Delete branch (requires auth)
curl -X DELETE https://api.example.com/api/repositories/john/my-project/branches/feature/old \
  -H "Authorization: Bearer <token>" | jq
```

### Tag Operations

```bash
# List tags
curl -s https://api.example.com/api/repositories/john/my-project/tags

# Create tag (requires auth)
curl -X POST https://api.example.com/api/repositories/john/my-project/tags \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "v1.0.0",
    "target": "main",
    "message": "Release version 1.0.0"
  }' | jq

# Delete tag
curl -X DELETE https://api.example.com/api/repositories/john/my-project/tags/v0.9.0 \
  -H "Authorization: Bearer <token>" | jq
```

### File Operations

```bash
# Browse directory
curl -s https://api.example.com/api/repositories/john/my-project/tree/main/src

# Get file content (JSON)
curl -s https://api.example.com/api/repositories/john/my-project/blob/main/README.md | jq

# Get raw file content
curl -s "https://api.example.com/api/repositories/john/my-project/blob/main/README.md?raw=true"
```

### Statistics

```bash
# Get contributors
curl -s https://api.example.com/api/repositories/john/my-project/contributors | jq

# Get repository stats
curl -s https://api.example.com/api/repositories/john/my-project/stats | jq
```

## JavaScript/TypeScript Client Examples

### Using Axios

```typescript
import axios from "axios";

class RepositoryClient {
  private api = axios.create({
    baseURL: "https://api.example.com/api/repositories",
  });

  constructor(private token?: string) {
    if (token) {
      this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }

  async getRepository(owner: string, repo: string) {
    const res = await this.api.get(`/${owner}/${repo}`);
    return res.data;
  }

  async listCommits(owner: string, repo: string, options?: any) {
    const res = await this.api.get(`/${owner}/${repo}/commits`, {
      params: options,
    });
    return res.data;
  }

  async listBranches(owner: string, repo: string) {
    const res = await this.api.get(`/${owner}/${repo}/branches`);
    return res.data;
  }

  async createBranch(owner: string, repo: string, name: string, from: string) {
    const res = await this.api.post(`/${owner}/${repo}/branches`, {
      name,
      from,
    });
    return res.data;
  }

  async getFileContent(owner: string, repo: string, branch: string, path: string) {
    const res = await this.api.get(`/${owner}/${repo}/blob/${branch}/${path}`);
    return res.data;
  }

  async getStats(owner: string, repo: string) {
    const res = await this.api.get(`/${owner}/${repo}/stats`);
    return res.data;
  }
}

// Usage
const client = new RepositoryClient(process.env.GITHUB_TOKEN);

const repo = await client.getRepository("john", "my-project");
console.log(repo.name);

const commits = await client.listCommits("john", "my-project", {
  branch: "main",
  page: 1,
  perPage: 20,
});

const stats = await client.getStats("john", "my-project");
console.log(`Total commits: ${stats.commits.total}`);
```

## Load Testing Example

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://api.example.com/api/repositories/john/my-project

# Using wrk
wrk -t4 -c100 -d30s https://api.example.com/api/repositories/john/my-project
```

## Debugging Tips

### Enable Request Logging

```typescript
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`, req.query, req.params);
  next();
});
```

### Check Authorization Header

```bash
curl -s -H "Authorization: Bearer <token>" \
  https://api.example.com/api/repositories/john/my-project \
  -v
```

### Validate Token

```typescript
import { verifyToken } from "@platform/auth";

const token = "eyJhbGciOiJIUzI1NiIs...";
try {
  const payload = verifyToken(token, process.env.JWT_SECRET);
  console.log("Token valid:", payload);
} catch (err) {
  console.log("Token invalid:", err.message);
}
```

## Performance Testing Checklist

- [ ] Test with 1000+ repositories
- [ ] Test commit list with 10000+ commits
- [ ] Test branch list with 100+ branches
- [ ] Test tag list with 1000+ tags
- [ ] Test contributor list with 500+ contributors
- [ ] Monitor memory usage during pagination
- [ ] Verify database query performance
- [ ] Test concurrent requests
- [ ] Measure response times
- [ ] Check for memory leaks

## Security Testing Checklist

- [ ] Test XSS prevention in input
- [ ] Test SQL injection prevention
- [ ] Test unauthorized access to private repos
- [ ] Test token expiration
- [ ] Test malformed requests
- [ ] Test oversized payloads
- [ ] Test rate limiting (when implemented)
- [ ] Test CORS headers
- [ ] Test input length limits
- [ ] Test special character handling
