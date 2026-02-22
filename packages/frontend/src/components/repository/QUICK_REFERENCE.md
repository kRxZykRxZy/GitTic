# Repository Components - Quick Reference Guide

## 📦 Import All Components

```typescript
import {
  CodeViewer,
  BranchSelector,
  CommitList,
  DiffViewer,
  ReadmeViewer,
  RepositoryStats,
  TagList,
  RepositoryBreadcrumb,
  RepositoryBrowser,
} from '@/components/repository';
```

## 🚀 Quick Component Reference

### 1. CodeViewer
**Display code with syntax highlighting**
```typescript
<CodeViewer 
  code="const x = 42;" 
  language="javascript"
  showLineNumbers={true}
/>
```
| Prop | Type | Default |
|------|------|---------|
| code | string | required |
| language | string | 'plaintext' |
| filePath | string | - |
| showLineNumbers | boolean | true |
| showCopyButton | boolean | true |

---

### 2. BranchSelector
**Select repository branch**
```typescript
<BranchSelector 
  branches={branches}
  selectedBranch="main"
  onBranchChange={(branch) => console.log(branch)}
/>
```
| Prop | Type | Default |
|------|------|---------|
| branches | Branch[] | required |
| selectedBranch | string | required |
| onBranchChange | function | required |
| isLoading | boolean | false |
| error | string | null |

---

### 3. CommitList
**Display commit history**
```typescript
<CommitList 
  commits={commits}
  pageSize={20}
  showStats={true}
  onCommitClick={(commit) => console.log(commit)}
/>
```
| Prop | Type | Default |
|------|------|---------|
| commits | Commit[] | required |
| onCommitClick | function | - |
| selectedCommitSha | string | - |
| pageSize | number | 25 |
| showStats | boolean | true |

---

### 4. DiffViewer
**Display file diffs**
```typescript
<DiffViewer 
  diffs={diffs}
  viewMode="unified"
  expandAll={false}
/>
```
| Prop | Type | Default |
|------|------|---------|
| diffs | FileDiff[] | required |
| viewMode | 'unified' \| 'split' | 'unified' |
| expandAll | boolean | false |
| collapseUnchanged | boolean | true |

---

### 5. ReadmeViewer
**Display markdown README**
```typescript
<ReadmeViewer 
  content={readmeMarkdown}
  fileName="README.md"
  renderMarkdown={true}
/>
```
| Prop | Type | Default |
|------|------|---------|
| content | string | required |
| fileName | string | 'README.md' |
| renderMarkdown | boolean | true |
| showEditButton | boolean | true |
| showDownloadButton | boolean | true |

---

### 6. RepositoryStats
**Show repository metrics**
```typescript
<RepositoryStats 
  stats={stats}
  repositoryName="my-repo"
  showLanguages={true}
/>
```
| Prop | Type | Default |
|------|------|---------|
| stats | Partial<Statistics> | required |
| repositoryName | string | - |
| isLoading | boolean | false |
| compact | boolean | false |
| showLanguages | boolean | true |

---

### 7. TagList
**Display tags and releases**
```typescript
<TagList 
  tags={tags}
  showReleasesOnly={false}
  pageSize={10}
/>
```
| Prop | Type | Default |
|------|------|---------|
| tags | Tag[] | required |
| onTagClick | function | - |
| pageSize | number | 10 |
| showReleasesOnly | boolean | false |
| showNotes | boolean | true |

---

### 8. RepositoryBreadcrumb
**File path navigation**
```typescript
<RepositoryBreadcrumb 
  items={breadcrumbItems}
  showHome={true}
  separator="/"
/>
```
| Prop | Type | Default |
|------|------|---------|
| items | BreadcrumbItem[] | required |
| onItemClick | function | - |
| showHome | boolean | true |
| separator | string | '/' |
| maxItems | number | 10 |

---

### 9. RepositoryBrowser
**Complete integrated browser**
```typescript
<RepositoryBrowser 
  repositoryName="my-repo"
  branches={branches}
  selectedBranch="main"
  fileTree={fileTree}
  onBranchChange={handleBranchChange}
  onLoadFile={loadFileContent}
/>
```
| Prop | Type | Default |
|------|------|---------|
| repositoryName | string | required |
| branches | Branch[] | required |
| selectedBranch | string | required |
| fileTree | FileTreeNode[] | required |
| onBranchChange | function | required |
| onLoadFile | async function | - |
| showFileTree | boolean | true |
| showBranchSelector | boolean | true |

---

## �� Common Usage Patterns

### Pattern 1: Simple Code Viewer
```typescript
import { CodeViewer } from '@/components/repository';

export function CodeDisplay() {
  const code = `function hello() {
    console.log('Hello, World!');
  }`;

  return (
    <CodeViewer
      code={code}
      language="javascript"
      filePath="src/hello.js"
    />
  );
}
```

