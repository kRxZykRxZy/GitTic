/**
 * Repository Components Library
 * 
 * This module exports all production-quality repository browser components
 * similar to GitHub's UI for displaying and navigating repository data.
 */

// Code Viewer
export { CodeViewer } from './CodeViewer';
export type { CodeViewerProps } from './CodeViewer';

// Branch Selector
export { BranchSelector } from './BranchSelector';
export type { BranchSelectorProps, Branch } from './BranchSelector';

// Commit List
export { CommitList } from './CommitList';
export type { CommitListProps, Commit } from './CommitList';

// Diff Viewer
export { DiffViewer } from './DiffViewer';
export type { DiffViewerProps, FileDiff, DiffLine } from './DiffViewer';

// README Viewer
export { ReadmeViewer } from './ReadmeViewer';
export type { ReadmeViewerProps } from './ReadmeViewer';

// Repository Stats
export { RepositoryStats } from './RepositoryStats';
export type { RepositoryStatsProps, RepositoryStatistics } from './RepositoryStats';

// Tag List
export { TagList } from './TagList';
export type { TagListProps, Tag } from './TagList';

// Repository Breadcrumb
export { RepositoryBreadcrumb } from './RepositoryBreadcrumb';
export type { RepositoryBreadcrumbProps, BreadcrumbItem } from './RepositoryBreadcrumb';

// Repository Browser (main component)
export { RepositoryBrowser } from './RepositoryBrowser';
export type { RepositoryBrowserProps, FileTreeNode } from './RepositoryBrowser';

// Screenshot-style repository page shell
export { RepoPageShell } from "./RepoPageShell";
export type { RepoPageShellProps } from "./RepoPageShell";

export { RepoSideNav } from "./RepoSideNav";
export type { RepoSideNavProps, RepoSideNavItem } from "./RepoSideNav";

export { RepoHeaderBar } from "./RepoHeaderBar";
export type { RepoHeaderBarProps } from "./RepoHeaderBar";

export { RepoSummaryPanel } from "./RepoSummaryPanel";
export type { RepoSummaryPanelProps } from "./RepoSummaryPanel";
