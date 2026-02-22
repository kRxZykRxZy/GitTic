# Issue Routes Test Template

This file provides test templates and examples for testing the issue routes implementation.

## Test Setup

```typescript
import request from "supertest";
import express, { Express } from "express";
import issueRoutes from "../routes/issue-routes.js";

describe("Issue Routes", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mount middleware
    app.use(require("../middleware/cors-config.js").default);
    app.use(require("../middleware/request-logger.js").default);
    app.use(require("../middleware/input-validator.js").sanitizeBody);
    
    // Mount routes
    app.use("/api/repositories", issueRoutes);
  });

  // Test cases follow...
});
```

## Test Cases

### Issue Listing Tests

```typescript
describe("GET /api/repositories/:owner/:repo/issues", () => {
  
  describe("successful requests", () => {
    
    test("should list all open issues by default", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues")
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.perPage).toBe(20);
    });

    test("should respect page parameter", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues?page=2&perPage=10")
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.perPage).toBe(10);
    });

    test("should clamp perPage to maximum", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues?perPage=500")
        .expect(200);

      expect(response.body.pagination.perPage).toBeLessThanOrEqual(100);
    });

    test("should filter by status", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues?status=closed")
        .expect(200);

      expect(response.body.filters.status).toBe("closed");
    });

    test("should filter by labels", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues?labels=bug,urgent")
        .expect(200);

      expect(response.body.filters.labels).toContain("bug");
      expect(response.body.filters.labels).toContain("urgent");
    });

    test("should filter by assignees", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues?assignees=jane,bob")
        .expect(200);

      expect(response.body.filters.assignees).toContain("jane");
      expect(response.body.filters.assignees).toContain("bob");
    });

    test("should filter by author", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues?author=jane")
        .expect(200);

      expect(response.body.filters.author).toBe("jane");
    });

    test("should sort by different fields", async () => {
      const responseCreated = await request(app)
        .get("/api/repositories/john/my-project/issues?sort=created&order=asc")
        .expect(200);

      expect(responseCreated.body.sort.by).toBe("created");
      expect(responseCreated.body.sort.order).toBe("asc");
    });

    test("should set pagination headers", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues")
        .expect(200);

      expect(response.headers["x-total-count"]).toBeDefined();
      expect(response.headers["x-total-pages"]).toBeDefined();
      expect(response.headers["x-current-page"]).toBeDefined();
      expect(response.headers["x-per-page"]).toBeDefined();
    });
  });

  describe("validation errors", () => {
    
    test("should reject invalid status", async () => {
      const response = await request(app)
        .get("/api/repositories/john/my-project/issues?status=invalid")
        .expect(400);

      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.error).toContain("Invalid status");
    });
  });

  describe("not found errors", () => {
    
    test("should return 404 for non-existent repository", async () => {
      const response = await request(app)
        .get("/api/repositories/nonexistent/repo/issues")
        .expect(404);

      expect(response.body.code).toBe("NOT_FOUND");
    });
  });

  describe("access control", () => {
    
    test("should deny access to private repositories without auth", async () => {
      const response = await request(app)
        .get("/api/repositories/private-owner/private-repo/issues")
        .expect(404); // Hides that repo is private

      expect(response.body.code).toBe("NOT_FOUND");
    });

    test("should allow access with valid token", async () => {
      const response = await request(app)
        .get("/api/repositories/owner/private-repo/issues")
        .set("Authorization", "Bearer VALID_TOKEN")
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });
  });
});
```

### Issue Detail Tests

```typescript
describe("GET /api/repositories/:owner/:repo/issues/:number", () => {
  
  test("should get issue details", async () => {
    const response = await request(app)
      .get("/api/repositories/john/my-project/issues/42")
      .expect(200);

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("number", 42);
    expect(response.body).toHaveProperty("title");
    expect(response.body).toHaveProperty("status");
    expect(response.body).toHaveProperty("author");
    expect(response.body).toHaveProperty("assignees");
    expect(response.body).toHaveProperty("labels");
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("commentCount");
  });

  test("should return 404 for non-existent issue", async () => {
    const response = await request(app)
      .get("/api/repositories/john/my-project/issues/99999")
      .expect(404);

    expect(response.body.code).toBe("NOT_FOUND");
  });

  test("should validate issue number format", async () => {
    const response = await request(app)
      .get("/api/repositories/john/my-project/issues/invalid")
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
```

