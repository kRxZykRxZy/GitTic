# Issue Routes Documentation

Comprehensive REST API routes for managing issues in repositories.

## Overview

The issue routes module (`issue-routes.ts`) provides a complete set of endpoints for managing issues, comments, labels, and assignees in repositories. All routes support authentication, proper authorization checks, input validation, and error handling.

## Route Summary

### Issue Listing and Filtering
- **GET** `/api/repositories/:owner/:repo/issues` - List issues with filtering and sorting

### Issue Details
- **GET** `/api/repositories/:owner/:repo/issues/:number` - Get issue details

### Issue Creation and Updates
- **POST** `/api/repositories/:owner/:repo/issues` - Create new issue
- **PATCH** `/api/repositories/:owner/:repo/issues/:number` - Update issue

### Issue Status Management
- **POST** `/api/repositories/:owner/:repo/issues/:number/close` - Close issue
- **POST** `/api/repositories/:owner/:repo/issues/:number/reopen` - Reopen issue

### Comments
- **GET** `/api/repositories/:owner/:repo/issues/:number/comments` - List comments
- **POST** `/api/repositories/:owner/:repo/issues/:number/comments` - Add comment
- **PATCH** `/api/repositories/:owner/:repo/issues/comments/:commentId` - Update comment
- **DELETE** `/api/repositories/:owner/:repo/issues/comments/:commentId` - Delete comment

### Labels
- **POST** `/api/repositories/:owner/:repo/issues/:number/labels` - Add labels
- **DELETE** `/api/repositories/:owner/:repo/issues/:number/labels/:label` - Remove label

### Assignees
- **POST** `/api/repositories/:owner/:repo/issues/:number/assignees` - Add assignees
- **DELETE** `/api/repositories/:owner/:repo/issues/:number/assignees/:username` - Remove assignee

---

## Detailed Endpoint Documentation

### GET /api/repositories/:owner/:repo/issues

List all issues in a repository with optional filtering and sorting.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug

**Query Parameters:**
- `status` (string, optional) - Filter by status: `open`, `closed`, or `all` (defaults to `open`)
- `labels` (string, optional) - Comma-separated label names (e.g., `bug,urgent,p0`)
- `assignees` (string, optional) - Comma-separated usernames (e.g., `john,jane`)
- `author` (string, optional) - Filter by issue author username
- `sort` (string, optional) - Sort field: `created`, `updated`, `comments`, or `title` (defaults to `updated`)
- `order` (string, optional) - Sort order: `asc` or `desc` (defaults to `desc`)
- `page` (integer, optional) - Page number for pagination (defaults to 1)
- `perPage` (integer, optional) - Results per page (1-100, defaults to 20)

#### Authentication
- Optional - public repositories are accessible without authentication; private repositories require owner or admin

#### Response

```json
{
  "data": [
    {
      "id": "issue-1",
      "number": 1,
      "title": "Add dark mode support",
      "description": "Implement dark mode theme...",
      "status": "open",
      "author": {
        "id": "user-1",
        "username": "john",
        "avatar": null
      },
      "assignees": [
        {
          "id": "user-2",
          "username": "jane",
          "avatar": null
        }
      ],
      "labels": ["feature", "ui"],
      "createdAt": "2024-02-13T10:30:00Z",
      "updatedAt": "2024-02-13T14:45:00Z",
      "commentCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 42,
    "totalPages": 3
  },
  "filters": {
    "status": "open",
    "labels": ["bug", "urgent"],
    "assignees": ["john"],
    "author": "jane"
  },
  "sort": {
    "by": "updated",
    "order": "desc"
  }
}
```

#### Response Headers
- `X-Total-Count` - Total number of issues
- `X-Total-Pages` - Total number of pages
- `X-Current-Page` - Current page number
- `X-Per-Page` - Results per page

#### Examples

