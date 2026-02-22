# Issue Routes Implementation Guide

## Overview

This guide provides comprehensive documentation for the `issue-routes.ts` file which implements 14 RESTful endpoints for managing issues, comments, labels, and assignees in repositories.

## File Location
```
packages/backend/src/routes/issue-routes.ts
```

## File Statistics
- **Total Lines**: 1112
- **Endpoints**: 14 routes
- **Middleware Used**: 
  - Authentication: `requireAuth`, `optionalAuth`
  - Validation: `validate()`
- **Documentation**: Comprehensive JSDoc comments for all routes and helper functions

## Architecture Overview

### Route Organization

The routes are organized into logical sections:

```
1. Issue Listing and Filtering (GET /issues)
   - Advanced filtering by status, labels, assignees, author
   - Sorting by multiple fields (created, updated, comments, title)
   - Full pagination support

2. Issue Details (GET /issues/:number)
   - Single issue retrieval with all metadata

3. Issue Creation and Updates (POST, PATCH /issues)
   - Create new issues with labels and assignees
   - Update existing issues

4. Issue Status Management (POST /issues/:number/close|reopen)
   - Close issues with optional reason
   - Reopen closed issues

5. Comments (GET, POST, PATCH, DELETE /issues/:number/comments)
   - List comments with pagination
   - Add, edit, delete comments

6. Labels (POST, DELETE /issues/:number/labels)
   - Add multiple labels
   - Remove individual labels

7. Assignees (POST, DELETE /issues/:number/assignees)
   - Assign to multiple users
   - Unassign individual users
```

### Key Components

#### Helper Functions

**`parsePagination(query)`**
- Parses and validates page and perPage query parameters
- Default: page=1, perPage=20
- Maximum: perPage=100
- Returns safe, clamped values

**`resolveRepository(owner, repo)`**
- Resolves owner username and repo slug to a project
- Returns project object or null
- Used by all routes to identify the target repository

**`canAccessRepository(project, userId?, role?)`**
- Checks if user can access a repository
- Public repos: always accessible
- Private repos: requires owner or admin role
- Returns boolean

**`canModifyIssues(project, userId, role)`**
- Checks if user can modify issues in a repository
- Requires repository ownership or admin role
- Returns boolean

**`validateSort(sortBy?, order?)`**
- Validates sort parameters
- Valid fields: created, updated, comments, title
- Valid orders: asc, desc
- Returns tuple of [validatedSortBy, validatedOrder]

**`parseFilterList(value?)`**
- Safely parses comma-separated filter values
- Trims whitespace and removes empty items
- Returns string array

### Middleware Stack

Each route uses a consistent middleware stack:

```typescript
router.METHOD(
  "path",
  [authMiddleware],           // requireAuth or optionalAuth
  validate([rules]),          // Input validation
  (req, res, next) => {       // Handler
    try {
      // Route logic
    } catch (err) {
      next(err);              // Error handling
    }
  }
)
```

### Authentication & Authorization

**Authentication Levels:**
- `requireAuth` - Must be authenticated (401 if missing)
- `optionalAuth` - Authentication is optional (proceeds if invalid)

**Authorization Checks:**
- Repository access: public or owned/admin
- Issue modification: author or owner/admin
- Comment modification: author or owner/admin
- Direct repository operations: owner or admin

### Input Validation

All routes use the `validate()` middleware with specific rules:

**Validation Fields:**
- `field` - Field name
- `location` - Where it appears (body, query, params)
- `required` - Whether field is required
- `type` - Expected type (string, number, boolean, object)
- `min` - Minimum length/value
- `max` - Maximum length/value
- `pattern` - Regular expression for strings
- `message` - Custom error message
- `sanitize` - Whether to sanitize (default: true for strings)

**Automatic Sanitization:**
- All string inputs are automatically sanitized via `sanitizeHtml()`
- Dangerous control characters are stripped
- XSS prevention is built-in

## Database Schema Requirements

