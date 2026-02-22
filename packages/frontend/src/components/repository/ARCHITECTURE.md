# Repository Components Architecture

## Component Hierarchy

```
RepositoryBrowser (Main Container)
├── Header
│   ├── Repository Name
│   └── BranchSelector
│       └── Branch Management
│
├── Sidebar (File Tree Panel)
│   ├── Search Input
│   └── FileTree (Recursive)
│       ├── Expandable Directories
│       └── Selectable Files
│
└── Main Content Area
    ├── RepositoryBreadcrumb
    │   └── File Path Navigation
    │
    └── CodeViewer (or other viewers)
        ├── Line Numbers
        ├── Syntax Highlighting
        └── Copy Button

Related Components (Used Independently):
├── CommitList (for history viewing)
├── DiffViewer (for change viewing)
├── ReadmeViewer (for documentation)
├── RepositoryStats (for metrics)
├── TagList (for releases)
└── BranchSelector (for branch management)
```

## Component Dependencies

```
RepositoryBrowser
├── depends on: BranchSelector
├── depends on: RepositoryBreadcrumb
├── depends on: CodeViewer
└── manages: FileTree, state, navigation

CommitList
└── independent component
    └── displays: Commit history
    └── manages: pagination, expansion

DiffViewer
└── independent component
    └── displays: File diffs
    └── manages: view mode, expansion

ReadmeViewer
└── independent component
    └── displays: Markdown content
    └── manages: rendering, copy/download

RepositoryStats
└── independent component
    └── displays: Repository metrics
    └── manages: data formatting

TagList
└── independent component
    └── displays: Tags and releases
    └── manages: pagination, expansion

CodeViewer
└── independent component
    └── displays: Code with syntax highlighting
    └── manages: line selection, highlighting

BranchSelector
└── independent component
    └── displays: Branch dropdown
    └── manages: search, keyboard navigation

RepositoryBreadcrumb
└── independent component
    └── displays: Breadcrumb navigation
    └── manages: path navigation
```

## Data Flow

### File Selection Flow
```
User clicks file in FileTree
    ↓
handleNodeClick(file)
    ↓
onLoadFile(path, branch)
    ↓
Fetch file content
    ↓
setFileContent(content)
    ↓
CodeViewer renders with content
    ↓
BreadcrumbComponent updates
```

### Branch Change Flow
```
User selects branch in BranchSelector
    ↓
onBranchChange(branchName)
    ↓
Update selectedBranch state
    ↓
FileTree refreshes (if needed)
    ↓
Reload file content if file selected
```

### Directory Expansion Flow
```
User clicks directory in FileTree
    ↓
If not expanded:
    ↓
loadDirectory(path)
    ↓
onLoadDirectory(path, branch)
    ↓
Fetch directory contents
    ↓
Update FileTree with children
    ↓
setExpandedPaths(add path)
    ↓
Render children
```

## State Management Pattern

Each component manages its own state:

```typescript
RepositoryBrowser:
├── expandedPaths: Set<string>
├── searchTerm: string
├── fileContent: string
├── fileContentLoading: boolean
└── loadingPaths: Set<string>

BranchSelector:
├── isOpen: boolean
├── searchTerm: string
└── highlightedIndex: number

CommitList:
├── displayedCount: number
├── copiedSha: string | null
└── expandedSha: string | null

DiffViewer:
└── expandedFiles: Set<string>

ReadmeViewer:
└── (primarily props-driven)

RepositoryStats:
└── (primarily props-driven)

TagList:
├── displayedCount: number
├── expandedTags: Set<string>
└── searchTerm: string

CodeViewer:
├── copied: boolean
└── selectedLine: number | null

RepositoryBreadcrumb:
└── (primarily props-driven)
```

## Event Handling Pattern

All components follow a consistent callback pattern:

```typescript
// File Selection
onFileSelect?: (file: FileTreeNode) => void
onLoadFile?: (path: string, branch: string) => Promise<string>

// Branch Management
onBranchChange: (branchName: string) => void

// Directory Loading
onLoadDirectory?: (path: string, branch: string) => Promise<FileTreeNode[]>

// Item Clicks
onNodeClick: (node: FileTreeNode) => void
onCommitClick?: (commit: Commit) => void
onFileClick?: (file: FileDiff) => void
onTagClick?: (tag: Tag) => void

// Item Selection
onLineClick?: (lineNumber: number) => void
onItemClick?: (item: BreadcrumbItem, index: number) => void
```

## Keyboard Navigation Support

All interactive components support:
- **Arrow Keys**: Navigate between options/items
- **Enter**: Select/activate
- **Space**: Toggle/Select
- **Escape**: Close dropdowns/cancel
- **Tab**: Move focus to next element

## Performance Optimization Strategies

### Memoization
```typescript
const filteredFileTree = useMemo(() => {
  // expensive filter operation
}, [fileTree, searchTerm]);

const breadcrumbItems = useMemo(() => {
  // expensive path parsing
}, [selectedFilePath]);
```

### Lazy Loading
```typescript
// Load directories on demand
if (!node.children || node.children.length === 0) {
  loadDirectory(node.path);
}
```

### Pagination
```typescript
// CommitList: Show 20, load more as needed
const displayedCommits = commits.slice(0, displayedCount);
const hasMore = displayedCount < commits.length;
```

### Code Splitting
```typescript
// Import components on demand
const CodeViewer = lazy(() => import('./CodeViewer'));
```

## Responsive Design Breakpoints

```css
Desktop (1200px+):
├── Full sidebar + main content
├── All features visible
└── Optimal spacing

Tablet (768px - 1199px):
├── Collapsible sidebar
├── Adjusted spacing
└── Touch-friendly buttons

Mobile (< 768px):
├── Hidden sidebar
├── Full-width main content
├── Simplified controls
└── Stack layout
```

## Styling Architecture

Each component includes:
- Base styles (layout, typography)
- Interactive states (hover, active, focus)
- Loading states
- Error states
- Empty states
- Responsive adjustments
- Dark mode support (optional)

## Accessibility Compliance

- WCAG 2.1 Level AA
- ARIA landmarks and labels
- Semantic HTML
- Color contrast ≥ 4.5:1
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Extensibility Points

Components can be extended by:

1. **Props Extension**: Add new optional props
2. **Callbacks**: Use onItemClick, onFileSelect, etc.
3. **Custom CSS**: Override with className + CSS modules
4. **Composition**: Wrap with parent components
5. **Children Props**: Some components support custom children
6. **Style Props**: CSS properties override via style parameter

Example Custom Component:
```typescript
interface CustomCodeViewerProps extends CodeViewerProps {
  onSave?: (content: string) => Promise<void>;
  showSaveButton?: boolean;
}

export const CustomCodeViewer: React.FC<CustomCodeViewerProps> = ({
  ...props,
  onSave,
  showSaveButton
}) => {
  return (
    <div>
      <CodeViewer {...props} />
      {showSaveButton && (
        <button onClick={() => onSave?.(props.code)}>
          Save
        </button>
      )}
    </div>
  );
};
```

## Testing Strategy

### Unit Tests
- Component rendering
- Props validation
- Callback invocation
- State changes
- Event handling

### Integration Tests
- Component interaction
- Data flow between components
- Keyboard navigation
- Search/filter functionality

### E2E Tests
- File selection workflow
- Branch switching
- File content loading
- Tree expansion/collapse

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | Latest  | ✅      |
| Firefox | Latest  | ✅      |
| Safari  | Latest  | ✅      |
| Edge    | Latest  | ✅      |
| IE 11   | -       | ❌      |
