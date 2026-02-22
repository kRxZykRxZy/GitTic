# Issue Routes Quick Reference

## All Endpoints at a Glance

### Issues
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/repositories/:owner/:repo/issues` | Optional | List issues with filtering & sorting |
| GET | `/api/repositories/:owner/:repo/issues/:number` | Optional | Get issue details |
| POST | `/api/repositories/:owner/:repo/issues` | Required | Create new issue |
| PATCH | `/api/repositories/:owner/:repo/issues/:number` | Required | Update issue |
| POST | `/api/repositories/:owner/:repo/issues/:number/close` | Required | Close issue |
| POST | `/api/repositories/:owner/:repo/issues/:number/reopen` | Required | Reopen issue |

### Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/repositories/:owner/:repo/issues/:number/comments` | Optional | List comments |
| POST | `/api/repositories/:owner/:repo/issues/:number/comments` | Required | Add comment |
| PATCH | `/api/repositories/:owner/:repo/issues/comments/:commentId` | Required | Update comment |
| DELETE | `/api/repositories/:owner/:repo/issues/comments/:commentId` | Required | Delete comment |

### Labels
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/repositories/:owner/:repo/issues/:number/labels` | Required | Add labels |
| DELETE | `/api/repositories/:owner/:repo/issues/:number/labels/:label` | Required | Remove label |

### Assignees
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/repositories/:owner/:repo/issues/:number/assignees` | Required | Add assignees |
| DELETE | `/api/repositories/:owner/:repo/issues/:number/assignees/:username` | Required | Remove assignee |

---

## Query Parameters (Filtering & Pagination)

### List Issues
```
?status=open|closed|all         # Filter by status (default: open)
&labels=bug,urgent              # Comma-separated label names
&assignees=john,jane            # Comma-separated usernames
&author=john                    # Filter by author username
&sort=created|updated|comments|title  # Sort field (default: updated)
&order=asc|desc                 # Sort order (default: desc)
&page=1                         # Page number (default: 1)
&perPage=20                     # Results per page (default: 20, max: 100)
```

### List Comments
```
?page=1                         # Page number (default: 1)
&perPage=20                     # Results per page (default: 20, max: 100)
```

---

## Request Body Examples

### Create Issue
```json
{
  "title": "Bug: Login fails with special characters",
  "description": "When logging in with special characters in the username...",
  "labels": ["bug", "priority-high"],
  "assignees": ["jane"]
}
```

### Update Issue
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "labels": ["bug", "urgent"],
  "assignees": ["jane", "bob"]
}
```

### Add Comment
```json
{
  "body": "This is a comment on the issue..."
}
```

### Update Comment
```json
{
  "body": "Updated comment text"
}
```

### Close Issue
```json
{
  "reason": "Fixed in v1.2.0"
}
```

### Reopen Issue
```json
{
  "reason": "Still present in latest version"
}
```

### Add Labels
```json
{
  "labels": ["bug", "urgent", "p0"]
}
```

### Add Assignees
```json
{
  "assignees": ["jane", "bob"]
}
```

---

## Response Format

### Successful Paginated Response (List Issues/Comments)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Response Headers:**
- `X-Total-Count: 42`
- `X-Total-Pages: 3`
- `X-Current-Page: 1`
- `X-Per-Page: 20`

### Successful Single Item Response
```json
{
  "id": "issue-1",
  "number": 42,
  "title": "...",
  "description": "...",
  "status": "open|closed",
  "author": {
    "id": "user-1",
    "username": "john",
    "avatar": null
  },
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
  "error": "Repository not found",
  "code": "NOT_FOUND"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource successfully created |
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |

---

## Validation Rules

### Issue Title
- Required for POST, optional for PATCH
- Min: 1 character
- Max: 255 characters
- Sanitized for XSS

### Issue Description
- Optional
- Max: 10,000 characters
- Sanitized for XSS

### Comment Body
- Required
- Min: 1 character
- Max: 5,000 characters
- Sanitized for XSS

### Labels
- Array of strings
- Each label: 1-100 characters
- Sanitized for XSS

### Assignees
- Array of usernames
- Must be existing users
- Must have repository access

### Issue Number
- Must be a valid integer
- Must exist in the repository

---

## Feature Capabilities

✅ **Listing with Filtering**
- By status (open/closed/all)
- By labels (multiple)
- By assignees (multiple)
- By author

✅ **Sorting**
- By creation date
- By last updated
- By comment count
- By title
- Ascending or descending

✅ **Pagination**
- Configurable page size (1-100)
- Default: 20 per page
- Total count and page metadata

✅ **Comments**
- Add comments to issues
- Edit own comments
- Delete own comments
- Admin can delete any comment

✅ **Labels**
- Add multiple labels
- Remove individual labels
- New labels created on-demand

✅ **Assignees**
- Assign to multiple users
- Unassign individual users
- User existence validation

✅ **Status Management**
- Close issues with optional reason
- Reopen issues with optional reason

✅ **Access Control**
- Public repository access
- Private repository restrictions
- Permission checks for modifications
- Issue author and repository owner can modify

---

## Implementation Checklist

- [x] Route definitions with proper middleware
- [x] Input validation and sanitization
- [x] Authentication and authorization checks
- [x] Comprehensive JSDoc comments
- [x] Proper error handling
- [x] Pagination support
- [x] Filtering and sorting support
- [ ] Database implementation
- [ ] Integration tests
- [ ] API documentation
- [ ] Rate limiting
- [ ] Audit logging

---

## Key Features

### Security
- Input validation and sanitization
- XSS prevention via HTML sanitization
- SQL injection prevention
- CSRF protection via authentication
- Access control per user role

### Performance
- Pagination to prevent large result sets
- Configurable page sizes
- Proper indexing recommendations
- Response header metadata

### User Experience
- Clear error messages
- Consistent response format
- Full filtering and sorting
- Multiple comment per issue
- Multiple labels per issue
- Multiple assignees per issue

---

## Integration Steps

1. **Mount the router** in your Express app:
   ```typescript
   import issueRoutes from "./routes/issue-routes.js";
   app.use("/api/repositories", issueRoutes);
   ```

2. **Implement database queries** - Replace TODO sections with actual database calls

3. **Set up database schema** with tables:
   - `issues`
   - `issue_comments`
   - `issue_labels`
   - `issue_assignees`

4. **Add tests** for all endpoints

5. **Configure authentication** - Routes expect auth middleware to populate `req.user`

6. **Add rate limiting** - Recommended for list endpoints

7. **Enable audit logging** - Track issue modifications

---

## Support for Future Features

The route design supports future additions:
- Issue reactions/emojis
- Issue milestones
- Issue workflows/automation
- Webhooks on issue events
- Search functionality
- Bulk operations
- History/audit trail
