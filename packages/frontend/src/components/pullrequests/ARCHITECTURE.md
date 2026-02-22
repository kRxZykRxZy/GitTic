# Pull Request Components - Architecture Guide

## 📐 Component Architecture

This document describes the architecture, design patterns, and best practices for the Pull Request component system.

---

## 🏗️ System Architecture

### Component Hierarchy

```
PullRequestDetail (Main Container)
├── PullRequestConversation
├── PullRequestFiles
├── PullRequestCommits
├── PullRequestChecks
├── PullRequestReviews
└── PullRequestMerge (Sidebar)

PullRequestList (List View)
├── PullRequestCard (Multiple)
└── Pagination

PullRequestForm (Creation)
└── Branch Selection
    └── Label/Assignee Selection
```

### Data Flow

```
API → State Management → Components → User Actions → API
```

---

## 🎯 Design Patterns

### 1. **Composition Pattern**
Components are designed to be composable and can work independently.

```tsx
// Use individual components
<PullRequestCard pr={pr} />

// Or compose them together
<>
  <PullRequestDetail pr={pr} />
  <PullRequestMerge pr={pr} />
</>
```

### 2. **Props-Based Configuration**
All component behavior is controlled through props, not internal state.

```tsx
interface PullRequestListProps {
  pullRequests: PullRequest[];        // Data
  isLoading?: boolean;                // State
  onSelectPR?: (pr: PullRequest) => void; // Callbacks
  filterStatus?: PRStatus;            // Configuration
}
```

### 3. **Controlled Components**
Parent components manage state, child components are controlled.

```tsx
// Parent manages state
const [selectedPRId, setSelectedPRId] = useState<string | null>(null);

// Child is controlled
<PullRequestList
  selectedPRId={selectedPRId}
  onSelectPR={(pr) => setSelectedPRId(pr.id)}
/>
```

### 4. **Loading/Error Pattern**
Consistent loading and error state handling across all components.

```tsx
if (isLoading) return <LoadingState />;
if (error) return <ErrorState error={error} />;
return <ComponentContent />;
```

### 5. **Callback-Based Actions**
User actions trigger callbacks that parent components handle.

```tsx
// Component
<button onClick={() => onApprove?.()}>Approve</button>

// Parent
<PullRequestReviews
  onApprove={async () => {
    await api.approvePR(prId);
    refreshReviews();
  }}
/>
```

---

## 📦 Component Responsibilities

### PullRequestList
- **Responsibility**: Display multiple PRs
- **State**: Filter, sort, pagination
- **Props**: PRs array, callbacks
- **Composition**: Uses PullRequestCard

### PullRequestCard
- **Responsibility**: Display single PR summary
- **State**: Selection highlight
- **Props**: PR data, click handler
- **Composition**: Standalone

### PullRequestDetail
- **Responsibility**: Main PR view with tabs
- **State**: Active tab
- **Props**: PR data, callbacks
- **Composition**: Uses 4 sub-components

### PullRequestForm
- **Responsibility**: Create new PR
- **State**: Form inputs, validation
- **Props**: Initial values, submit callback
- **Composition**: Form inputs, selectors

### PullRequestReviews
- **Responsibility**: Display and handle reviews
- **State**: Review form visibility
- **Props**: Reviews array, review callbacks
- **Composition**: Standalone

### PullRequestConversation
- **Responsibility**: Display comments thread
- **State**: Edit mode, comment form
- **Props**: Comments array, comment callbacks
- **Composition**: Standalone

### PullRequestFiles
- **Responsibility**: Display file changes
- **State**: Expanded files, inline comment form
- **Props**: Files array, inline comment callbacks
- **Composition**: Standalone

### PullRequestCommits
- **Responsibility**: Display commit history
- **State**: Expanded commit details, search
- **Props**: Commits array, select callback
- **Composition**: Standalone

### PullRequestChecks
- **Responsibility**: Display CI/CD checks
- **State**: Expanded check details
- **Props**: Checks array, retry callback
- **Composition**: Standalone

