# Pull Request Components

A production-ready set of React TypeScript components for managing pull requests, similar to GitHub's PR interface.

## 📦 Components Overview

### 1. **PullRequestList** (`PullRequestList.tsx`)
Display a list of pull requests with filtering, sorting, and pagination capabilities.

**Features:**
- Filter by PR status (open, closed, merged, draft)
- Sort by updated, created, or popularity
- Pagination support
- Selection and click handling
- Loading and error states

**Props:**
```typescript
interface PullRequestListProps {
  pullRequests: PullRequest[];
  isLoading?: boolean;
  error?: string | null;
  onSelectPR?: (pr: PullRequest) => void;
  selectedPRId?: string;
  filterStatus?: PRStatus;
  sortBy?: 'updated' | 'created' | 'popularity';
  pagination?: { page: number; perPage: number; total: number };
  onPageChange?: (page: number) => void;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestList
  pullRequests={prs}
  filterStatus="open"
  sortBy="updated"
  onSelectPR={handleSelect}
  pagination={{ page: 1, perPage: 20, total: 100 }}
  onPageChange={handlePageChange}
/>
```

---

### 2. **PullRequestCard** (`PullRequestCard.tsx`)
Individual PR card with compact metadata display.

**Features:**
- Status badge with color coding
- Author avatar and information
- Branch details
- Commit and file statistics
- Review decision badge
- Check status indicators

**Props:**
```typescript
interface PullRequestCardProps {
  pullRequest: PullRequest;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}
```

**Example:**
```tsx
<PullRequestCard
  pullRequest={pr}
  isSelected={true}
  onClick={handleSelect}
  showDetails={true}
/>
```

---

### 3. **PullRequestDetail** (`PullRequestDetail.tsx`)
Full PR view with tabbed interface (conversation, files, commits, checks).

**Features:**
- Tabbed navigation
- Full PR metadata display
- Status indicators
- Integration with review, file, commit, and check components
- Description display
- PR statistics

**Props:**
```typescript
interface PullRequestDetailProps {
  pullRequest: PullRequest;
  isLoading?: boolean;
  error?: string | null;
  onUpdatePR?: (pr: PullRequest) => Promise<void>;
  onAddComment?: (comment: string) => Promise<void>;
  onApprove?: () => Promise<void>;
  onRequestChanges?: (comment: string) => Promise<void>;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestDetail
  pullRequest={pr}
  onAddComment={handleAddComment}
  onApprove={handleApprove}
  onRequestChanges={handleRequestChanges}
/>
```

---

### 4. **PullRequestForm** (`PullRequestForm.tsx`)
Form for creating new pull requests.

**Features:**
- Title and description inputs
- Base/head branch selection
- Draft mode toggle
- Label selection
- Assignee and reviewer selection
- Form validation
- Loading and error states

**Props:**
```typescript
interface PullRequestFormProps {
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
```

**Example:**
```tsx
<PullRequestForm
  branches={branches}
  defaultBaseBranch="main"
  onSubmit={handleCreatePR}
  onCancel={handleCancel}
/>
```

---

### 5. **PullRequestReviews** (`PullRequestReviews.tsx`)
Code review interface with approve/request changes functionality.

**Features:**
- Display review decisions
- Approve, request changes, or comment
- Review summary with counts
- Author information per review
- Loading states

**Props:**
```typescript
interface PullRequestReviewsProps {
  reviews: PRReview[];
  currentUserCanReview?: boolean;
  reviewDecision?: ReviewDecision;
  isLoading?: boolean;
  onApprove?: () => Promise<void>;
  onRequestChanges?: (comment: string) => Promise<void>;
  onComment?: (comment: string) => Promise<void>;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestReviews
  reviews={reviews}
  currentUserCanReview={true}
  onApprove={handleApprove}
  onRequestChanges={handleRequestChanges}
/>
```

---

### 6. **PullRequestConversation** (`PullRequestConversation.tsx`)
PR conversation thread with comment threading and editing.

**Features:**
- Display comments chronologically
- Edit and delete own comments
- Reply functionality with nesting
- Comment reactions
- Add new comment form
- Author avatars and timestamps

