# Repository Components Library

A production-quality collection of React TypeScript components for displaying and navigating GitHub-like repository data. These components provide a complete UI toolkit for building repository browsers, code viewers, and repository information displays.

## Overview

This component library includes 9 specialized components designed to work together or independently, providing a comprehensive repository browsing experience similar to GitHub.

### Components

#### 1. **CodeViewer** (`CodeViewer.tsx`)
A code viewer with syntax highlighting, line numbers, and line selection support.

**Features:**
- Syntax highlighting for multiple programming languages
- Line number display with customizable behavior
- Line selection and highlighting capabilities
- Copy to clipboard functionality
- Responsive design with scrollable container
- Accessibility support with ARIA labels

**Props:**
```typescript
interface CodeViewerProps {
  code: string;
  language?: string;
  filePath?: string;
  showLineNumbers?: boolean;
  enableLineSelection?: boolean;
  highlightedLine?: number;
  highlightedRange?: [number, number];
  onLineClick?: (lineNumber: number) => void;
  className?: string;
  showCopyButton?: boolean;
}
```

**Usage Example:**
```tsx
<CodeViewer
  code="const hello = 'world';"
  language="javascript"
  filePath="src/main.js"
  showLineNumbers={true}
  showCopyButton={true}
/>
```

---

#### 2. **BranchSelector** (`BranchSelector.tsx`)
A dropdown component for selecting repository branches with search capability.

**Features:**
- Searchable branch list
- Default branch highlighting
- Branch information display (last commit, date, etc.)
- Loading and error states
- Keyboard navigation (arrow keys, enter, escape)
- Click outside to close
- Branch statistics display

**Props:**
```typescript
interface BranchSelectorProps {
  branches: Branch[];
  selectedBranch: string;
  onBranchChange: (branchName: string) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  showIcons?: boolean;
}

interface Branch {
  name: string;
  isDefault?: boolean;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitDate?: string;
}
```

**Usage Example:**
```tsx
const branches: Branch[] = [
  { name: 'main', isDefault: true, lastCommitMessage: 'Initial commit' },
  { name: 'develop', lastCommitMessage: 'Add features' }
];

<BranchSelector
  branches={branches}
  selectedBranch="main"
  onBranchChange={(branch) => console.log(branch)}
/>
```

---

#### 3. **CommitList** (`CommitList.tsx`)
A scrollable commit history list with detailed commit information.

**Features:**
- Commit history with pagination
- Author avatars with color coding
- Commit statistics (additions/deletions)
- Copy commit SHA functionality
- Expandable commit details
- Relative time formatting
- Keyboard navigation
- Loading and error states

**Props:**
```typescript
interface CommitListProps {
  commits: Commit[];
  onCommitClick?: (commit: Commit) => void;
  selectedCommitSha?: string;
  isLoading?: boolean;
  error?: string | null;
  showStats?: boolean;
  showAvatars?: boolean;
  pageSize?: number;
  className?: string;
}

interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  author: {
    name: string;
    email?: string;
    date: string;
  };
  committer?: { name: string; email?: string; date: string };
  parentShas?: string[];
  stats?: { total: number; additions: number; deletions: number };
}
```

**Usage Example:**
```tsx
const commits: Commit[] = [
  {
    sha: 'abc123...',
    shortSha: 'abc123',
    message: 'Fix bug in feature',
    author: { name: 'John Doe', date: new Date().toISOString() },
    stats: { total: 5, additions: 3, deletions: 2 }
  }
];

<CommitList commits={commits} pageSize={20} showStats={true} />
```

---

#### 4. **DiffViewer** (`DiffViewer.tsx`)
A diff viewer for displaying file changes in unified or split view.

**Features:**
- Unified and split diff view modes
- File-level collapse/expand functionality
- Addition and deletion highlighting
- Line number display
- Statistics display (additions, deletions)
- Expandable file sections
- Status badges (added, removed, modified, renamed)
- Responsive layout

**Props:**
```typescript
interface DiffViewerProps {
  diffs: FileDiff[];
  viewMode?: 'unified' | 'split';
  collapseUnchanged?: boolean;
  expandAll?: boolean;
  onFileClick?: (file: FileDiff) => void;
  expandedFile?: string;
  className?: string;
}

interface FileDiff {
  fileName: string;
  oldFileName?: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  hunks?: DiffLine[][];
}
```

**Usage Example:**
```tsx
const diffs: FileDiff[] = [
  {
    fileName: 'package.json',
    status: 'modified',
    additions: 2,
    deletions: 1,
    changes: 3,
    patch: '@@...'
  }
];

<DiffViewer diffs={diffs} viewMode="unified" />
```

---

#### 5. **ReadmeViewer** (`ReadmeViewer.tsx`)
A README viewer with markdown rendering support.

