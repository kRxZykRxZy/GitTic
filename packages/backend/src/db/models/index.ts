/**
 * Database models - Export all model functions
 * @module db/models
 */

// Repository model
export {
  createRepository,
  getRepository,
  getRepositoryBySlug,
  updateRepository,
  deleteRepository,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
  getCollaboratorPermission,
  updateCollaboratorPermission,
  listRepositories,
  listOrgRepositories,
  countRepositories,
} from './repository-model.js';

export type {
  Repository,
  CreateRepositoryInput,
  UpdateRepositoryInput,
} from './repository-model.js';

// User model
export {
  createUser,
  getUser,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  addSSHKey,
  getSSHKey,
  listSSHKeys,
  deleteSSHKey,
  updateSSHKeyLastUsed,
  addEmail,
  getEmail,
  listEmails,
  deleteEmail,
  verifyEmail,
  setPrimaryEmail,
} from './user-model.js';

export type {
  SSHKey,
  Email,
  UserProfile,
  CreateUserInput,
  UpdateUserInput,
} from './user-model.js';

// Organization model
export {
  createOrg,
  getOrg,
  getOrgByLogin,
  updateOrg,
  deleteOrg,
  addMember,
  removeMember,
  getMembers,
  getMemberRole,
  updateMemberRole,
  listUserOrgs,
  createTeam,
  getTeam,
  listTeams,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
} from './organization-model.js';

export type {
  CreateOrgInput,
  UpdateOrgInput,
} from './organization-model.js';

// Webhook model
export {
  createWebhook,
  getWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  activateWebhook,
  deactivateWebhook,
  logDelivery,
  getDelivery,
  listDeliveries,
  cleanupDeliveries,
  getDeliveryStats,
} from './webhook-model.js';

export type {
  WebhookDelivery,
  CreateWebhookInput,
  UpdateWebhookInput,
} from './webhook-model.js';

// Deploy key model
export {
  createDeployKey,
  getDeployKey,
  getDeployKeyByFingerprint,
  listDeployKeys,
  deleteDeployKey,
  verifyDeployKey,
  updateDeployKeyLastUsed,
  hasWriteAccess,
  updateDeployKeyReadOnly,
  findDeployKeyByTitle,
  countDeployKeys,
  listVerifiedDeployKeys,
  deleteAllDeployKeys,
} from './deploy-key-model.js';

export type {
  DeployKeyWithMeta,
  CreateDeployKeyInput,
} from './deploy-key-model.js';
