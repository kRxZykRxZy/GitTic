# Database Models Quick Reference

## Import All Models
```typescript
import * as Models from './db/models';
// or
import { createRepository, getUser, createOrg } from './db/models';
```

## Repository Operations

```typescript
// Create repository
const repo = Models.createRepository({
  name: 'my-project',
  slug: 'my-project',
  ownerId: userId,
  storagePath: '/repos/user/my-project',
  visibility: 'public'
});

// Get repository
const repo = Models.getRepository(repoId);
const repo = Models.getRepositoryBySlug(ownerId, 'my-project');

// Update repository
Models.updateRepository(repoId, {
  description: 'New description',
  visibility: 'private'
});

// Manage collaborators
Models.addCollaborator(repoId, userId, 'push');
Models.removeCollaborator(repoId, userId);
const collabs = Models.getCollaborators(repoId);
```

## User Operations

```typescript
// Create user
const user = Models.createUser({
  username: 'john',
  email: 'john@example.com',
  passwordHash: await hashPassword('password'),
  ageVerified: true,
  termsAccepted: true
});

// Get user
const user = Models.getUser(userId);
const user = Models.getUserByUsername('john');
const user = Models.getUserByEmail('john@example.com');

// SSH keys
const key = Models.addSSHKey(userId, 'My Laptop', sshKey, fingerprint);
const keys = Models.listSSHKeys(userId);
Models.deleteSSHKey(keyId);

// Email management
const email = Models.addEmail(userId, 'new@example.com');
Models.verifyEmail(emailId);
Models.setPrimaryEmail(userId, emailId);
```

## Organization Operations

```typescript
// Create organization
const org = Models.createOrg({
  login: 'my-org',
  name: 'My Organization',
  ownerId: userId
});

// Get organization
const org = Models.getOrg(orgId);
const org = Models.getOrgByLogin('my-org');

// Manage members
Models.addMember(orgId, userId, 'admin');
Models.removeMember(orgId, userId);
Models.updateMemberRole(orgId, userId, 'owner');

// Teams
const team = Models.createTeam(orgId, 'Developers', 'developers');
Models.addTeamMember(teamId, userId, 'maintainer');
const members = Models.getTeamMembers(teamId);
```

## Webhook Operations

```typescript
// Create webhook
const webhook = Models.createWebhook({
  repositoryId: repoId,
  name: 'CI/CD',
  url: 'https://ci.example.com/hooks',
  events: ['push', 'pull_request'],
  secret: 'webhook-secret'
});

// Manage webhooks
Models.updateWebhook(webhookId, { active: false });
Models.activateWebhook(webhookId);
Models.deactivateWebhook(webhookId);

// Track deliveries
Models.logDelivery(
  webhookId,
  'push',
  payload,
  headers,
  200,
  'OK'
);
const stats = Models.getDeliveryStats(webhookId);
```

## Deploy Key Operations

```typescript
// Add deploy key
const key = Models.createDeployKey({
  repositoryId: repoId,
  title: 'CI Server',
  key: sshPublicKey,
  fingerprint: sha256Hash,
  readOnly: true
});

// Manage keys
Models.verifyDeployKey(keyId);
Models.updateDeployKeyReadOnly(keyId, false);
const keys = Models.listDeployKeys(repoId);
```

## Common Patterns

### Transaction Support
```typescript
import { withTransaction } from './db/connection';

withTransaction(() => {
  const repo = Models.createRepository({...});
  Models.addCollaborator(repo.id, userId, 'admin');
});
```

### Error Handling
```typescript
const user = Models.getUser(userId);
if (!user) {
  throw new Error('User not found');
}

const deleted = Models.deleteRepository(repoId);
if (!deleted) {
  throw new Error('Repository not found');
}
```

### Pagination
```typescript
// Most list operations support pagination
const repos = Models.listRepositories(ownerId);
const keys = Models.listSSHKeys(userId);
const members = Models.getMembers(orgId);
```

## Type Definitions

All input/output types are exported:
```typescript
import type {
  Repository,
  CreateRepositoryInput,
  UpdateRepositoryInput,
  SSHKey,
  Email,
  UserProfile,
  WebhookDelivery,
  DeployKeyWithMeta
} from './db/models';
```