```bash
# List all open issues
curl -X GET "https://api.example.com/api/repositories/john/my-project/issues"

# List closed issues sorted by creation date
curl -X GET "https://api.example.com/api/repositories/john/my-project/issues?status=closed&sort=created&order=asc"

# Filter by labels and assignees with pagination
curl -X GET "https://api.example.com/api/repositories/john/my-project/issues?labels=bug,urgent&assignees=john,jane&page=2&perPage=50"

# Filter by author
curl -X GET "https://api.example.com/api/repositories/john/my-project/issues?author=jane"
```

---

### GET /api/repositories/:owner/:repo/issues/:number

Retrieve detailed information about a specific issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

#### Authentication
- Optional - same access rules as issue listing

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support",
  "description": "Implement dark mode theme for better user experience",
  "status": "open",
  "author": {
    "id": "user-1",
    "username": "john",
    "avatar": null
  },
  "assignees": [
    {
      "id": "user-2",
      "username": "jane",
      "avatar": null
    }
  ],
  "labels": ["feature", "ui", "priority-high"],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T14:45:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
curl -X GET "https://api.example.com/api/repositories/john/my-project/issues/42"
```

---

### POST /api/repositories/:owner/:repo/issues

Create a new issue in a repository.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug

**Request Body:**
```typescript
{
  "title": string,           // Required, 1-255 characters
  "description"?: string,    // Optional, max 10000 characters
  "labels"?: string[],       // Optional array of label names
  "assignees"?: string[]     // Optional array of usernames
}
```

#### Authentication
- Required - `Authorization: Bearer <token>`

#### Response
- Status: **201 Created**

```json
{
  "id": "issue-1",
  "number": 43,
  "title": "Add dark mode support",
  "description": "Implement dark mode theme for better user experience",
  "status": "open",
  "author": {
    "id": "user-1",
    "username": "john",
    "avatar": null
  },
  "assignees": [
    {
      "id": "user-2",
      "username": "jane",
      "avatar": null
    }
  ],
  "labels": ["feature", "ui"],
  "createdAt": "2024-02-13T15:00:00Z",
  "updatedAt": "2024-02-13T15:00:00Z",
  "commentCount": 0
}
```

#### Examples

```bash
curl -X POST "https://api.example.com/api/repositories/john/my-project/issues" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add dark mode support",
    "description": "Implement dark mode theme for better user experience",
    "labels": ["feature", "ui"],
    "assignees": ["jane"]
  }'
```

---

### PATCH /api/repositories/:owner/:repo/issues/:number

Update an existing issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

**Request Body:**
```typescript
{
  "title"?: string,          // Optional, 1-255 characters
  "description"?: string,    // Optional, max 10000 characters
  "labels"?: string[],       // Optional array of label names (replaces existing)
  "assignees"?: string[]     // Optional array of usernames (replaces existing)
}
```

#### Authentication
- Required - issue author or repository owner/admin

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support and accessibility features",
  "description": "Updated description",
  "status": "open",
  "author": {...},
  "assignees": [...],
  "labels": ["feature", "ui"],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T16:00:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
curl -X PATCH "https://api.example.com/api/repositories/john/my-project/issues/42" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add dark mode support and accessibility features",
    "labels": ["feature", "ui", "a11y"]
  }'
```

---

### POST /api/repositories/:owner/:repo/issues/:number/close

Close an open issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

**Request Body:**
```typescript
{
  "reason"?: string  // Optional reason for closing, max 1000 characters
}
```

#### Authentication
- Required - issue author or repository owner/admin

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support",
  "description": "...",
  "status": "closed",
  "author": {...},
  "assignees": [...],
  "labels": [...],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T17:00:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
curl -X POST "https://api.example.com/api/repositories/john/my-project/issues/42/close" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Fixed in v1.2.0"}'
```

---

### POST /api/repositories/:owner/:repo/issues/:number/reopen

Reopen a closed issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

**Request Body:**
```typescript
{
  "reason"?: string  // Optional reason for reopening, max 1000 characters
}
```

#### Authentication
- Required - issue author or repository owner/admin

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support",
  "description": "...",
  "status": "open",
  "author": {...},
  "assignees": [...],
  "labels": [...],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T18:00:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
curl -X POST "https://api.example.com/api/repositories/john/my-project/issues/42/reopen" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Issue still present in latest version"}'
```