**Features:**
- Markdown rendering (headings, lists, code blocks)
- Raw markdown display option
- Download and copy functionality
- Edit button support
- File name display
- Loading and error states
- Responsive design
- Markdown statistics (line count)

**Props:**
```typescript
interface ReadmeViewerProps {
  content: string;
  fileName?: string;
  renderMarkdown?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onContentChange?: (content: string) => void;
  showEditButton?: boolean;
  showDownloadButton?: boolean;
  customStyles?: React.CSSProperties;
}
```

**Usage Example:**
```tsx
const readmeContent = `# My Project\n\nThis is a great project.`;

<ReadmeViewer
  content={readmeContent}
  fileName="README.md"
  renderMarkdown={true}
  showEditButton={true}
/>
```

---

#### 6. **RepositoryStats** (`RepositoryStats.tsx`)
A statistics component displaying repository metrics and insights.

**Features:**
- Key metrics cards (commits, contributors, issues, PRs, stars, forks, etc.)
- Language breakdown with percentage chart
- Repository metadata (license, created/updated dates)
- Compact and full view modes
- Loading and error states
- Large number formatting (K, M notation)
- Color-coded language indicators
- Badge display (private, fork)

**Props:**
```typescript
interface RepositoryStatsProps {
  stats: Partial<RepositoryStatistics>;
  repositoryName?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  compact?: boolean;
  showLanguages?: boolean;
}

interface RepositoryStatistics {
  totalCommits: number;
  totalContributors: number;
  totalIssues: number;
  totalPullRequests: number;
  totalReleases: number;
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  totalBranches: number;
  totalTags: number;
  createdAt?: string;
  updatedAt?: string;
  primaryLanguage?: string;
  languages?: Record<string, number>;
  licenseType?: string;
  isPrivate?: boolean;
  isFork?: boolean;
}
```

**Usage Example:**
```tsx
const stats: RepositoryStatistics = {
  totalCommits: 150,
  totalContributors: 5,
  totalIssues: 12,
  totalPullRequests: 8,
  totalStars: 250,
  totalForks: 50,
  languages: { JavaScript: 5000, CSS: 2000 }
};

<RepositoryStats stats={stats} repositoryName="my-repo" showLanguages={true} />
```

---

#### 7. **TagList** (`TagList.tsx`)
A tags and releases list component with expandable release notes.

**Features:**
- Tag and release list with pagination
- Release notes viewing
- Download links for releases
- Pre-release and draft badges
- Author information display
- Commit SHA copy functionality
- Search and filter capabilities
- Expandable release notes
- Relative date formatting

**Props:**
```typescript
interface TagListProps {
  tags: Tag[];
  onTagClick?: (tag: Tag) => void;
  selectedTagName?: string;
  isLoading?: boolean;
  error?: string | null;
  showReleasesOnly?: boolean;
  showNotes?: boolean;
  sortOrder?: 'asc' | 'desc';
  className?: string;
  pageSize?: number;
}

interface Tag {
  name: string;
  commitSha: string;
  commitUrl?: string;
  tagDate?: string;
  isRelease?: boolean;
  releaseNotes?: string;
  author?: { name: string; email?: string; date?: string };
  downloadUrl?: string;
  prerelease?: boolean;
  draft?: boolean;
}
```

**Usage Example:**
```tsx
const tags: Tag[] = [
  {
    name: 'v1.0.0',
    commitSha: 'abc123...',
    isRelease: true,
    releaseNotes: 'First stable release',
    tagDate: new Date().toISOString()
  }
];

<TagList tags={tags} showReleasesOnly={false} pageSize={10} />
```

---

#### 8. **RepositoryBreadcrumb** (`RepositoryBreadcrumb.tsx`)
A breadcrumb navigation component for file path navigation.

**Features:**
- File path breadcrumb navigation
- Home link with customizable label
- Collapsible items for deep paths
- Keyboard navigation (enter, space)
- Click callbacks for navigation
- Custom separators
- Icon support for each breadcrumb item
- Active item styling
- Accessibility support with ARIA labels

**Props:**
```typescript
interface RepositoryBreadcrumbProps {
  items: BreadcrumbItem[];
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
  separator?: string;
  className?: string;
  showHome?: boolean;
  maxItems?: number;
  homeLabel?: string;
  homePath?: string;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
  isActive?: boolean;
  onClick?: () => void;
}
```

**Usage Example:**
```tsx
const breadcrumbItems: BreadcrumbItem[] = [
  { label: 'src', path: '/src', icon: '📁' },
  { label: 'components', path: '/src/components', icon: '📁' },
  { label: 'App.tsx', path: '/src/components/App.tsx', icon: '📄', isActive: true }
];

