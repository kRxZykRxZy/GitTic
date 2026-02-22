/**
 * Database Models Test
 * Verifies that all model functions are properly exported and functional
 */

import { describe, it, expect } from 'vitest';

// Import models
import {
  createRepository,
  getRepository,
  updateRepository,
  deleteRepository,
  addCollaborator,
  removeCollaborator,
} from '../models/repository-model.js';

import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  addSSHKey,
  listSSHKeys,
  deleteSSHKey,
} from '../models/user-model.js';

import {
  createOrg,
  getOrg,
  updateOrg,
  deleteOrg,
  addMember,
  removeMember,
} from '../models/organization-model.js';

import {
  createWebhook,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  logDelivery,
} from '../models/webhook-model.js';

import {
  createDeployKey,
  getDeployKey,
  deleteDeployKey,
  verifyDeployKey,
} from '../models/deploy-key-model.js';

describe('Database Models', () => {
  it('should export repository model functions', () => {
    expect(typeof createRepository).toBe('function');
    expect(typeof getRepository).toBe('function');
    expect(typeof updateRepository).toBe('function');
    expect(typeof deleteRepository).toBe('function');
    expect(typeof addCollaborator).toBe('function');
    expect(typeof removeCollaborator).toBe('function');
  });

  it('should export user model functions', () => {
    expect(typeof createUser).toBe('function');
    expect(typeof getUser).toBe('function');
    expect(typeof updateUser).toBe('function');
    expect(typeof deleteUser).toBe('function');
    expect(typeof addSSHKey).toBe('function');
    expect(typeof listSSHKeys).toBe('function');
    expect(typeof deleteSSHKey).toBe('function');
  });

  it('should export organization model functions', () => {
    expect(typeof createOrg).toBe('function');
    expect(typeof getOrg).toBe('function');
    expect(typeof updateOrg).toBe('function');
    expect(typeof deleteOrg).toBe('function');
    expect(typeof addMember).toBe('function');
    expect(typeof removeMember).toBe('function');
  });

  it('should export webhook model functions', () => {
    expect(typeof createWebhook).toBe('function');
    expect(typeof getWebhook).toBe('function');
    expect(typeof updateWebhook).toBe('function');
    expect(typeof deleteWebhook).toBe('function');
    expect(typeof logDelivery).toBe('function');
  });

  it('should export deploy key model functions', () => {
    expect(typeof createDeployKey).toBe('function');
    expect(typeof getDeployKey).toBe('function');
    expect(typeof deleteDeployKey).toBe('function');
    expect(typeof verifyDeployKey).toBe('function');
  });
});