### Issue Creation Tests

```typescript
describe("POST /api/repositories/:owner/:repo/issues", () => {
  
  describe("successful requests", () => {
    
    test("should create issue with title only", async () => {
      const response = await request(app)
        .post("/api/repositories/john/my-project/issues")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ title: "Test issue" })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe("Test issue");
      expect(response.body.status).toBe("open");
      expect(response.body.author).toBeDefined();
    });

    test("should create issue with full details", async () => {
      const response = await request(app)
        .post("/api/repositories/john/my-project/issues")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          title: "Feature request",
          description: "Please implement dark mode",
          labels: ["feature", "ui"],
          assignees: ["jane"]
        })
        .expect(201);

      expect(response.body.title).toBe("Feature request");
      expect(response.body.description).toBe("Please implement dark mode");
      expect(response.body.labels).toContain("feature");
      expect(response.body.assignees).toHaveLength(1);
    });
  });

  describe("validation errors", () => {
    
    test("should require title", async () => {
      const response = await request(app)
        .post("/api/repositories/john/my-project/issues")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ description: "No title" })
        .expect(400);

      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details).toContainEqual(
        expect.objectContaining({ field: "title" })
      );
    });

    test("should limit title length", async () => {
      const longTitle = "x".repeat(256);
      const response = await request(app)
        .post("/api/repositories/john/my-project/issues")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ title: longTitle })
        .expect(400);

      expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    test("should limit description length", async () => {
      const longDescription = "x".repeat(10001);
      const response = await request(app)
        .post("/api/repositories/john/my-project/issues")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ 
          title: "Test",
          description: longDescription
        })
        .expect(400);

      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("authentication", () => {
    
    test("should require authentication", async () => {
      const response = await request(app)
        .post("/api/repositories/john/my-project/issues")
        .send({ title: "Test" })
        .expect(401);

      expect(response.body.code).toBe("AUTH_REQUIRED");
    });
  });

  describe("access control", () => {
    
    test("should deny create on private repo without access", async () => {
      const response = await request(app)
        .post("/api/repositories/other-owner/private-repo/issues")
        .set("Authorization", "Bearer VALID_USER_TOKEN")
        .send({ title: "Test" })
        .expect(403 || 404);

      expect(response.body.code).toMatch(/FORBIDDEN|NOT_FOUND/);
    });
  });
});
```

### Issue Update Tests

```typescript
describe("PATCH /api/repositories/:owner/:repo/issues/:number", () => {
  
  test("should update issue title", async () => {
    const response = await request(app)
      .patch("/api/repositories/john/my-project/issues/42")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ title: "Updated title" })
      .expect(200);

    expect(response.body.title).toBe("Updated title");
  });

  test("should update description", async () => {
    const response = await request(app)
      .patch("/api/repositories/john/my-project/issues/42")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ description: "Updated description" })
      .expect(200);

    expect(response.body.description).toBe("Updated description");
  });

  test("should update labels", async () => {
    const response = await request(app)
      .patch("/api/repositories/john/my-project/issues/42")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ labels: ["bug", "critical"] })
      .expect(200);

    expect(response.body.labels).toEqual(["bug", "critical"]);
  });

  test("should require authentication", async () => {
    const response = await request(app)
      .patch("/api/repositories/john/my-project/issues/42")
      .send({ title: "Updated" })
      .expect(401);

    expect(response.body.code).toBe("AUTH_REQUIRED");
  });
});
```

### Issue Status Tests

```typescript
describe("POST /api/repositories/:owner/:repo/issues/:number/close", () => {
  
  test("should close issue", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/close")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ reason: "Fixed" })
      .expect(200);

    expect(response.body.status).toBe("closed");
  });

  test("should require authentication", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/close")
      .send({ reason: "Fixed" })
      .expect(401);

    expect(response.body.code).toBe("AUTH_REQUIRED");
  });
});

describe("POST /api/repositories/:owner/:repo/issues/:number/reopen", () => {
  
  test("should reopen issue", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/reopen")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ reason: "Still broken" })
      .expect(200);

    expect(response.body.status).toBe("open");
  });
});
```

### Comment Tests