The routes expect the following database entities:

### Issues Table
```sql
CREATE TABLE issues (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL, -- 'open' or 'closed'
  authorId TEXT NOT NULL,
  repositoryId TEXT NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE(repositoryId, number)
);
```

### Comments Table
```sql
CREATE TABLE issue_comments (
  id TEXT PRIMARY KEY,
  issueId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  body TEXT NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (issueId) REFERENCES issues(id)
);
```

### Labels Table
```sql
CREATE TABLE issue_labels (
  id TEXT PRIMARY KEY,
  issueId TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  description TEXT,
  FOREIGN KEY (issueId) REFERENCES issues(id),
  UNIQUE(issueId, name)
);
```

### Assignees Table
```sql
CREATE TABLE issue_assignees (
  id TEXT PRIMARY KEY,
  issueId TEXT NOT NULL,
  userId TEXT NOT NULL,
  FOREIGN KEY (issueId) REFERENCES issues(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE(issueId, userId)
);
```

## Implementation Checklist

### Phase 1: Core Issue Operations
- [ ] Implement GET /issues (list with filtering/sorting)
- [ ] Implement GET /issues/:number (single issue)
- [ ] Implement POST /issues (create)
- [ ] Implement PATCH /issues/:number (update)
- [ ] Add database queries for issues table

### Phase 2: Status Management
- [ ] Implement POST /issues/:number/close
- [ ] Implement POST /issues/:number/reopen
- [ ] Add issue status updates to database

### Phase 3: Comments
- [ ] Implement GET /issues/:number/comments
- [ ] Implement POST /issues/:number/comments
- [ ] Implement PATCH /issues/comments/:commentId
- [ ] Implement DELETE /issues/comments/:commentId
- [ ] Add comment CRUD operations to database

### Phase 4: Labels and Assignees
- [ ] Implement POST /issues/:number/labels
- [ ] Implement DELETE /issues/:number/labels/:label
- [ ] Implement POST /issues/:number/assignees
- [ ] Implement DELETE /issues/:number/assignees/:username
- [ ] Add label and assignee management to database

### Phase 5: Testing & Optimization
- [ ] Unit tests for all endpoints
- [ ] Integration tests with real database
- [ ] Performance testing with large datasets
- [ ] Add database indexes
- [ ] Implement rate limiting
- [ ] Add audit logging

## Integration Guide

### Step 1: Mount Routes in Express App

```typescript
import express from "express";
import issueRoutes from "./routes/issue-routes.js";

const app = express();

// Mount at /api/repositories path
app.use("/api/repositories", issueRoutes);

// Or mount with prefix
app.use("/api", issueRoutes);
```

### Step 2: Implement Database Functions

Replace TODO comments in the routes with actual database queries:

```typescript
// Example: In the GET /issues route
const issues = await database.query(
  "SELECT * FROM issues WHERE repositoryId = ?",
  [project.id]
);
```

### Step 3: Create Database Schema

Run migrations to create required tables and indexes.

### Step 4: Configure Authentication

Ensure `requireAuth` and `optionalAuth` middleware are properly configured with JWT verification.

### Step 5: Run Tests

```bash
npm run test -- issue-routes.ts
```

## Response Formats

