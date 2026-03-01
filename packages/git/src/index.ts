export {
  initBareRepo,
  isBareRepo,
  deleteRepo,
  forkRepo,
  getRepoSize,
} from "./repo.js";

export {
  listBranches,
  createBranch,
  deleteBranch,
  getBranchDetails,
  listTags,
  createTag,
  deleteTag,
} from "./branches.js";
export type { BranchInfo, TagInfo } from "./branches.js";

export { handleGitHttpRequest, getDiff, getLog, updateServerInfo } from "./http-backend.js";

export { runGc, prune, repack, getPackStats } from "./gc.js";

// Core Git Operations
export {
  getCommit,
  getCommitHistory,
  listCommits,
  getCommitParents,
  parseCommitMessage,
  getCommitCount,
  revertCommit,
} from "./commits.js";
export type { CommitInfo, ConventionalCommit } from "./commits.js";

export {
  catFile,
  getObjectType,
  getObjectSize,
  listTree,
  readBlob,
  objectExists,
  prettyPrint,
} from "./objects.js";
export type { GitObjectType, TreeEntry } from "./objects.js";

export {
  resolveRef,
  updateRef,
  deleteRef,
  listRefs,
  getHead,
  setHead,
  symbolicRef,
  refExists,
} from "./refs.js";
export type { RefInfo } from "./refs.js";

export {
  mergeBase,
  canFastForward,
  merge,
  getMergeConflicts,
  abortMerge,
  isMergeInProgress,
} from "./merge.js";
export type { MergeStrategy, MergeResult, ConflictInfo } from "./merge.js";

export { blameFile, parseBlameOutput, blameFileRange } from "./blame.js";
export type { BlameLine, BlameResult } from "./blame.js";

export {
  stashList,
  stashPush,
  stashPop,
  stashDrop,
  stashApply,
  stashShow,
  stashClear,
  stashCount,
} from "./stash.js";
export type { StashEntry } from "./stash.js";

export {
  cherryPick,
  cherryPickMultiple,
  cherryPickAbort,
  cherryPickContinue,
  isCherryPickInProgress,
  cherryPickSkip,
} from "./cherry-pick.js";
export type { CherryPickResult } from "./cherry-pick.js";

export {
  rebase,
  rebaseInteractive,
  rebaseAbort,
  rebaseContinue,
  rebaseSkip,
  getRebaseStatus,
} from "./rebase.js";
export type { RebaseResult, RebaseStatus } from "./rebase.js";

export {
  addRemote,
  removeRemote,
  listRemotes,
  fetchRemote,
  pushRemote,
  getRemoteUrl,
  setRemoteUrl,
  renameRemote,
} from "./remote.js";
export type { RemoteInfo, TransferResult } from "./remote.js";

export {
  createArchive,
  streamArchive,
  getArchiveContentType,
  saveArchiveStream,
  listArchiveFiles,
} from "./archive.js";
export type { ArchiveFormat, ArchiveOptions } from "./archive.js";

// Diff Engine
export {
  parseDiff,
  summarizeDiff,
  filterDiffByStatus,
} from "./diff/diff-parser.js";
export type { DiffLine, DiffHunk, DiffFile } from "./diff/diff-parser.js";

export {
  shortstat,
  diffStat,
  filesChanged,
  insertions,
  deletions,
  changedFilePaths,
  commitDiffStat,
} from "./diff/diff-stats.js";
export type { DiffStatResult, FileStatEntry } from "./diff/diff-stats.js";

export {
  formatPatch,
  applyPatch,
  checkPatch,
  formatPatchRange,
  applyPatchFile,
} from "./diff/patch.js";
export type { PatchApplyResult, PatchCheckResult } from "./diff/patch.js";

// Hooks
export {
  installHook,
  removeHook,
  listHooks,
  executeHook,
  hookExists,
} from "./hooks/hook-manager.js";
export type { HookType, HookInfo, HookExecResult } from "./hooks/hook-manager.js";

export {
  parsePreReceiveInput,
  validatePush,
} from "./hooks/pre-receive.js";
export type {
  BranchProtectionConfig,
  PreReceiveResult,
  RefUpdate,
} from "./hooks/pre-receive.js";

export {
  parsePostReceiveInput,
  buildPushPayload,
  buildNotificationPayload,
  buildSearchIndexPayload,
  buildCiTriggerPayload,
} from "./hooks/post-receive.js";
export type {
  PostReceiveConfig,
  PushPayload,
  PushCommitInfo,
  PostReceiveUpdate,
} from "./hooks/post-receive.js";

