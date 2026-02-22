# Repository Routes Integration Guide

## Overview

This guide explains how to integrate the `repository-routes.ts` module into your Express application.

## Quick Start

### 1. Import the Routes

In your main server file (`packages/backend/src/server.ts` or `packages/backend/src/index.ts`):

```typescript
import repositoryRoutes from "./routes/repository-routes.js";
```

### 2. Mount the Routes

Add the routes to your Express app:

```typescript
// Mount repository routes
app.use("/api/repositories", repositoryRoutes);
```

### 3. Full Example Integration

```typescript
import express from "express";
import repositoryRoutes from "./routes/repository-routes.js";
import { optionalAuth } from "./middleware/auth-guard.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// Middleware
app.use(express.json());

// Apply optional authentication to all routes
// (authentication is handled per-route as needed)

// Routes
app.use("/api/repositories", repositoryRoutes);

// Error handling
app.use(errorHandler);

export default app;
```

## Route Mounting Locations

### Option A: Root `/api/repositories` (Recommended)
```typescript
app.use("/api/repositories", repositoryRoutes);
```
This mounts all routes under `/api/repositories/*`

### Option B: Alternative Paths
```typescript
// Mount under /repos alias
app.use("/api/repos", repositoryRoutes);

// Mount under organization context
app.use("/api/orgs/:owner/repos", repositoryRoutes);
```

## Access Patterns

Once mounted, the routes are accessible at:

```
GET    /api/repositories/:owner/:repo
GET    /api/repositories/:owner/:repo/tree/:branch/*path
GET    /api/repositories/:owner/:repo/blob/:branch/*path
GET    /api/repositories/:owner/:repo/commits
GET    /api/repositories/:owner/:repo/commits/:sha
GET    /api/repositories/:owner/:repo/branches
GET    /api/repositories/:owner/:repo/branches/:name
POST   /api/repositories/:owner/:repo/branches
DELETE /api/repositories/:owner/:repo/branches/:name
GET    /api/repositories/:owner/:repo/tags
POST   /api/repositories/:owner/:repo/tags
DELETE /api/repositories/:owner/:repo/tags/:name
GET    /api/repositories/:owner/:repo/contributors
GET    /api/repositories/:owner/:repo/stats
```

## Testing the Routes

### Using cURL

```bash
# Get repository details
curl https://localhost:3000/api/repositories/john/my-project

# List commits
curl https://localhost:3000/api/repositories/john/my-project/commits

# List branches
curl https://localhost:3000/api/repositories/john/my-project/branches

# Get file content
curl https://localhost:3000/api/repositories/john/my-project/blob/main/README.md

# Create a branch (requires authentication)
curl -X POST https://localhost:3000/api/repositories/john/my-project/branches \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "feature/new", "from": "main"}'

# Get repository statistics
curl https://localhost:3000/api/repositories/john/my-project/stats
```

### Using TypeScript/Node.js

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:3000/api/repositories",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Get repository details
const repo = await api.get("/john/my-project");

// List commits
const commits = await api.get("/john/my-project/commits", {
  params: { page: 1, perPage: 20 },
});

// Create a branch
const newBranch = await api.post("/john/my-project/branches", {
  name: "feature/new",
  from: "main",
});

// Get file content
const file = await api.get("/john/my-project/blob/main/package.json");

// Get repository statistics
const stats = await api.get("/john/my-project/stats");
```

## Implementation Details

### Helper Functions

#### `resolveRepository(owner: string, repo: string)`
Resolves a repository by owner username and repository slug.

```typescript
const project = resolveRepository("john", "my-project");
if (!project) {
  // Repository not found
}
```

#### `canAccessRepository(project, userId?, role?)`
Checks if a user can access a repository based on privacy settings and role.

```typescript
const canAccess = canAccessRepository(project, req.user?.userId, req.user?.role);
if (!canAccess) {
  // Access denied
}
```

#### `sanitizeRepository(project, includePrivate?)`
Removes sensitive fields from a repository object before sending to the client.

```typescript
const safe = sanitizeRepository(project, req.user !== undefined);
res.json(safe);
```

#### `parsePagination(query)`
Clamps pagination parameters to safe ranges.

```typescript
const { page, perPage } = parsePagination(req.query);
```

### Middleware Chain

Each route goes through this middleware chain:

1. **Authentication Middleware** (`requireAuth` or `optionalAuth`)
   - Validates JWT tokens from Authorization header
   - Populates `req.user` if authenticated

2. **Input Validation** (`validate`)
   - Validates request parameters, query strings, and body
   - Sanitizes user input to prevent XSS
   - Returns 400 error if validation fails

3. **Route Handler**
   - Resolves the repository
   - Checks access permissions
   - Performs the operation
   - Returns the result

4. **Error Handler** (Global)
   - Catches any errors thrown by the route
   - Returns appropriate HTTP status and error message

## Extending the Routes

### Adding a New Repository Endpoint

```typescript
/**
 * GET /api/repositories/:owner/:repo/releases
 *
 * List all releases in a repository.
 */
