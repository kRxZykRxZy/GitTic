# Repository Routes Documentation

Comprehensive REST API routes for managing and accessing repositories in the DevForge platform.

## Overview

The Repository Routes module (`repository-routes.ts`) provides REST API endpoints for:
- Repository metadata and details
- File browsing and content retrieval
- Commit history and details
- Branch and tag management
- Contributor statistics
- Repository statistics

All routes follow RESTful conventions and include proper authentication, authorization, input validation, and error handling.

## Authentication & Authorization

- **Public repositories**: Accessible to all users (authenticated and anonymous)
- **Private repositories**: Only accessible to the owner and admin users
- **Modification operations**: Require authentication as the repository owner or admin
  - Creating/deleting branches
  - Creating/deleting tags
  - File operations

## Response Format

All responses follow a consistent JSON format:

### Success Responses
```json
{
  "data": { /* ... */ },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Responses
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": []  // Optional, for validation errors
}
```

## Pagination

Pagination parameters are available on list endpoints:
- `page` (default: 1): Page number
- `perPage` (default: 20): Results per page (max: 100)

Pagination metadata is returned in:
- Response headers: `X-Total-Count`, `X-Total-Pages`, `X-Current-Page`, `X-Per-Page`
- Response body: `pagination` object

## Endpoints

### Repository Details

#### GET /api/repositories/:owner/:repo
Retrieve detailed information about a repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project
```

**Response:**
```json
{
  "id": "abc123",
  "name": "My Project",
  "slug": "my-project",
  "description": "A great project",
  "owner": {
    "id": "user-123",
    "username": "john"
  },
  "url": "/api/repositories/john/my-project",
  "isPrivate": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T12:30:00Z"
}
```

---

### File Browsing

#### GET /api/repositories/:owner/:repo/tree/:branch/*path
Browse the file tree of a repository at a specific branch and path.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `branch` (path): Git branch name or commit SHA
- `path` (path): File path within the repository (optional, defaults to root)

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/tree/main
curl https://api.example.com/api/repositories/john/my-project/tree/develop/src/components
```

**Response:**
```json
{
  "path": "/src",
  "branch": "main",
  "entries": [
    {
      "name": "components",
      "type": "directory",
      "path": "src/components",
      "size": null
    },
    {
      "name": "index.ts",
      "type": "file",
      "path": "src/index.ts",
      "size": 1024
    }
  ]
}
```

---

#### GET /api/repositories/:owner/:repo/blob/:branch/*path
Retrieve the content of a specific file in a repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `branch` (path): Git branch name or commit SHA
- `path` (path): Path to the file within the repository
- `raw` (query): If `true`, return raw content instead of JSON (optional)

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
# Get JSON response
curl https://api.example.com/api/repositories/john/my-project/blob/main/README.md

# Get raw content
curl https://api.example.com/api/repositories/john/my-project/blob/main/README.md?raw=true
```

**Response (JSON):**
```json
{
  "path": "README.md",
  "branch": "main",
  "content": "# My Project\n\nThis is my project...",
  "encoding": "utf-8",
  "size": 1024
}
```

**Response (Raw):**
```
# My Project

This is my project...
```

---

### Commit History

#### GET /api/repositories/:owner/:repo/commits
List commits in a repository, optionally filtered by branch or author.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `branch` (query): Git branch name or commit SHA (optional)
- `author` (query): Filter commits by author email (optional)
- `page` (query): Page number (default: 1)
- `perPage` (query): Results per page (default: 20, max: 100)

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/commits
curl https://api.example.com/api/repositories/john/my-project/commits?branch=develop&page=2
curl https://api.example.com/api/repositories/john/my-project/commits?author=john@example.com
```

**Response:**
```json
{
  "data": [
    {
      "sha": "abc1234567890",
      "message": "Add new feature",
      "author": {
        "name": "John Doe",
        "email": "john@example.com",
        "date": "2024-01-15T12:30:00Z"
      },
      "stats": {
        "additions": 50,
        "deletions": 10
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  },
  "filters": {
    "branch": "develop",
    "author": null
  }
}
```

---