### PullRequestMerge
- **Responsibility**: Handle PR merge
- **State**: Merge strategy, message
- **Props**: PR data, merge callbacks
- **Composition**: Standalone

---

## 🔄 Data Flow Patterns

### Read Pattern
```
User Views PR
  ↓
Component Receives Props
  ↓
Component Renders Data
  ↓
User Sees Information
```

### Write Pattern
```
User Performs Action
  ↓
Component Calls Callback
  ↓
Parent Handles Action
  ↓
Parent Fetches Updated Data
  ↓
Parent Updates Props
  ↓
Component Re-renders
```

### Example: Approving a PR
```tsx
// Component
<button onClick={() => onApprove?.()}>Approve</button>

// Parent Handler
const handleApprove = async () => {
  setLoading(true);
  try {
    await api.approvePR(prId);
    const updated = await api.getPR(prId);
    setPR(updated);
  } finally {
    setLoading(false);
  }
};

// Usage
<PullRequestReviews
  onApprove={handleApprove}
/>
```

---

## 🎨 Styling Architecture

### CSS Class Naming
- Follows BEM (Block Element Modifier) pattern
- Prefixed with `pr-` for PR components
- State classes: `loading-state`, `error-state`, `empty-state`
- Status classes: `status-open`, `status-merged`, etc.

### Example
```css
/* Block */
.pr-list { }

/* Element */
.pr-list__header { }
.pr-list__item { }

/* Modifier */
.pr-list__item--selected { }
.pr-list__item--loading { }
```

### CSS Class Hierarchy
```
.pr-list (Container)
├── .pr-list__header
├── .pr-list__container
│   └── .pr-list__item (PullRequestCard)
│       ├── .pr-card__header
│       ├── .pr-card__meta
│       └── .pr-card__details
└── .pr-pagination
```

---

## 🔐 Type Safety

### Type Hierarchy
```
PullRequest (Main Entity)
├── PRUser (Author, assignees, etc.)
├── PRBranch (Head and base branches)
├── PRReview (Review data)
├── PRComment (Comment data)
├── PRFileChange (File changes)
├── PRCommit (Commit data)
├── PRCheckRun (Check run data)
└── PRStatusCheck (Status check data)
```

### Type Exports
```typescript
// Main types
export type PullRequest
export type PRStatus
export type ReviewDecision
export type MergeStrategy

// Component props types
export interface PullRequestListProps
export interface PullRequestCardProps
// ... etc for each component
```

---

## ♿ Accessibility Features

### Semantic HTML
- Use proper heading levels
- Use semantic buttons (not divs)
- Use proper form controls
- Use proper landmark elements

### Keyboard Navigation
- Tab through interactive elements
- Enter to activate buttons
- Arrow keys for selection
- Escape to close modals

### ARIA Attributes
- `role="button"` for custom buttons
- `aria-label` for icon buttons
- `aria-loading` for loading states
- `aria-disabled` for disabled states

### Color & Contrast
- Status indicators use multiple signals (color + icon + text)
- Sufficient color contrast ratios
- Icon + text combinations

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Simplified list view
- Collapsible sections
- Touch-friendly buttons
- Stacked layout

---

## 🧪 Testing Strategy

### Unit Tests
- Test component rendering with different props
- Test callback triggers
- Test prop validation

### Integration Tests
- Test component composition
- Test data flow between components
- Test state management

### E2E Tests
- Test complete PR workflows
- Test user interactions
- Test navigation

---

## 🚀 Performance Optimization

### Rendering Optimization
1. **Memoization**
   ```tsx
   const MemoizedCard = React.memo(PullRequestCard);
   ```

2. **Lazy Loading**
   ```tsx
   const expandedCommitSha = useState(null);
   // Only load details when expanded
   ```

3. **Virtualization**
   For very long lists, use windowing libraries

### Data Optimization
1. **Pagination**: Always paginate large lists
2. **Filtering**: Filter on client or server
3. **Caching**: Cache PR data when appropriate

---

## 🔄 State Management Integration

