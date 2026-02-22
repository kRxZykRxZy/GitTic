# Database Models

This directory contains comprehensive database models for the platform, built using SQLite with better-sqlite3.

## Overview

All models follow a consistent pattern:
- Use prepared statements for SQL injection prevention
- Import types from `@platform/shared`
- Include JSDoc comments for all functions
- Proper error handling
- Return typed objects matching shared types

## Models

### 1. Repository Model (`repository-model.ts`)

Manages git repositories with full CRUD operations, collaborator management, and settings.

**Exported Functions:**
- `createRepository(input)` - Create a new repository
- `getRepository(id)` - Get repository by ID
- `getRepositoryBySlug(ownerId, slug)` - Get repository by owner and slug
- `updateRepository(id, input)` - Update repository fields
- `deleteRepository(id)` - Delete a repository
- `addCollaborator(repositoryId, userId, permission)` - Add a collaborator
- `removeCollaborator(repositoryId, userId)` - Remove a collaborator
- `getCollaborators(repositoryId)` - List all collaborators
- `getCollaboratorPermission(repositoryId, userId)` - Get user's permission level
- `updateCollaboratorPermission(repositoryId, userId, permission)` - Update permission
- `listRepositories(ownerId)` - List repositories for an owner
- `listOrgRepositories(orgId)` - List repositories for an organization
- `countRepositories(ownerId)` - Count repositories for an owner

**Database Tables:**
- `repositories` - Main repository data
- `repository_collaborators` - Collaborator relationships and permissions

### 2. User Model (`user-model.ts`)

Comprehensive user management with profile, SSH keys, and email handling.

**Exported Functions:**
- `createUser(input)` - Create a new user
- `getUser(id)` - Get user by ID
- `getUserByUsername(username)` - Find user by username
- `getUserByEmail(email)` - Find user by email
- `updateUser(id, input)` - Update user fields
- `deleteUser(id)` - Delete a user
- `getUserProfile(id)` - Get user profile information
- `updateUserProfile(id, profile)` - Update user profile
- `addSSHKey(userId, title, key, fingerprint)` - Add SSH key
- `getSSHKey(id)` - Get SSH key by ID
- `listSSHKeys(userId)` - List all SSH keys for a user
- `deleteSSHKey(id)` - Delete an SSH key
- `updateSSHKeyLastUsed(id)` - Update SSH key last used timestamp
- `addEmail(userId, email, verified, primary)` - Add email address
- `getEmail(id)` - Get email by ID
- `listEmails(userId)` - List all emails for a user
- `deleteEmail(id)` - Delete an email address
- `verifyEmail(id)` - Mark email as verified
- `setPrimaryEmail(userId, emailId)` - Set primary email

**Database Tables:**
- `users` - User accounts and authentication
- `ssh_keys` - User SSH keys for git access
- `user_emails` - Multiple email addresses per user

### 3. Organization Model (`organization-model.ts`)

Organization and team management with member roles and permissions.

**Exported Functions:**
- `createOrg(input)` - Create a new organization
- `getOrg(id)` - Get organization by ID
- `getOrgByLogin(login)` - Get organization by login/slug
- `updateOrg(id, input)` - Update organization fields
- `deleteOrg(id)` - Delete an organization
- `addMember(orgId, userId, role)` - Add a member to organization
- `removeMember(orgId, userId)` - Remove a member
- `getMembers(orgId)` - List all members
- `getMemberRole(orgId, userId)` - Get member's role
- `updateMemberRole(orgId, userId, role)` - Update member's role
- `listUserOrgs(userId)` - List organizations for a user
- `createTeam(orgId, name, slug, description, privacy, permission)` - Create a team
- `getTeam(id)` - Get team by ID
- `listTeams(orgId)` - List all teams in organization
- `deleteTeam(id)` - Delete a team
- `addTeamMember(teamId, userId, role)` - Add member to team
- `removeTeamMember(teamId, userId)` - Remove member from team
- `getTeamMembers(teamId)` - List team members

**Database Tables:**
- `organizations` - Organization data
- `org_members` - Organization membership and roles
- `teams` - Teams within organizations
- `team_members` - Team membership