#### GET /api/repositories/:owner/:repo/commits/:sha
Retrieve detailed information about a specific commit.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `sha` (path): Commit SHA or short SHA (7-40 characters)

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/commits/abc1234567890
```

**Response:**
```json
{
  "sha": "abc1234567890def",
  "message": "Add new feature\n\nThis commit adds a new feature...",
  "author": {
    "name": "John Doe",
    "email": "john@example.com",
    "date": "2024-01-15T12:30:00Z"
  },
  "committer": {
    "name": "John Doe",
    "email": "john@example.com",
    "date": "2024-01-15T12:30:00Z"
  },
  "stats": {
    "additions": 150,
    "deletions": 25,
    "total": 175
  },
  "files": [
    {
      "name": "src/feature.ts",
      "status": "added",
      "additions": 100,
      "deletions": 0
    }
  ]
}
```

---

### Branch Management

#### GET /api/repositories/:owner/:repo/branches
List all branches in a repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `page` (query): Page number (default: 1)
- `perPage` (query): Results per page (default: 20, max: 100)

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/branches
```

**Response:**
```json
{
  "data": [
    {
      "name": "main",
      "commit": {
        "sha": "abc1234567890",
        "message": "Latest commit",
        "author": "John Doe",
        "date": "2024-01-15T12:30:00Z"
      },
      "protected": true
    },
    {
      "name": "develop",
      "commit": {
        "sha": "def4567890123",
        "message": "Work in progress",
        "author": "Jane Smith",
        "date": "2024-01-14T10:15:00Z"
      },
      "protected": false
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

#### GET /api/repositories/:owner/:repo/branches/:name
Retrieve detailed information about a specific branch.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `name` (path): Branch name

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/branches/develop
```

**Response:**
```json
{
  "name": "develop",
  "commit": {
    "sha": "def4567890123",
    "message": "Work in progress",
    "author": "Jane Smith",
    "date": "2024-01-14T10:15:00Z"
  },
  "protected": false
}
```

---

#### POST /api/repositories/:owner/:repo/branches
Create a new branch in the repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `name` (body): Name of the new branch (required)
- `from` (body): Branch or commit SHA to create from (optional, defaults to default branch)

**Requires:**
- Authentication
- User must be repository owner or admin

**Example:**
```bash
curl -X POST https://api.example.com/api/repositories/john/my-project/branches \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d {
    "name": "feature/new-feature",
    "from": "main"
  }
```

**Response:**
```json
{
  "name": "feature/new-feature",
  "commit": {
    "sha": "abc1234567890",
    "message": "Latest commit",
    "author": "John Doe",
    "date": "2024-01-15T12:30:00Z"
  },
  "protected": false
}
```

---

#### DELETE /api/repositories/:owner/:repo/branches/:name
Delete a branch from the repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `name` (path): Name of the branch to delete

**Requires:**
- Authentication
- User must be repository owner or admin
- Branch cannot be the default branch

**Example:**
```bash
curl -X DELETE https://api.example.com/api/repositories/john/my-project/branches/feature/old-feature \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "message": "Branch 'feature/old-feature' deleted successfully"
}
```

---

### Tag Management