### Pattern 2: Branch Switcher
```typescript
import { BranchSelector } from '@/components/repository';
import { useState } from 'react';

export function BranchSwitcher() {
  const [selectedBranch, setSelectedBranch] = useState('main');
  
  const branches = [
    { name: 'main', isDefault: true },
    { name: 'develop', isDefault: false },
  ];

  return (
    <BranchSelector
      branches={branches}
      selectedBranch={selectedBranch}
      onBranchChange={setSelectedBranch}
    />
  );
}
```

### Pattern 3: Full Repository Browser
```typescript
import { RepositoryBrowser } from '@/components/repository';

export function RepositoryView() {
  const [branch, setBranch] = useState('main');

  const handleLoadFile = async (path, branch) => {
    const response = await fetch(`/api/files?path=${path}&branch=${branch}`);
    return response.text();
  };

  const handleLoadDirectory = async (path, branch) => {
    const response = await fetch(`/api/dirs?path=${path}&branch=${branch}`);
    return response.json();
  };

  return (
    <RepositoryBrowser
      repositoryName="awesome-project"
      branches={branches}
      selectedBranch={branch}
      onBranchChange={setBranch}
      fileTree={fileTree}
      onLoadFile={handleLoadFile}
      onLoadDirectory={handleLoadDirectory}
    />
  );
}
```

---

## 📋 Interface Quick Reference

### Branch
```typescript
interface Branch {
  name: string;
  isDefault?: boolean;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitDate?: string;
}
```

### Commit
```typescript
interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  author: { name: string; date: string };
  stats?: { total: number; additions: number; deletions: number };
}
```

### FileTreeNode
```typescript
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
}
```

### FileDiff
```typescript
interface FileDiff {
  fileName: string;
  status: 'added' | 'removed' | 'modified';
  additions: number;
  deletions: number;
  patch?: string;
}
```

### Tag
```typescript
interface Tag {
  name: string;
  commitSha: string;
  isRelease?: boolean;
  releaseNotes?: string;
  prerelease?: boolean;
}
```

---

## 🎨 Styling

Each component imports its own CSS module:
```typescript
import './ComponentName.css';
```

Create corresponding CSS files:
- `CodeViewer.css`
- `BranchSelector.css`
- `CommitList.css`
- `DiffViewer.css`
- `ReadmeViewer.css`
- `RepositoryStats.css`
- `TagList.css`
- `RepositoryBreadcrumb.css`
- `RepositoryBrowser.css`

---

## ♿ Accessibility Features

All components include:
- ✅ ARIA labels (`aria-label`, `aria-expanded`, etc.)
- ✅ Semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- ✅ Keyboard navigation (arrows, enter, escape)
- ✅ Focus management
- ✅ Color contrast compliance

---

## ⌨️ Keyboard Shortcuts

| Component | Key | Action |
|-----------|-----|--------|
| BranchSelector | ↑↓ | Navigate branches |
| BranchSelector | Enter | Select branch |
| BranchSelector | Esc | Close dropdown |
| CommitList | Click | Select commit |
| DiffViewer | Click | Expand file |
| All | Tab | Move focus |

---

## 🔄 Event Callbacks

All callbacks follow consistent patterns:

```typescript
// Selection callbacks
onFileSelect?: (file: FileTreeNode) => void
onCommitClick?: (commit: Commit) => void
onTagClick?: (tag: Tag) => void

// Change callbacks
onBranchChange: (branchName: string) => void

// Async callbacks
onLoadFile?: (path: string, branch: string) => Promise<string>
onLoadDirectory?: (path: string, branch: string) => Promise<FileTreeNode[]>
```

---

## 📊 Component Matrix

| Component | Standalone | Needs Parent | Composable |
|-----------|-----------|--------------|-----------|
| CodeViewer | ✅ | - | ✅ |
| BranchSelector | ✅ | - | ✅ |
| CommitList | ✅ | - | ✅ |
| DiffViewer | ✅ | - | ✅ |
| ReadmeViewer | ✅ | - | ✅ |
| RepositoryStats | ✅ | - | ✅ |
| TagList | ✅ | - | ✅ |
| RepositoryBreadcrumb | ✅ | - | ✅ |
| RepositoryBrowser | ✅ | - | ⭐ Combines all |

---

## 🚀 Performance Tips

1. **Memoization**: Use `useMemo` for expensive operations
2. **Pagination**: Load items in batches (CommitList, TagList)
3. **Lazy Loading**: Load directories on demand (RepositoryBrowser)
4. **Code Splitting**: Import components dynamically if needed
5. **Search Debouncing**: Debounce search inputs for large lists

---

## 🐛 Debugging

All components support standard React debugging:
```typescript
// Use React DevTools to inspect props
// Console logs available for errors
// Error boundaries recommended for production
```

---

## 📚 Full Documentation

For complete documentation, see:
- **README.md** - Component descriptions and usage
- **ARCHITECTURE.md** - Architecture patterns and design

---

**Last Updated**: February 13, 2024
**Status**: ✅ Ready for Production