router.get(
  "/:owner/:repo/releases",
  optionalAuth,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const owner = String(req.params.owner).toLowerCase();
      const repo = String(req.params.repo).toLowerCase();

      const project = resolveRepository(owner, repo);
      if (!project) {
        res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
        return;
      }

      if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
        res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
        return;
      }

      // TODO: Implement releases listing
      res.json({
        data: [],
        pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
      });
    } catch (err) {
      next(err);
    }
  },
);
```

### Adding Validation to a POST Request

```typescript
router.post(
  "/:owner/:repo/branches",
  requireAuth,
  validate([
    { 
      field: "name",
      location: "body",
      type: "string",
      required: true,
      min: 1,
      max: 255,
      pattern: /^[a-zA-Z0-9._/-]+$/, // Branch name pattern
      message: "Invalid branch name"
    },
    {
      field: "from",
      location: "body",
      type: "string",
      min: 1,
      max: 40
    }
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    // Handler implementation
  },
);
```

## Common Patterns

### Checking Repository Ownership

```typescript
// Check if the authenticated user owns the repository
if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
  res.status(403).json({ error: "Insufficient permissions", code: "FORBIDDEN" });
  return;
}
```

### Preventing Self-Operations

```typescript
// Prevent a user from deleting their own account-like resources
if (name === project.defaultBranch) {
  res.status(400).json({
    error: "Cannot delete the default branch",
    code: "CANNOT_DELETE_DEFAULT_BRANCH",
  });
  return;
}
```

### Handling Optional Query Parameters

```typescript
const branch = (req.query.branch as string | undefined)?.trim();
const author = (req.query.author as string | undefined)?.trim();

// Use with filters object
res.json({
  data: [],
  filters: {
    branch: branch || undefined,
    author: author || undefined,
  },
});
```

## Error Handling

The routes use consistent error handling:

```typescript
try {
  // Operation code
  res.json(result);
} catch (err) {
  // Pass to error handler middleware
  next(err);
}
```

The global error handler will catch the error and return an appropriate response.

### Custom Error Responses

```typescript
// Not found
res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });

// Forbidden
res.status(403).json({ error: "Insufficient permissions", code: "FORBIDDEN" });

// Validation error
res.status(400).json({
  error: "Validation failed",
  code: "VALIDATION_ERROR",
  details: [{ field: "name", message: "Required" }],
});

// Conflict
res.status(409).json({ error: "Branch already exists", code: "CONFLICT" });
```

## Performance Considerations

### Pagination
All list endpoints support pagination with configurable limits:
- Default: 20 items per page
- Maximum: 100 items per page

### Caching
For read-only endpoints, consider implementing caching:

```typescript
// Add caching middleware
app.use("/api/repositories/:owner/:repo", cacheMiddleware({ ttl: 300 }));
```

### Database Queries
The routes rely on efficient database queries from the repository pattern:

```typescript
const project = projectRepo.findBySlug(user.id, repo);
```

Ensure these database operations use appropriate indexes.

## Security Considerations

### Input Validation
All user inputs are validated and sanitized:
- XSS prevention through HTML sanitization
- Dangerous characters removal
- Type checking

### Authentication
- JWT tokens required for modification operations
- Bearer token in Authorization header
- Token validation on each request

### Authorization
- Public repositories accessible to all
- Private repositories restricted to owner/admin
- Modification operations require ownership

### SQL Injection Prevention
Database queries use parameterized queries through the repository pattern.

## Future Enhancements

The following features are marked with TODO comments in the code and are planned for future implementation:

1. **Git Integration**
   - File tree browsing using `@platform/git`
   - File content retrieval
   - Commit history and details
   - Branch and tag operations

2. **Statistics**
   - Commit frequency analysis
   - Code churn metrics
   - Contributor statistics
   - File type distribution

3. **Additional Endpoints**
   - Pull requests management
   - Issues tracking
   - Code review support
   - Release management

## Troubleshooting

### Routes not accessible
- Ensure routes are mounted on the app
- Check the mount path matches your requests
- Verify middleware order (authentication before routes)

### Authentication failures
- Verify token is included in Authorization header
- Check token validity and expiration
- Ensure JWT secret is configured correctly

### Validation errors
- Check request format matches the specification
- Verify all required fields are provided
- Check field types and constraints

### Repository not found
- Verify owner username is correct (case-insensitive)
- Verify repository slug is correct
- Check user has access to private repositories

## Support and Documentation

For more information, see:
- `REPOSITORY_ROUTES.md` - Complete API documentation
- `README.md` - Project overview
- `packages/backend/src/routes/` - Other route examples

## Version History

- **1.0.0** (2024-01-16)
  - Initial implementation
  - 14 endpoints
  - Full authentication and authorization
  - Complete input validation
  - Comprehensive error handling