// Security
export {
  scanContent,
  scanDiff,
  addCustomPattern,
  listPatternNames,
} from "./security/secret-scanner.js";
export type { SecretScanResult, SecretMatch } from "./security/secret-scanner.js";

export {
  verifySignature,
  isSignedCommit,
  getSignatureInfo,
  verifyCommitRange,
} from "./security/commit-signing.js";
export type { SignatureStatus, SignatureInfo } from "./security/commit-signing.js";

export {
  canRead,
  canWrite,
  canAdmin,
  resolvePermission,
  createDefaultPolicy,
  addCollaborator,
  removeCollaborator,
} from "./security/access-control.js";
export type {
  PermissionLevel,
  UserPermission,
  AccessPolicy,
  TeamPermission,
  AccessCheckResult,
} from "./security/access-control.js";

// LFS
export {
  parseLfsPointer,
  createLfsPointer,
  isLfsPointer,
  computeLfsOid,
  resolveObjectPath,
  getTrackedPatterns,
  trackPattern,
  untrackPattern,
  ensureStorageDirs,
  listStoredObjects,
} from "./lfs/lfs-manager.js";
export type { LfsPointer, LfsTrackPattern, LfsStorageConfig } from "./lfs/lfs-manager.js";

export {
  processBatchRequest,
  verifyObject,
  storeObject,
} from "./lfs/lfs-transfer.js";
export type {
  LfsObject,
  LfsBatchRequest,
  LfsBatchObjectResponse,
  LfsActions,
  LfsTransferAction,
  LfsObjectError,
} from "./lfs/lfs-transfer.js";

// Mirroring
export {
  setupMirror,
  syncMirror,
  removeMirror,
  getMirrorStatus,
  scheduledSync,
} from "./mirror/mirror-manager.js";
export type { MirrorConfig, MirrorSyncResult, MirrorStatus } from "./mirror/mirror-manager.js";

export {
  searchCode,
} from "./search.js";
export type { CodeSearchResult, SearchCodeOptions } from "./search.js";

// License Detection
export {
  detectLicense,
  identifyLicense,
  getSupportedLicenses,
  isOpenSourceLicense,
} from "./license/license-detector.js";
export type { LicenseId, LicenseDetectionResult } from "./license/license-detector.js";

// Code Analysis
export {
  countByLanguage,
  getLargestFiles,
  getFileHistory,
  totalSize,
  totalFileCount,
} from "./analysis/file-stats.js";
export type { LanguageStats, LargeFileInfo, FileHistoryEntry } from "./analysis/file-stats.js";

export {
  commitCountByAuthor,
  linesAddedRemoved,
  topContributors,
  activityTimeline,
  uniqueContributorCount,
} from "./analysis/contributor-stats.js";
export type { ContributorStat, ActivityEntry } from "./analysis/contributor-stats.js";

export {
  codeFrequency,
  commitFrequencyByMonth,
  commitDistribution,
  averageCommitsPerDay,
  cumulativeLines,
} from "./analysis/code-frequency.js";
export type {
  CodeFrequencyEntry,
  CommitFrequencyBucket,
  DailyDistribution,
} from "./analysis/code-frequency.js";

// PR/Review Support
export {
  generatePrDiff,
  getChangedFiles,
  getAddedLines,
  getRemovedLines,
} from "./pr/pr-diff.js";
export type { PrChangedFile, PrDiffSummary } from "./pr/pr-diff.js";

export {
  mapLineToPosition,
  resolvePosition,
  outdatedCheck,
  calculateLineOffset,
  getCommentablePositions,
} from "./pr/review-comments.js";
export type {
  DiffPosition,
  ReviewComment,
  PositionResolution,
} from "./pr/review-comments.js";

export {
  checkMergeability,
  conflictFiles,
  requiredStatusChecks,
  branchProtectionCheck,
} from "./pr/merge-check.js";
export type {
  MergeCheckResult,
  MergeCheckItem,
  BranchProtectionRules,
} from "./pr/merge-check.js";

// Utilities
export {
  GitError,
  MergeConflictError,
  RefNotFoundError,
  RepositoryNotFoundError,
  AccessDeniedError,
  LfsError,
  CherryPickError,
  RebaseError,
  isGitError,
  fromExecError,
  formatGitError,
} from "./utils/git-errors.js";

export {
  getConfig,
  setConfig,
  unsetConfig,
  listConfig,
  getGlobalConfig,
  setGlobalConfig,
  getConfigRegex,
  getConfigSections,
  getUserIdentity,
} from "./utils/git-config.js";
export type { GitConfigEntry, GitConfigSection } from "./utils/git-config.js";