---

### GET /api/repositories/:owner/:repo/issues/:number/comments

List all comments on an issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

**Query Parameters:**
- `page` (integer, optional) - Page number (defaults to 1)
- `perPage` (integer, optional) - Results per page (1-100, defaults to 20)

#### Authentication
- Optional - same access rules as issue listing

#### Response

```json
{
  "data": [
    {
      "id": "comment-1",
      "issueNumber": 42,
      "author": {
        "id": "user-2",
        "username": "jane",
        "avatar": null
      },
      "body": "This is a great feature request. I suggest we implement...",
      "createdAt": "2024-02-13T11:00:00Z",
      "updatedAt": "2024-02-13T11:00:00Z"
    },
    {
      "id": "comment-2",
      "issueNumber": 42,
      "author": {
        "id": "user-1",
        "username": "john",
        "avatar": null
      },
      "body": "I agree with jane's suggestion. Let me draft a design...",
      "createdAt": "2024-02-13T12:00:00Z",
      "updatedAt": "2024-02-13T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

#### Examples

```bash
curl -X GET "https://api.example.com/api/repositories/john/my-project/issues/42/comments"

# With pagination
curl -X GET "https://api.example.com/api/repositories/john/my-project/issues/42/comments?page=2&perPage=50"
```

---

### POST /api/repositories/:owner/:repo/issues/:number/comments

Add a new comment to an issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

**Request Body:**
```typescript
{
  "body": string  // Required, 1-5000 characters
}
```

#### Authentication
- Required - `Authorization: Bearer <token>`

#### Response
- Status: **201 Created**

```json
{
  "id": "comment-3",
  "issueNumber": 42,
  "author": {
    "id": "user-1",
    "username": "john",
    "avatar": null
  },
  "body": "This is a great issue. I suggest we implement it as follows...",
  "createdAt": "2024-02-13T13:00:00Z",
  "updatedAt": "2024-02-13T13:00:00Z"
}
```

#### Examples

```bash
curl -X POST "https://api.example.com/api/repositories/john/my-project/issues/42/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "This is a great issue. I suggest we implement it as follows..."}'
```

---

### PATCH /api/repositories/:owner/:repo/issues/comments/:commentId

Update an existing comment.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `commentId` (string) - Comment unique identifier

**Request Body:**
```typescript
{
  "body": string  // Required, 1-5000 characters
}
```

#### Authentication
- Required - comment author or repository owner/admin

#### Response

```json
{
  "id": "comment-3",
  "issueNumber": 42,
  "author": {
    "id": "user-1",
    "username": "john",
    "avatar": null
  },
  "body": "Updated comment with corrected information",
  "createdAt": "2024-02-13T13:00:00Z",
  "updatedAt": "2024-02-13T14:00:00Z"
}
```

#### Examples

```bash
curl -X PATCH "https://api.example.com/api/repositories/john/my-project/issues/comments/comment-3" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Updated comment with corrected information"}'
```

---

### DELETE /api/repositories/:owner/:repo/issues/comments/:commentId

Delete a comment from an issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `commentId` (string) - Comment unique identifier

#### Authentication
- Required - comment author or repository owner/admin

#### Response

```json
{
  "message": "Comment 'comment-3' deleted successfully"
}
```

#### Examples

```bash
curl -X DELETE "https://api.example.com/api/repositories/john/my-project/issues/comments/comment-3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/repositories/:owner/:repo/issues/:number/labels

Add labels to an issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

**Request Body:**
```typescript
{
  "labels": string[]  // Required, non-empty array of label names
}
```

#### Authentication
- Required - issue author or repository owner/admin

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support",
  "description": "...",
  "status": "open",
  "author": {...},
  "assignees": [...],
  "labels": ["bug", "urgent", "p0", "feature", "ui"],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T19:00:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