**Props:**
```typescript
interface PullRequestConversationProps {
  comments: PRComment[];
  currentUserId?: string;
  isLoading?: boolean;
  onAddComment?: (comment: string) => Promise<void>;
  onEditComment?: (commentId: string, body: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestConversation
  comments={comments}
  currentUserId={userId}
  onAddComment={handleAddComment}
  onEditComment={handleEditComment}
  onDeleteComment={handleDeleteComment}
/>
```

---

### 7. **PullRequestFiles** (`PullRequestFiles.tsx`)
Files changed view with inline commenting.

**Features:**
- File list with change statistics
- File expansion and diff viewing
- Inline commenting on files
- File type icons
- Search/filter files
- Additions/deletions display

**Props:**
```typescript
interface PullRequestFilesProps {
  files: PRFileChange[];
  inlineComments?: PRInlineComment[];
  selectedFile?: string;
  onSelectFile?: (path: string) => void;
  onAddInlineComment?: (data: AddInlineCommentData) => Promise<void>;
  onDeleteInlineComment?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestFiles
  files={fileChanges}
  inlineComments={comments}
  onSelectFile={handleSelectFile}
  onAddInlineComment={handleAddComment}
/>
```

---

### 8. **PullRequestCommits** (`PullRequestCommits.tsx`)
Commit history display with expandable details.

**Features:**
- Chronological commit listing
- Author information
- Commit message display
- SHA and timestamps
- Expandable commit details
- Statistics per commit
- Copy SHA functionality
- Search/filter commits

**Props:**
```typescript
interface PullRequestCommitsProps {
  commits: PRCommit[];
  isLoading?: boolean;
  selectedCommitSha?: string;
  onSelectCommit?: (sha: string) => void;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestCommits
  commits={commits}
  selectedCommitSha={selectedSha}
  onSelectCommit={handleSelectCommit}
/>
```

---

### 9. **PullRequestChecks** (`PullRequestChecks.tsx`)
CI/CD checks status display with annotations.

**Features:**
- Check runs display with status indicators
- Status checks display
- Expand/collapse check details
- View check output and annotations
- Retry failed checks
- Summary with success/failure counts
- Duration and timestamp information

**Props:**
```typescript
interface PullRequestChecksProps {
  checkRuns: PRCheckRun[];
  statusChecks?: PRStatusCheck[];
  isLoading?: boolean;
  onRetryCheck?: (checkId: string) => Promise<void>;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestChecks
  checkRuns={checks}
  statusChecks={statusChecks}
  onRetryCheck={handleRetry}
/>
```

---

### 10. **PullRequestMerge** (`PullRequestMerge.tsx`)
Merge panel with merge strategies and conflict detection.

**Features:**
- Merge status indicators
- Multiple merge strategies (merge commit, squash, rebase)
- Conflict detection and display
- Custom commit message input
- Delete branch after merge option
- Close PR without merging
- Merge history/timeline
- Advanced options

**Props:**
```typescript
interface PullRequestMergeProps {
  pullRequest: PullRequest;
  isLoading?: boolean;
  error?: string | null;
  onMerge?: (strategy: MergeStrategy, commitMessage?: string) => Promise<void>;
  onSquashMerge?: (commitMessage?: string) => Promise<void>;
  onRebaseMerge?: (commitMessage?: string) => Promise<void>;
  onClosePR?: () => Promise<void>;
  className?: string;
}
```

**Example:**
```tsx
<PullRequestMerge
  pullRequest={pr}
  onMerge={handleMerge}
  onSquashMerge={handleSquashMerge}
  onClosePR={handleClose}
/>
```

---

## 🚀 Usage Examples

### Complete PR Detail Page
```tsx
import {
  PullRequestDetail,
  PullRequestMerge,
  PullRequestReviews,
} from '@/components/pullrequests';

export function PRDetailPage({ prId }: { prId: string }) {
  const [pr, setPr] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch PR data
    fetchPR(prId).then(setPr);
  }, [prId]);

  return (
    <div className="pr-page">
      <PullRequestDetail
        pullRequest={pr}
        isLoading={loading}
        onAddComment={handleAddComment}
        onApprove={handleApprove}
      />
      <PullRequestMerge
        pullRequest={pr}
        onMerge={handleMerge}
        onClosePR={handleClose}
      />
    </div>
  );
}
```

