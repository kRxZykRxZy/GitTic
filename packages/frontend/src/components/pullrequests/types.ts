/**
 * Pull Request Component Type Definitions
 * Contains all TypeScript interfaces and types used across PR components
 */

/**
 * Pull Request status enumeration
 */
export type PRStatus = 'open' | 'closed' | 'merged' | 'draft';

/**
 * Review decision enumeration
 */
export type ReviewDecision = 'approved' | 'changes_requested' | 'commented' | 'pending';

/**
 * Merge strategy enumeration
 */
export type MergeStrategy = 'create_a_merge_commit' | 'squash_and_merge' | 'rebase_and_merge';

/**
 * Merge status enumeration
 */
export type MergeStatus = 'can_merge' | 'dirty' | 'unknown' | 'blocked';

/**
 * Check run status enumeration
 */
export type CheckStatus = 'queued' | 'in_progress' | 'completed';

/**
 * Check run conclusion enumeration
 */
export type CheckConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'stale';

/**
 * User entity for PR context
 */
export interface PRUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  displayName?: string;
}

/**
 * Branch information
 */
export interface PRBranch {
  name: string;
  sha: string;
  ownerUsername?: string;
  repositoryName?: string;
}

/**
 * Review entity
 */
export interface PRReview {
  id: string;
  author: PRUser;
  decision: ReviewDecision;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Commit in PR
 */
export interface PRCommit {
  sha: string;
  message: string;
  author: PRUser;
  committedDate: string;
  parentShas: string[];
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

/**
 * File change in PR
 */
export interface PRFileChange {
  path: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  changes: number;
  blobUrl?: string;
  rawUrl?: string;
  patch?: string;
  previousPath?: string;
}

/**
 * Code review comment
 */
export interface PRComment {
  id: string;
  author: PRUser;
  body: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  reactions?: {
    thumbsUp: number;
    thumbsDown: number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
  };
  replies?: PRComment[];
}

/**
 * Inline code comment on specific line
 */
export interface PRInlineComment extends PRComment {
  path: string;
  line: number;
  originalLine?: number;
  diffHunk?: string;
  side?: 'LEFT' | 'RIGHT';
}

/**
 * CI/CD Check run
 */
export interface PRCheckRun {
  id: string;
  name: string;
  status: CheckStatus;
  conclusion?: CheckConclusion;
  detailsUrl?: string;
  startedAt?: string;
  completedAt?: string;
  output?: {
    title?: string;
    summary?: string;
    text?: string;
    annotations?: Array<{
      path: string;
      startLine: number;
      endLine: number;
      startColumn?: number;
      endColumn?: number;
      annotationLevel: 'notice' | 'warning' | 'failure';
      message: string;
      title?: string;
    }>;
  };
}

/**
 * Status check (GitHub checks, etc.)
 */
export interface PRStatusCheck {
  id: string;
  context: string;
  state: 'pending' | 'success' | 'error' | 'failure';
  description?: string;
  targetUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pull Request main entity
 */
export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  status: PRStatus;
  author: PRUser;
  head: PRBranch;
  base: PRBranch;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  closedAt?: string;
  mergedBy?: PRUser;
  reviewDecision?: ReviewDecision;
  isDraft: boolean;
  labels?: string[];
  assignees?: PRUser[];
  reviewers?: PRUser[];
  checks?: PRCheckRun[];
  statusChecks?: PRStatusCheck[];
  reviews?: PRReview[];
  comments?: PRComment[];
  fileChanges?: PRFileChange[];
  inlineComments?: PRInlineComment[];
  commits_list?: PRCommit[];
  mergeStatus?: MergeStatus;
  mergeable?: boolean;
  mergeConflict?: boolean;
  allowSquashMerge?: boolean;
  allowRebaseMerge?: boolean;
  allowAutoMerge?: boolean;
}

/**
 * Props for PullRequestList component
 */
export interface PullRequestListProps {
  pullRequests: PullRequest[];
  isLoading?: boolean;
  error?: string | null;
  onSelectPR?: (pr: PullRequest) => void;
  selectedPRId?: string;
  filterStatus?: PRStatus;
  sortBy?: 'updated' | 'created' | 'popularity';
  pagination?: {
    page: number;
    perPage: number;
    total: number;
  };
  onPageChange?: (page: number) => void;
  className?: string;
}

/**
 * Props for PullRequestCard component
 */
export interface PullRequestCardProps {
  pullRequest: PullRequest;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}

/**
 * Props for PullRequestDetail component
 */
export interface PullRequestDetailProps {
  pullRequest: PullRequest;
  isLoading?: boolean;
  error?: string | null;
  onUpdatePR?: (pr: PullRequest) => Promise<void>;
  onAddComment?: (comment: string) => Promise<void>;
  onApprove?: () => Promise<void>;
  onRequestChanges?: (comment: string) => Promise<void>;
  className?: string;
}

/**
 * Props for PullRequestForm component
 */
export interface PullRequestFormProps {
  defaultTitle?: string;
  defaultDescription?: string;
  baseBranch?: string;
  headBranch?: string;
  branches?: PRBranch[];
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (data: CreatePullRequestData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

/**
 * Data for creating a PR
 */
export interface CreatePullRequestData {
  title: string;
  description: string;
  baseBranch: string;
  headBranch: string;
  isDraft?: boolean;
  labels?: string[];
  assignees?: string[];
  reviewers?: string[];
}

/**
 * Props for PullRequestReviews component
 */
export interface PullRequestReviewsProps {
  reviews: PRReview[];
  currentUserCanReview?: boolean;
  reviewDecision?: ReviewDecision;
  isLoading?: boolean;
  onApprove?: () => Promise<void>;
  onRequestChanges?: (comment: string) => Promise<void>;
  onComment?: (comment: string) => Promise<void>;
  className?: string;
}

/**
 * Props for PullRequestConversation component
 */
export interface PullRequestConversationProps {
  comments: PRComment[];
  currentUserId?: string;
  isLoading?: boolean;
  onAddComment?: (comment: string) => Promise<void>;
  onEditComment?: (commentId: string, body: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  className?: string;
}

/**
 * Props for PullRequestFiles component
 */
export interface PullRequestFilesProps {
  files: PRFileChange[];
  inlineComments?: PRInlineComment[];
  selectedFile?: string;
  onSelectFile?: (path: string) => void;
  onAddInlineComment?: (data: AddInlineCommentData) => Promise<void>;
  onDeleteInlineComment?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * Data for adding inline comment
 */
export interface AddInlineCommentData {
  filePath: string;
  line: number;
  body: string;
  side?: 'LEFT' | 'RIGHT';
}

/**
 * Props for PullRequestCommits component
 */
export interface PullRequestCommitsProps {
  commits: PRCommit[];
  isLoading?: boolean;
  selectedCommitSha?: string;
  onSelectCommit?: (sha: string) => void;
  className?: string;
}

/**
 * Props for PullRequestChecks component
 */
export interface PullRequestChecksProps {
  checkRuns: PRCheckRun[];
  statusChecks?: PRStatusCheck[];
  isLoading?: boolean;
  onRetryCheck?: (checkId: string) => Promise<void>;
  className?: string;
}

/**
 * Props for PullRequestMerge component
 */
export interface PullRequestMergeProps {
  pullRequest: PullRequest;
  isLoading?: boolean;
  error?: string | null;
  onMerge?: (strategy: MergeStrategy, commitMessage?: string) => Promise<void>;
  onSquashMerge?: (commitMessage?: string) => Promise<void>;
  onRebaseMerge?: (commitMessage?: string) => Promise<void>;
  onClosePR?: () => Promise<void>;
  className?: string;
}

/**
 * Tab identifier for PR detail view
 */
export type PRDetailTab = 'conversation' | 'files' | 'commits' | 'checks';
