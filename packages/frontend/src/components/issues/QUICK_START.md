# Quick Start Guide - Issues Components

## Installation

The components are already created and ready to use in:
```
packages/frontend/src/components/issues/
```

## Basic Usage

### 1. Display a List of Issues

```tsx
import { IssueList } from '@/components/issues';

export function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);

  return (
    <IssueList 
      issues={issues}
      onIssueClick={(issue) => console.log(issue.id)}
      onCreateIssue={() => console.log('create new')}
    />
  );
}
```

### 2. Show Issue Details

```tsx
import { IssueDetail } from '@/components/issues';

export function IssueDetailPage({ issueId }: { issueId: string }) {
  const [issue, setIssue] = useState<Issue | null>(null);

  useEffect(() => {
    // Fetch issue from API
    api.getIssue(issueId).then(setIssue);
  }, [issueId]);

  return <IssueDetail issue={issue} />;
}
```

### 3. Create/Edit an Issue

```tsx
import { IssueForm } from '@/components/issues';

export function CreateIssuePage() {
  const handleSubmit = async (data: IssueFormData) => {
    const result = await api.createIssue(data);
    // Handle result
  };

  return (
    <IssueForm 
      onSubmit={handleSubmit}
      availableUsers={users}
      availableLabels={labels}
      availableMilestones={milestones}
    />
  );
}
```

### 4. Add Comments

```tsx
import { IssueComments } from '@/components/issues';

export function IssueCommentsSection({ issueId }: { issueId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);

  const handleCommentSubmit = async (content: string) => {
    const newComment = await api.createComment(issueId, content);
    setComments([...comments, newComment]);
  };

  return (
    <IssueComments
      issueId={issueId}
      comments={comments}
      currentUser={currentUser}
      onCommentSubmit={handleCommentSubmit}
    />
  );
}
```

### 5. Filter Issues

```tsx
import { IssueList, IssueFilters, type FilterConfig } from '@/components/issues';

export function IssuesWithFilters() {
  const [filters, setFilters] = useState<FilterConfig>({
    status: [],
    labels: [],
    assignees: [],
    priority: [],
  });

  const filteredIssues = applyFilters(issues, filters);

  return (
    <div className="flex gap-4">
      <IssueFilters
        activeFilters={filters}
        onFiltersChange={setFilters}
        availableLabels={labels}
        availableUsers={users}
      />
      <IssueList issues={filteredIssues} />
    </div>
  );
}
```

### 6. Complete Integration Example

```tsx
import {
  IssueList,
  IssueDetail,
  IssueForm,
  IssueFilters,
  IssueComments,
  type Issue,
  type FilterConfig,
  type IssueFormData,
} from '@/components/issues';

export function CompleteIssueTracker() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filters, setFilters] = useState<FilterConfig>({
    status: [],
    labels: [],
    assignees: [],
    priority: [],
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Handle create
  const handleCreateIssue = async (data: IssueFormData) => {
    const newIssue = await api.createIssue(data);
    setIssues([newIssue, ...issues]);
    setShowCreateForm(false);
  };

  // Handle update
  const handleUpdateIssue = async (data: IssueFormData) => {
    const updated = await api.updateIssue(selectedIssue!.id, data);
    setIssues(issues.map(i => i.id === updated.id ? updated : i));
    setSelectedIssue(updated);
  };

  // Handle status change
  const handleStatusChange = async (status: string) => {
    const updated = await api.updateIssue(selectedIssue!.id, { status });
    setIssues(issues.map(i => i.id === updated.id ? updated : i));
    setSelectedIssue(updated);
  };

  return (
    <div className="flex gap-4 h-screen">
      {/* Filters */}
      <aside className="w-64">
        <IssueFilters
          activeFilters={filters}
          onFiltersChange={setFilters}
          availableLabels={labels}
          availableUsers={users}
          resultCount={filteredIssues.length}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex gap-4">
        {/* List */}
        <div className="flex-1">
          <IssueList
            issues={filterIssues(issues, filters)}
            onIssueClick={setSelectedIssue}
            onCreateIssue={() => setShowCreateForm(true)}
            selectedFilters={filters}
          />
        </div>

        {/* Detail panel */}
        {selectedIssue && (
          <aside className="w-96">
            <IssueDetail
              issue={selectedIssue}
              onStatusChange={handleStatusChange}
              onClose={() => setSelectedIssue(null)}
            />
          </aside>
        )}
      </main>

      {/* Create modal */}
      {showCreateForm && (
        <dialog>
          <IssueForm
            onSubmit={handleCreateIssue}
            onCancel={() => setShowCreateForm(false)}
            availableUsers={users}
            availableLabels={labels}
            availableMilestones={milestones}
          />
        </dialog>
      )}
    </div>
  );
}
```