<RepositoryBreadcrumb
  items={breadcrumbItems}
  showHome={true}
  separator="/"
/>
```

---

#### 9. **RepositoryBrowser** (`RepositoryBrowser.tsx`)
A complete repository browser combining all components.

**Features:**
- Integrated file tree navigation
- Branch selector
- Breadcrumb navigation
- Code viewer for selected files
- File search functionality
- Lazy loading of directories
- File icons and metadata
- Responsive layout (sidebar + main content)
- Loading and error states
- Language detection for syntax highlighting
- Keyboard navigation support
- Expandable/collapsible directory sections

**Props:**
```typescript
interface RepositoryBrowserProps {
  repositoryName: string;
  branches: Branch[];
  selectedBranch: string;
  onBranchChange: (branchName: string) => void;
  fileTree: FileTreeNode[];
  onFileSelect?: (file: FileTreeNode) => void;
  onLoadFile?: (path: string, branch: string) => Promise<string>;
  selectedFilePath?: string;
  isLoading?: boolean;
  error?: string | null;
  showFileTree?: boolean;
  showBranchSelector?: boolean;
  onLoadDirectory?: (path: string, branch: string) => Promise<FileTreeNode[]>;
  className?: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  children?: FileTreeNode[];
  isLoading?: boolean;
}
```

**Usage Example:**
```tsx
const fileTree: FileTreeNode[] = [
  {
    name: 'src',
    path: '/src',
    type: 'directory',
    children: [
      { name: 'main.tsx', path: '/src/main.tsx', type: 'file', size: 1024 }
    ]
  }
];

const branches: Branch[] = [
  { name: 'main', isDefault: true }
];

<RepositoryBrowser
  repositoryName="my-project"
  branches={branches}
  selectedBranch="main"
  onBranchChange={(branch) => console.log(branch)}
  fileTree={fileTree}
  onLoadFile={async (path, branch) => '// file content'}
  showFileTree={true}
  showBranchSelector={true}
/>
```

---

## Installation & Setup

### Import Components

```typescript
// Import individual components
import { CodeViewer, BranchSelector, CommitList } from '@/components/repository';

// Or import the main RepositoryBrowser
import { RepositoryBrowser } from '@/components/repository';
```

### CSS Files

Each component includes a corresponding CSS module (e.g., `CodeViewer.css`). Ensure these CSS files are created for proper styling:

- `CodeViewer.css`
- `BranchSelector.css`
- `CommitList.css`
- `DiffViewer.css`
- `ReadmeViewer.css`
- `RepositoryStats.css`
- `TagList.css`
- `RepositoryBreadcrumb.css`
- `RepositoryBrowser.css`

### Dependencies

These components are built with:
- React 18+
- TypeScript 4.5+
- CSS Modules (optional, can use any CSS solution)

No external UI libraries are required - these are standalone components.

---

## Styling Guide

### Theme Variables

You can customize components using CSS custom properties:

```css
:root {
  /* Colors */
  --primary-color: #0969da;
  --danger-color: #d73a49;
  --success-color: #28a745;
  --warning-color: #ffd500;
  
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f6f8fa;
  --bg-tertiary: #eaeef2;
  
  /* Text */
  --text-primary: #24292f;
  --text-secondary: #57606a;
  --text-tertiary: #768390;
  
  /* Borders */
  --border-color: #d0d7de;
  --border-radius: 6px;
}
```

---

## Accessibility Features

All components include:
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
- Focus indicators
- Semantic HTML

---

## Common Patterns

### Handle File Selection
```tsx
const handleFileSelect = async (file: FileTreeNode) => {
  const content = await loadFileContent(file.path);
  setSelectedFile(file);
  setFileContent(content);
};
```

### Handle Branch Changes
```tsx
const handleBranchChange = (newBranch: string) => {
  setSelectedBranch(newBranch);
  // Reload file tree or content
};
```

### Search and Filter
```tsx
const [searchTerm, setSearchTerm] = useState('');
const filteredItems = items.filter(item =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

---

## Performance Considerations

- **Virtualization**: For large file trees, consider implementing virtualization
- **Lazy Loading**: Load directories on demand
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Code Splitting**: Import components on demand using dynamic imports
- **Asset Optimization**: Minimize CSS and bundle sizes

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Contributing

When adding new components or features:
1. Follow the existing TypeScript interface patterns
2. Include comprehensive JSDoc comments
3. Add accessibility features
4. Create corresponding CSS modules
5. Provide usage examples in comments

---

## License

These components are part of the Some-new-platform project.

---

## Related Components

- **TreeView**: File tree with infinite scroll
- **FileExplorer**: Enhanced file browser with search
- **CodeEditor**: Full code editor with syntax highlighting
- **PullRequest**: Pull request review interface
- **Issues**: Issues and discussions tracker