curl -X POST "https://api.example.com/api/repositories/john/my-project/issues/42/labels" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"labels": ["bug", "urgent", "p0"]}'
```

---

### DELETE /api/repositories/:owner/:repo/issues/:number/labels/:label

Remove a label from an issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number
- `label` (string) - Label name (URL-encoded if it contains special characters)

#### Authentication
- Required - issue author or repository owner/admin

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support",
  "description": "...",
  "status": "open",
  "author": {...},
  "assignees": [...],
  "labels": ["feature", "ui"],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T20:00:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
# Remove a simple label
curl -X DELETE "https://api.example.com/api/repositories/john/my-project/issues/42/labels/urgent" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Remove a label with special characters (URL-encoded)
curl -X DELETE "https://api.example.com/api/repositories/john/my-project/issues/42/labels/help-wanted" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/repositories/:owner/:repo/issues/:number/assignees

Add assignees to an issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number

**Request Body:**
```typescript
{
  "assignees": string[]  // Required, non-empty array of usernames
}
```

#### Authentication
- Required - issue author or repository owner/admin

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support",
  "description": "...",
  "status": "open",
  "author": {...},
  "assignees": [
    {
      "id": "user-2",
      "username": "jane",
      "avatar": null
    },
    {
      "id": "user-3",
      "username": "bob",
      "avatar": null
    }
  ],
  "labels": [...],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T21:00:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
curl -X POST "https://api.example.com/api/repositories/john/my-project/issues/42/assignees" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assignees": ["jane", "bob"]}'
```

---

### DELETE /api/repositories/:owner/:repo/issues/:number/assignees/:username

Remove an assignee from an issue.

#### Parameters

**Path Parameters:**
- `owner` (string) - Repository owner's username
- `repo` (string) - Repository slug
- `number` (integer) - Issue number
- `username` (string) - Username of the assignee to remove

#### Authentication
- Required - issue author or repository owner/admin

#### Response

```json
{
  "id": "issue-1",
  "number": 42,
  "title": "Add dark mode support",
  "description": "...",
  "status": "open",
  "author": {...},
  "assignees": [
    {
      "id": "user-3",
      "username": "bob",
      "avatar": null
    }
  ],
  "labels": [...],
  "createdAt": "2024-02-13T10:30:00Z",
  "updatedAt": "2024-02-13T22:00:00Z",
  "commentCount": 5
}
```

#### Examples

```bash
curl -X DELETE "https://api.example.com/api/repositories/john/my-project/issues/42/assignees/jane" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Authorization Rules

### Public Repositories
- **Listing & Reading**: Accessible to anyone (authenticated or not)
- **Creating Issues**: Requires authentication
- **Modifying Issues**: Requires issue author, repository owner, or admin role
- **Commenting**: Requires authentication
- **Modifying Comments**: Requires comment author, repository owner, or admin role

### Private Repositories
- **All Operations**: Require authentication and either repository ownership or admin role

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Repository, issue, or comment not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTH_REQUIRED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `USER_NOT_FOUND` | 400 | Referenced user does not exist |

---

## Implementation Notes

### TODO Items

The following features need database implementation:

1. **Issue Listing** - Implement database queries with filtering and sorting
2. **Issue CRUD** - Implement create, read, update operations
3. **Status Management** - Implement issue closing and reopening
4. **Comments** - Implement comment storage and retrieval
5. **Labels** - Implement label management
6. **Assignees** - Implement assignee tracking

### Database Schema Considerations

Ensure the following tables exist with appropriate relationships:

- `issues` - Main issues table
- `issue_comments` - Comments on issues
- `issue_labels` - Label associations
- `issue_assignees` - Assignee associations

---

## Integration Example

To integrate these routes into your Express application:

```typescript
import express from "express";
import issueRoutes from "./routes/issue-routes.js";

const app = express();

// Mount issue routes
app.use("/api/repositories", issueRoutes);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

---

## Testing

Example test cases to implement:

- List issues with various filter combinations
- Create issue with labels and assignees
- Update issue fields
- Close and reopen issues
- Add/edit/delete comments
- Add/remove labels
- Add/remove assignees
- Test permission checks for private repositories
- Test error responses for invalid input