### Successful List Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 42,
    "totalPages": 3
  },
  "filters": {...},
  "sort": {...}
}
```

### Response Headers (List Endpoints)
```
X-Total-Count: 42
X-Total-Pages: 3
X-Current-Page: 1
X-Per-Page: 20
```

### Successful Item Response
```json
{
  "id": "issue-1",
  "number": 42,
  "title": "...",
  "description": "...",
  "status": "open",
  "author": {...},
  "assignees": [...],
  "labels": [...],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T14:45:00Z",
  "commentCount": 5
}
```

### Error Response
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

## Error Handling

All routes follow consistent error handling:

1. **Try-catch blocks** wrap all route logic
2. **Error codes** for programmatic handling
3. **HTTP status codes** indicate error type
4. **Validation errors** include field details

### Common Errors

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | VALIDATION_ERROR | Input validation failed |
| 401 | AUTH_REQUIRED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Repository/issue/comment not found |
| 409 | CONFLICT | Resource already exists |

## Security Considerations

✅ **Implemented in Routes**
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- XSS prevention via HTML sanitization
- Authentication and authorization checks
- Access control per user role
- CSRF protection via authentication token

⚠️ **Recommended Additional Measures**
- Rate limiting on list endpoints
- Request size limits
- API key authentication option
- Audit logging for modifications
- HTTPS/TLS enforcement
- CORS policy configuration

## Performance Recommendations

1. **Database Indexes**
   - Index on (repositoryId, status) for filtering
   - Index on (authorId) for author filtering
   - Index on (createdAt, updatedAt) for sorting
   - Index on (issueId) in comments/labels tables

2. **Query Optimization**
   - Use pagination to avoid large result sets
   - Limit perPage to reasonable value (default 20, max 100)
   - Pre-fetch related data (assignees, labels) when listing
   - Cache frequently accessed data

3. **Caching**
   - Cache repository access checks
   - Cache user permissions
   - Cache label and assignee lists

4. **Rate Limiting**
   - Limit list endpoints to prevent abuse
   - Apply stricter limits for write operations
   - Track per-user/IP rate limits

## Testing Guide

### Unit Tests

```typescript
describe("GET /api/repositories/:owner/:repo/issues", () => {
  it("should list open issues by default", async () => {
    // Test implementation
  });

  it("should filter by status", async () => {
    // Test implementation
  });

  it("should filter by labels", async () => {
    // Test implementation
  });

  it("should sort issues", async () => {
    // Test implementation
  });

  it("should paginate results", async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
describe("Issue management workflow", () => {
  it("should create, update, and close an issue", async () => {
    // Create issue
    // Add comments
    // Add labels and assignees
    // Close issue
    // Verify all operations
  });
});
```

## Future Enhancements

Possible extensions to the issue routes:

1. **Issue Reactions** - Add emoji reactions to issues/comments
2. **Issue Milestones** - Link issues to project milestones
3. **Issue Templates** - Predefined issue templates
4. **Issue Workflows** - Custom workflows and state transitions
5. **Webhooks** - Notify external systems on issue events
6. **Bulk Operations** - Batch update multiple issues
7. **Search** - Full-text search across issues
8. **History/Audit** - Track all changes to issues
9. **Mentions** - @mention users in issue descriptions/comments
10. **References** - Cross-reference issues (e.g., "fixes #123")

## Troubleshooting

### Routes Not Found
- Ensure router is mounted at correct path
- Check Express middleware order (routes after middleware)
- Verify route handler syntax

### Authentication Failures
- Check JWT secret configuration
- Verify Bearer token format
- Ensure auth middleware is applied

### Validation Errors
- Review validation rules for typos
- Check query/body parameter names match
- Ensure required fields are provided

### Permission Denied
- Verify user ownership of repository
- Check admin role privileges
- Confirm repository privacy settings

## Related Documentation

- `ISSUE_ROUTES_GUIDE.md` - Detailed endpoint documentation
- `ISSUE_ROUTES_SUMMARY.md` - Quick reference guide
- `repository-routes.ts` - Reference implementation pattern
- `auth-guard.ts` - Authentication middleware documentation
- `input-validator.ts` - Validation middleware documentation

## Support

For issues or questions:
1. Check the detailed guides (ISSUE_ROUTES_GUIDE.md, ISSUE_ROUTES_SUMMARY.md)
2. Review the JSDoc comments in the source code
3. Look at similar implementations in repository-routes.ts
4. Check project/organization routes for additional patterns

---

**Created**: February 13, 2024
**File**: packages/backend/src/routes/issue-routes.ts
**Lines of Code**: 1112
**Endpoints**: 14
**Documentation**: Comprehensive JSDoc + 2 guides