### PR List with Filtering
```tsx
import { PullRequestList } from '@/components/pullrequests';

export function PRListPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [filter, setFilter] = useState<PRStatus>('open');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPRs(filter, page).then(setPrs);
  }, [filter, page]);

  return (
    <div className="pr-list-page">
      <div className="filter-controls">
        <select value={filter} onChange={(e) => setFilter(e.target.value as PRStatus)}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="merged">Merged</option>
        </select>
      </div>
      <PullRequestList
        pullRequests={prs}
        filterStatus={filter}
        pagination={{ page, perPage: 20, total: 100 }}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Create PR Form
```tsx
import { PullRequestForm } from '@/components/pullrequests';

export function CreatePRPage() {
  const [branches, setBranches] = useState<PRBranch[]>([]);

  useEffect(() => {
    fetchBranches().then(setBranches);
  }, []);

  const handleCreatePR = async (data: CreatePullRequestData) => {
    const response = await createPR(data);
    navigateToDetail(response.number);
  };

  return (
    <div className="create-pr-page">
      <PullRequestForm
        branches={branches}
        onSubmit={handleCreatePR}
        onCancel={() => history.back()}
      />
    </div>
  );
}
```

---

## 📋 Type Definitions

### Key Types

```typescript
// Main PR entity
interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  status: PRStatus; // 'open' | 'closed' | 'merged' | 'draft'
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
  // ... more fields
}

// Review decision
type ReviewDecision = 'approved' | 'changes_requested' | 'commented' | 'pending';

// Merge strategy
type MergeStrategy = 'create_a_merge_commit' | 'squash_and_merge' | 'rebase_and_merge';

// Check status
type CheckStatus = 'queued' | 'in_progress' | 'completed';
type CheckConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'stale';
```

---

## 🎨 Styling

Components use semantic CSS classes that can be styled according to your design system:

- `.pr-list` - Main list container
- `.pr-card` - Individual PR card
- `.pr-detail` - Detail page container
- `.pr-form` - Form container
- `.pr-reviews` - Reviews section
- `.pr-conversation` - Conversation thread
- `.pr-files` - Files changed section
- `.pr-commits` - Commits section
- `.pr-checks` - Checks section
- `.pr-merge` - Merge panel

Example styling can be added to your global stylesheet or CSS modules.

---

## ✨ Features Summary

✅ **Production-Ready**: Fully typed TypeScript, proper error handling
✅ **Accessible**: Semantic HTML, keyboard navigation support
✅ **Modular**: Each component is independent and composable
✅ **Flexible**: Extensive props for customization
✅ **GitHub-Like UI**: Familiar patterns from GitHub's PR interface
✅ **Loading States**: Built-in loading and error handling
✅ **Responsive**: Works on various screen sizes
✅ **Documented**: Detailed JSDoc comments and examples

---

## 🔧 Component Dependencies

- **React** 16.8+ (for hooks)
- **TypeScript** 4.0+
- No external UI library dependencies (uses semantic HTML and CSS classes)

---

## 📝 Export All Components

```typescript
export {
  PullRequestList,
  PullRequestCard,
  PullRequestDetail,
  PullRequestForm,
  PullRequestReviews,
  PullRequestConversation,
  PullRequestFiles,
  PullRequestCommits,
  PullRequestChecks,
  PullRequestMerge,
  // Types
  type PullRequest,
  type PRStatus,
  type ReviewDecision,
  type MergeStrategy,
  // ... and more types
} from '@/components/pullrequests';
```

---

## 📚 Best Practices

1. **Handle Loading States**: Always provide `isLoading` prop during async operations
2. **Error Handling**: Display errors using the `error` prop
3. **Pagination**: Use pagination for large PR lists
4. **Composition**: Combine components to build complex interfaces
5. **Styling**: Use the provided CSS classes and customize as needed
6. **Async Operations**: Ensure callbacks are properly async and handle errors

---

## 🐛 Troubleshooting

- **Components not rendering**: Check that required props are provided
- **Styling issues**: Ensure your CSS framework/classes are available
- **Type errors**: Check that imported types match your data structure
- **Event handlers not firing**: Verify async operations are properly implemented

---

## 📄 License

These components are part of the Some-new-platform project and follow the project's license.