```typescript
describe("GET /api/repositories/:owner/:repo/issues/:number/comments", () => {
  
  test("should list comments with pagination", async () => {
    const response = await request(app)
      .get("/api/repositories/john/my-project/issues/42/comments")
      .expect(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe("POST /api/repositories/:owner/:repo/issues/:number/comments", () => {
  
  test("should add comment", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/comments")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ body: "Great issue!" })
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.body).toBe("Great issue!");
    expect(response.body.author).toBeDefined();
  });

  test("should require authentication", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/comments")
      .send({ body: "Comment" })
      .expect(401);

    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  test("should validate comment body", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/comments")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ body: "" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("PATCH /api/repositories/:owner/:repo/issues/comments/:commentId", () => {
  
  test("should update comment", async () => {
    const response = await request(app)
      .patch("/api/repositories/john/my-project/issues/comments/comment-123")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ body: "Updated comment" })
      .expect(200);

    expect(response.body.body).toBe("Updated comment");
  });
});

describe("DELETE /api/repositories/:owner/:repo/issues/comments/:commentId", () => {
  
  test("should delete comment", async () => {
    const response = await request(app)
      .delete("/api/repositories/john/my-project/issues/comments/comment-123")
      .set("Authorization", "Bearer VALID_TOKEN")
      .expect(200);

    expect(response.body.message).toContain("deleted successfully");
  });
});
```

### Label Tests

```typescript
describe("POST /api/repositories/:owner/:repo/issues/:number/labels", () => {
  
  test("should add labels to issue", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/labels")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ labels: ["bug", "urgent"] })
      .expect(200);

    expect(response.body.labels).toContain("bug");
    expect(response.body.labels).toContain("urgent");
  });

  test("should require non-empty labels array", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/labels")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ labels: [] })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/repositories/:owner/:repo/issues/:number/labels/:label", () => {
  
  test("should remove label from issue", async () => {
    const response = await request(app)
      .delete("/api/repositories/john/my-project/issues/42/labels/bug")
      .set("Authorization", "Bearer VALID_TOKEN")
      .expect(200);

    expect(response.body.labels).not.toContain("bug");
  });

  test("should handle URL-encoded labels", async () => {
    const response = await request(app)
      .delete("/api/repositories/john/my-project/issues/42/labels/help-wanted")
      .set("Authorization", "Bearer VALID_TOKEN")
      .expect(200);

    expect(response.body).toBeDefined();
  });
});
```

### Assignee Tests

```typescript
describe("POST /api/repositories/:owner/:repo/issues/:number/assignees", () => {
  
  test("should add assignees", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/assignees")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ assignees: ["jane", "bob"] })
      .expect(200);

    expect(response.body.assignees).toHaveLength(2);
    expect(response.body.assignees[0].username).toBe("jane");
  });

  test("should validate assignees exist", async () => {
    const response = await request(app)
      .post("/api/repositories/john/my-project/issues/42/assignees")
      .set("Authorization", "Bearer VALID_TOKEN")
      .send({ assignees: ["nonexistent-user"] })
      .expect(400);

    expect(response.body.code).toBe("USER_NOT_FOUND");
  });
});

describe("DELETE /api/repositories/:owner/:repo/issues/:number/assignees/:username", () => {
  
  test("should remove assignee", async () => {
    const response = await request(app)
      .delete("/api/repositories/john/my-project/issues/42/assignees/jane")
      .set("Authorization", "Bearer VALID_TOKEN")
      .expect(200);

    expect(response.body.assignees).not.toContainEqual(
      expect.objectContaining({ username: "jane" })
    );
  });
});
```

## Test Data Fixtures

```typescript
const testRepositories = {
  publicRepo: {
    owner: "john",
    repo: "public-project",
    isPrivate: false
  },
  privateRepo: {
    owner: "jane",
    repo: "private-project",
    isPrivate: true
  }
};

const testIssues = {
  openIssue: {
    number: 1,
    title: "Add dark mode",
    description: "Implement dark theme",
    status: "open"
  },
  closedIssue: {
    number: 2,
    title: "Fix login bug",
    description: "Users can't login with special chars",
    status: "closed"
  }
};

const testTokens = {
  validToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiredToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  invalidToken: "invalid.token.here"
};
```

## Running Tests

```bash
# Run all issue route tests
npm test -- issue-routes.test.ts

# Run specific test suite
npm test -- issue-routes.test.ts -t "GET /api/repositories"

# Run with coverage
npm test -- issue-routes.test.ts --coverage

# Watch mode
npm test -- issue-routes.test.ts --watch
```

---

**Note**: This is a template. Adjust based on your testing framework (Jest, Mocha, Vitest) and specific implementation details.
