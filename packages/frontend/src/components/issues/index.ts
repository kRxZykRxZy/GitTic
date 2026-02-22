/**
 * Issues Components Index
 * 
 * This module exports all issue-related components for easy importing.
 * 
 * @example
 * ```tsx
 * import {
 *   IssueList,
 *   IssueCard,
 *   IssueDetail,
 *   IssueForm,
 *   IssueComments,
 *   IssueLabels,
 *   IssueMilestone,
 *   IssueAssignees,
 *   IssueFilters,
 *   IssueTimeline,
 * } from '@/components/issues';
 * ```
 */

// Components
export { default as IssueList } from './IssueList';
export type { Issue, Label, User, Milestone } from './IssueList';

export { default as IssueCard } from './IssueCard';

export { default as IssueDetail } from './IssueDetail';

export { default as IssueForm, type IssueFormData } from './IssueForm';

export { default as IssueComments, type Comment } from './IssueComments';

export { default as IssueLabels } from './IssueLabels';

export { default as IssueMilestone } from './IssueMilestone';

export { default as IssueAssignees } from './IssueAssignees';

export { default as IssueFilters, type FilterConfig } from './IssueFilters';

export { default as IssueTimeline, type TimelineEvent } from './IssueTimeline';