## Component Import Patterns

### Named Imports (Recommended)
```tsx
import {
  IssueList,
  IssueCard,
  IssueDetail,
  type Issue,
  type Label,
} from '@/components/issues';
```

### Type-Only Imports
```tsx
import type {
  Issue,
  Label,
  User,
  Milestone,
  Comment,
  IssueFormData,
  FilterConfig,
} from '@/components/issues';
```

### Default Imports (Individual)
```tsx
import IssueList from '@/components/issues/IssueList';
import IssueForm from '@/components/issues/IssueForm';
```

## Common Props

### Callbacks Pattern
```tsx
// All async callbacks return Promise
onSubmit={async (data) => {
  await api.submitData(data);
}}

// Optional callbacks
onClick?: (item) => void;
onDelete?: (id) => void;

// Async with loading handled by component
onCommentSubmit={async (content) => {
  await api.createComment(content);
}}
```

### Loading/Error Pattern
```tsx
<IssueList
  issues={issues}
  isLoading={isLoading}  // Shows skeleton
  error={error}           // Shows error message
  onIssueClick={handleClick}
/>
```

### Filter Pattern
```tsx
<IssueList
  issues={issues}
  selectedFilters={{
    status: ['open'],
    labels: ['bug', 'urgent'],
    assignees: ['user-1'],
    priority: ['high', 'critical'],
  }}
/>
```

## State Management Tips

### Using with Context
```tsx
const IssueContext = createContext<{
  issues: Issue[];
  filters: FilterConfig;
  setFilters: (filters: FilterConfig) => void;
}>(null!);

export function IssueProvider({ children }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({...});

  return (
    <IssueContext.Provider value={{ issues, filters, setFilters }}>
      {children}
    </IssueContext.Provider>
  );
}
```

### Using with Redux/Zustand
```tsx
const issueStore = create((set) => ({
  issues: [] as Issue[],
  filters: {} as FilterConfig,
  setIssues: (issues) => set({ issues }),
  setFilters: (filters) => set({ filters }),
}));

export function IssuesPage() {
  const { issues, filters, setFilters } = issueStore();
  return <IssueList issues={issues} selectedFilters={filters} />;
}
```

## Styling Customization

### Override with className
```tsx
<IssueCard 
  issue={issue}
  className="shadow-xl rounded-2xl"
/>
```

### Custom Tailwind Config
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'issue-open': '#28a745',
        'issue-closed': '#d73a49',
      },
    },
  },
};
```

### Dark Mode Ready
All components use semantic colors that support Tailwind dark mode:
```tsx
<div className="dark:bg-gray-800 dark:text-white">
  <IssueList issues={issues} />
</div>
```

## Common Recipes

### Auto-refresh Issue List
```tsx
useEffect(() => {
  const interval = setInterval(async () => {
    const updated = await api.getIssues();
    setIssues(updated);
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
```

### Debounce Search
```tsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useMemo(
  () => debounce((term) => {
    const filtered = issues.filter(i => 
      i.title.includes(term)
    );
    setFiltered(filtered);
  }, 300),
  []
);
```

### Keyboard Shortcuts
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'n' && e.ctrlKey) {
      setShowCreateForm(true);
    }
    if (e.key === 'Escape') {
      setSelectedIssue(null);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Troubleshooting

### Components not rendering
- Check that required props are provided
- Verify TypeScript types match
- Check browser console for errors

### Styling issues
- Ensure Tailwind CSS is configured
- Check for CSS conflicts
- Use `!important` as last resort (avoid)

### Performance issues
- Check IssueList pagination settings
- Consider virtual scrolling for large lists
- Use React DevTools Profiler

### Type errors
- Import types with `import type {...}`
- Use `satisfies` for type checking
- Check tsconfig.json settings

## Next Steps

1. Read the full [README.md](./README.md) for detailed component documentation
2. Review [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md) for architecture
3. Check individual component files for additional features
4. Review JSDoc comments in the code
5. Run tests to verify integration