### 4. Webhook Model (`webhook-model.ts`)

Webhook management with event tracking and delivery logs.

**Exported Functions:**
- `createWebhook(input)` - Create a new webhook
- `getWebhook(id)` - Get webhook by ID
- `listWebhooks(repositoryId)` - List webhooks for a repository
- `updateWebhook(id, input)` - Update webhook fields
- `deleteWebhook(id)` - Delete a webhook
- `activateWebhook(id)` - Activate a webhook
- `deactivateWebhook(id)` - Deactivate a webhook
- `logDelivery(webhookId, event, payload, headers, status, body, error)` - Log webhook delivery
- `getDelivery(id)` - Get delivery by ID
- `listDeliveries(webhookId, limit)` - List webhook deliveries
- `cleanupDeliveries(daysOld)` - Delete old deliveries
- `getDeliveryStats(webhookId)` - Get delivery statistics

**Database Tables:**
- `webhooks` - Webhook configurations
- `webhook_deliveries` - Delivery logs and responses

### 5. Deploy Key Model (`deploy-key-model.ts`)

Deploy key management for repository access.

**Exported Functions:**
- `createDeployKey(input)` - Create a new deploy key
- `getDeployKey(id)` - Get deploy key by ID
- `getDeployKeyByFingerprint(fingerprint)` - Find key by fingerprint
- `listDeployKeys(repositoryId)` - List keys for a repository
- `deleteDeployKey(id)` - Delete a deploy key
- `verifyDeployKey(id)` - Mark key as verified
- `updateDeployKeyLastUsed(id)` - Update last used timestamp
- `hasWriteAccess(id)` - Check if key has write access
- `updateDeployKeyReadOnly(id, readOnly)` - Update read-only status
- `findDeployKeyByTitle(repositoryId, title)` - Find key by title
- `countDeployKeys(repositoryId)` - Count keys for repository
- `listVerifiedDeployKeys(repositoryId)` - List verified keys
- `deleteAllDeployKeys(repositoryId)` - Delete all keys for repository

**Database Tables:**
- `deploy_keys` - SSH keys for automated deployments

## Usage Examples

### Creating a Repository
```typescript
import { createRepository } from './models/repository-model.js';

const repo = createRepository({
  name: 'my-project',
  slug: 'my-project',
  description: 'A cool project',
  ownerId: userId,
  visibility: 'public',
  storagePath: '/repos/user/my-project',
});
```

### Adding a Collaborator
```typescript
import { addCollaborator } from './models/repository-model.js';

addCollaborator(repoId, userId, 'push');
```

### Managing User SSH Keys
```typescript
import { addSSHKey, listSSHKeys } from './models/user-model.js';

const key = addSSHKey(
  userId,
  'My Laptop',
  'ssh-rsa AAAAB3...',
  'SHA256:abc123...'
);

const keys = listSSHKeys(userId);
```

### Creating a Webhook
```typescript
import { createWebhook, logDelivery } from './models/webhook-model.js';

const webhook = createWebhook({
  repositoryId: repoId,
  name: 'CI/CD',
  url: 'https://ci.example.com/hooks',
  events: ['push', 'pull_request'],
  secret: 'webhook-secret',
});

// Log delivery
logDelivery(
  webhook.id,
  'push',
  { ref: 'refs/heads/main' },
  { 'X-Hub-Signature': 'sha256=...' },
  200,
  'OK'
);
```

## Database Schema

All models use the tables created in `migrations.ts`:
- Migration version 14: repositories and collaborators
- Migration version 15: SSH keys and user emails
- Migration version 16: webhooks and deliveries
- Migration version 17: deploy keys
- Migration version 18: team members and repositories

## Security

- All models use prepared statements to prevent SQL injection
- Passwords are never stored in plain text (use `passwordHash`)
- Sensitive data (secrets, tokens) can be null/undefined
- Foreign key constraints ensure data integrity
- Indexes optimize query performance

## Type Safety

All models are fully typed using TypeScript:
- Input types for create/update operations
- Output types match `@platform/shared` definitions
- Database row interfaces for snake_case to camelCase conversion
- Type guards for permission levels and roles