### Redux Example
```tsx
// Selectors
const selectPullRequest = (state: RootState, id: string) =>
  state.pullRequests.items[id];

const selectIsLoading = (state: RootState) =>
  state.pullRequests.loading;

// Component
const pr = useSelector((state) => selectPullRequest(state, prId));
const loading = useSelector(selectIsLoading);

<PullRequestDetail pullRequest={pr} isLoading={loading} />
```

### Zustand Example
```tsx
// Store
interface PRStore {
  pullRequest: PullRequest | null;
  loading: boolean;
  fetchPR: (id: string) => Promise<void>;
}

const usePRStore = create<PRStore>(/* ... */);

// Component
const { pullRequest, loading, fetchPR } = usePRStore();

<PullRequestDetail pullRequest={pullRequest} isLoading={loading} />
```

---

## 🔌 API Integration Pattern

### Service Layer
```typescript
// services/prService.ts
export const prService = {
  async getPullRequest(id: string): Promise<PullRequest> {
    return fetch(`/api/prs/${id}`).then(r => r.json());
  },

  async approvePR(id: string): Promise<void> {
    return fetch(`/api/prs/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'approved' })
    }).then(r => r.json());
  },

  // ... more methods
};
```

### Hook Wrapper
```typescript
// hooks/usePullRequest.ts
export function usePullRequest(id: string) {
  const [pr, setPR] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    prService.getPullRequest(id)
      .then(setPR)
      .finally(() => setLoading(false));
  }, [id]);

  return { pr, loading };
}
```

### Component Usage
```tsx
function PRDetailPage({ prId }: { prId: string }) {
  const { pr, loading } = usePullRequest(prId);
  return <PullRequestDetail pullRequest={pr} isLoading={loading} />;
}
```

---

## 🐛 Error Handling Strategy

### Component-Level Error Handling
```tsx
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  try {
    setError(null);
    await performAction();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  }
};
```

### Global Error Handling
```tsx
// Error boundary
<ErrorBoundary>
  <PullRequestDetail />
</ErrorBoundary>
```

---

## 📊 Monitoring & Analytics

### Events to Track
- PR view
- PR create
- PR merge
- Review submitted
- Comment added
- Filter applied

### Error Tracking
- Failed API calls
- Component errors
- Form validation errors

---

## 🔄 Update & Refresh Patterns

### Optimistic Updates
```tsx
// Update UI immediately
setState(newValue);

// Then sync with server
try {
  await api.update(newValue);
} catch (error) {
  // Revert on error
  setState(oldValue);
}
```

### Real-time Updates
```tsx
// Use WebSocket or polling
useEffect(() => {
  const unsubscribe = prService.subscribe(prId, (updated) => {
    setPR(updated);
  });
  return unsubscribe;
}, [prId]);
```

---

## 📚 Documentation Standards

### JSDoc Format
```typescript
/**
 * Component description
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 *
 * @example
 * ```tsx
 * <Component prop={value} />
 * ```
 */
```

### Props Documentation
```typescript
/**
 * Props for ComponentName component
 */
interface ComponentProps {
  /** Description of prop */
  prop: Type;
}
```

---

## 🎓 Best Practices Summary

1. ✅ Keep components small and focused
2. ✅ Use composition over inheritance
3. ✅ Manage state at appropriate level
4. ✅ Handle loading and error states
5. ✅ Write comprehensive TypeScript types
6. ✅ Document with JSDoc comments
7. ✅ Use semantic HTML
8. ✅ Optimize rendering performance
9. ✅ Test components thoroughly
10. ✅ Follow consistent code style

---

## 🚀 Future Enhancements

- [ ] Add virtualization for very large lists
- [ ] Add real-time updates via WebSocket
- [ ] Add advanced filtering options
- [ ] Add export functionality (PDF, CSV)
- [ ] Add offline support with IndexedDB
- [ ] Add dark mode support
- [ ] Add multiple language support (i18n)
- [ ] Add animation transitions

---

**Last Updated**: 2024
**Maintainer**: Development Team
**Version**: 1.0.0