#### GET /api/repositories/:owner/:repo/tags
List all tags in a repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `page` (query): Page number (default: 1)
- `perPage` (query): Results per page (default: 20, max: 100)

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/tags
```

**Response:**
```json
{
  "data": [
    {
      "name": "v1.0.0",
      "commit": {
        "sha": "abc1234567890",
        "message": "Release v1.0.0"
      },
      "tagger": {
        "name": "John Doe",
        "email": "john@example.com",
        "date": "2024-01-15T12:30:00Z"
      },
      "message": "Release version 1.0.0"
    },
    {
      "name": "v0.9.0",
      "commit": {
        "sha": "def4567890123",
        "message": "Release v0.9.0"
      },
      "tagger": {
        "name": "John Doe",
        "email": "john@example.com",
        "date": "2024-01-10T09:15:00Z"
      },
      "message": "Release version 0.9.0"
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

---

#### POST /api/repositories/:owner/:repo/tags
Create a new tag in the repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `name` (body): Name of the new tag (required)
- `target` (body): Branch or commit SHA to tag (required)
- `message` (body): Optional message for annotated tags (optional)

**Requires:**
- Authentication
- User must be repository owner or admin

**Example:**
```bash
curl -X POST https://api.example.com/api/repositories/john/my-project/tags \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d {
    "name": "v1.1.0",
    "target": "main",
    "message": "Release version 1.1.0"
  }
```

**Response:**
```json
{
  "name": "v1.1.0",
  "commit": {
    "sha": "abc1234567890",
    "message": "Latest commit"
  },
  "tagger": {
    "name": "john",
    "email": "john@example.com",
    "date": "2024-01-16T14:45:00Z"
  },
  "message": "Release version 1.1.0"
}
```

---

#### DELETE /api/repositories/:owner/:repo/tags/:name
Delete a tag from the repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `name` (path): Name of the tag to delete

**Requires:**
- Authentication
- User must be repository owner or admin

**Example:**
```bash
curl -X DELETE https://api.example.com/api/repositories/john/my-project/tags/v0.9.0 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "message": "Tag 'v0.9.0' deleted successfully"
}
```

---

### Repository Statistics

#### GET /api/repositories/:owner/:repo/contributors
Get a list of contributors to the repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug
- `page` (query): Page number (default: 1)
- `perPage` (query): Results per page (default: 20, max: 100)

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/contributors
```

**Response:**
```json
{
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "commits": 150,
      "additions": 5000,
      "deletions": 1200,
      "firstCommit": "2023-06-01T10:00:00Z",
      "lastCommit": "2024-01-15T12:30:00Z"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "commits": 45,
      "additions": 1500,
      "deletions": 300,
      "firstCommit": "2023-09-15T14:20:00Z",
      "lastCommit": "2024-01-14T09:45:00Z"
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

---

#### GET /api/repositories/:owner/:repo/stats
Retrieve comprehensive statistics about the repository.

**Parameters:**
- `owner` (path): Repository owner's username
- `repo` (path): Repository slug

**Requires:**
- No authentication for public repos
- Authentication for private repos

**Example:**
```bash
curl https://api.example.com/api/repositories/john/my-project/stats
```

**Response:**
```json
{
  "commits": {
    "total": 250,
    "weekly": [
      { "week": "2024-01-08", "count": 15 },
      { "week": "2024-01-15", "count": 22 }
    ],
    "monthly": [
      { "month": "2024-01", "count": 85 },
      { "month": "2023-12", "count": 92 }
    ]
  },
  "churn": {
    "additions": 8500,
    "deletions": 2100,
    "total": 10600
  },
  "files": {
    "total": 450,
    "byType": {
      "ts": 180,
      "js": 90,
      "json": 45,
      "md": 25,
      "other": 110
    }
  },
  "contributors": {
    "total": 5,
    "topContributors": [
      { "name": "John Doe", "commits": 150 },
      { "name": "Jane Smith", "commits": 45 }
    ]
  },
  "size": {
    "bytes": 5242880,
    "largestFiles": [
      { "name": "node_modules.tar.gz", "size": 2097152 },
      { "name": "dist/bundle.js", "size": 1048576 }
    ]
  },
  "activity": {
    "clones": 342,
    "lastCommitDate": "2024-01-15T12:30:00Z",
    "firstCommitDate": "2023-06-01T10:00:00Z"
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Repository, branch, tag, or commit not found |
| `FORBIDDEN` | 403 | User lacks permissions for the operation |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTH_REQUIRED` | 401 | Authentication required but not provided |
| `CONFLICT` | 409 | Conflict (e.g., branch already exists) |
| `CANNOT_DELETE_DEFAULT_BRANCH` | 400 | Cannot delete the default branch |

---

## Input Validation

All route inputs are validated according to these rules:

### Branch Names
- Allowed characters: `a-z`, `A-Z`, `0-9`, `.`, `/`, `-`
- Min length: 1, Max length: 255

### Tag Names
- Allowed characters: `a-z`, `A-Z`, `0-9`, `.`, `-`, `_`
- Min length: 1, Max length: 255

### Commit SHA
- Min length: 7, Max length: 40

### File Paths
- Case-insensitive
- Leading/trailing slashes stripped

---

## Best Practices

1. **Pagination**: Always use pagination for list endpoints to manage large datasets
2. **Filtering**: Use query parameters to filter results (branch, author, etc.)
3. **Error Handling**: Check the error code and handle specific error cases
4. **Raw Content**: Use `?raw=true` for file content when you need plain text
5. **Caching**: Cache public repository metadata where appropriate
6. **Rate Limiting**: Implement rate limiting for API calls (implementation in progress)

---

## Implementation Notes

The routes module is designed to be integrated with:
- `@platform/git` package for Git operations
- Backend database repositories for metadata
- Authentication middleware for access control
- Input validation middleware for data sanitization

TODO: Implement backing Git operations using `@platform/git` utilities once the package is available.
