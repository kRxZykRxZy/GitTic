# Issues Components Library

A production-quality React TypeScript component library for building GitHub-like issue tracking systems.

## Overview

This library provides 10 comprehensive components that work together to create a complete issue management interface. Each component is fully typed, documented, and includes proper error handling and loading states.

## Components

### 1. **IssueList** (`IssueList.tsx`)

Displays a paginated list of issues with advanced filtering, sorting, and status indicators.

**Features:**
- Filtering by status, labels, assignees, and priority
- Sorting by created date, updated date, title, or comment count
- Pagination support
- Loading, empty, and error states
- GitHub-like UI patterns

**Usage:**
```tsx
import { IssueList } from '@/components/issues';

<IssueList 
  issues={issues}
  onIssueClick={handleIssueClick}
  sortConfig={{ key: 'updated', direction: 'desc' }}
  selectedFilters={{ status: ['open'] }}
  onSortChange={handleSortChange}
/>
```

### 2. **IssueCard** (`IssueCard.tsx`)

Compact card representation of an issue for use in lists and board layouts.

**Features:**
- Status and priority indicators
- Label display with overflow handling
- Assignee avatars
- Comment count and update time
- Milestone progress visualization
- Compact and full view modes

**Usage:**
```tsx
import { IssueCard } from '@/components/issues';

<IssueCard 
  issue={issue}
  onClick={handleClick}
  onStatusChange={handleStatusChange}
  compact={false}
/>
```

### 3. **IssueDetail** (`IssueDetail.tsx`)

Full-page or modal view showing complete issue information with inline editing capabilities.

**Features:**
- Complete issue information display
- Inline description editing
- Status, priority, and milestone display
- Assignee and label management
- Created by information
- Closed date tracking

**Usage:**
```tsx
import { IssueDetail } from '@/components/issues';

<IssueDetail 
  issue={selectedIssue}
  onClose={handleClose}
  onStatusChange={handleStatusChange}
  onDescriptionEdit={handleEdit}
/>
```

### 4. **IssueForm** (`IssueForm.tsx`)

Create and edit issue form with comprehensive validation and support for all issue properties.

**Features:**
- Title and description input with character limits
- Status and priority selection
- Label management with search
- Assignee selection with user search
- Milestone selection
- Form validation
- Create and edit modes

**Usage:**
```tsx
import { IssueForm } from '@/components/issues';

<IssueForm 
  issue={existingIssue}
  availableUsers={users}
  availableLabels={labels}
  availableMilestones={milestones}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### 5. **IssueComments** (`IssueComments.tsx`)

Comment thread display with full CRUD operations, reactions, and reply support.

**Features:**
- Comment display with timestamps
- Comment editing and deletion
- Emoji reactions
- Reply threads
- User avatars and authentication checking
- Relative time formatting

**Usage:**
```tsx
import { IssueComments } from '@/components/issues';

<IssueComments 
  issueId="123"
  comments={comments}
  currentUser={user}
  onCommentSubmit={handleSubmit}
  onCommentEdit={handleEdit}
  onCommentDelete={handleDelete}
  onReactionAdd={handleReaction}
/>
```

### 6. **IssueLabels** (`IssueLabels.tsx`)

Label management and selector component with search and creation support.

**Features:**
- Available labels display with color coding
- Label selection/deselection
- Label search functionality
- Create new labels with custom colors
- Selected labels summary
- Compact display mode

**Usage:**
```tsx
import { IssueLabels } from '@/components/issues';

<IssueLabels 
  labels={availableLabels}
  selectedLabels={issueLabels}
  onLabelAdd={handleAdd}
  onLabelRemove={handleRemove}
  canCreateLabel={true}
  onCreateLabel={handleCreate}
  compact={false}
/>
```

### 7. **IssueMilestone** (`IssueMilestone.tsx`)

Milestone selector and display component with progress tracking.

**Features:**
- Milestone selection dropdown
- Milestone creation support
- Progress bar visualization
- Due date tracking and countdown
- Days until due/overdue indicators
- Compact display mode

**Usage:**
```tsx
import { IssueMilestone } from '@/components/issues';

<IssueMilestone 
  milestones={availableMilestones}
  selectedMilestone={issue.milestone}
  onMilestoneSelect={handleSelect}
  canCreateMilestone={true}
  showProgress={true}
/>
```

### 8. **IssueAssignees** (`IssueAssignees.tsx`)

Assignee management with user search and self-assignment support.

**Features:**
- User search by name or email
- Multiple assignee support
- Self-assign functionality
- User avatar display
- Current assignee list
- Compact display mode

**Usage:**
```tsx
import { IssueAssignees } from '@/components/issues';

<IssueAssignees 
  availableUsers={users}
  assignedUsers={issue.assignees}
  onAssignUser={handleAssign}
  onUnassignUser={handleUnassign}
  currentUser={currentUser}
  canSelfAssign={true}
/>
```

### 9. **IssueFilters** (`IssueFilters.tsx`)

Advanced filtering sidebar with support for multiple filter types and presets.

**Features:**
- Status filtering with count indicators
- Priority filtering
- Label filtering with color display
- Assignee filtering with avatars
- Date range filtering
- Active filter display and removal
- Result count display
- Filter clearing

**Usage:**
```tsx
import { IssueFilters } from '@/components/issues';

<IssueFilters 
  availableLabels={labels}
  availableUsers={users}
  activeFilters={filters}
  onFiltersChange={handleChange}
  onClearFilters={handleClear}
  resultCount={matchingIssues}
  compact={true}
/>
```

### 10. **IssueTimeline** (`IssueTimeline.tsx`)

Chronological activity timeline showing all issue events and changes.

**Features:**
- Issue creation event
- Comment events
- Status change tracking
- Label addition/removal
- Assignee changes
- Milestone changes
- Timeline event icons
- Relative time formatting
- Event details display

**Usage:**
```tsx
import { IssueTimeline } from '@/components/issues';

<IssueTimeline 
  issue={issue}
  events={timelineEvents}
  showCreation={true}
  isLoading={false}
/>
```

## Type Definitions

### Core Types

```tsx
// From IssueList.tsx
interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: Label[];
  assignees: User[];
  milestone?: Milestone;
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  commentCount: number;
  closed?: Date;
}

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  progress: number;
}

// From IssueComments.tsx
interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  reactions: { emoji: string; count: number; userReacted: boolean }[];
  replies?: Comment[];
}

// From IssueForm.tsx
interface IssueFormData {
  title: string;
  description: string;
  status: Issue['status'];
  priority: Issue['priority'];
  labels: Label[];
  assignees: User[];
  milestone?: Milestone;
}

// From IssueFilters.tsx
interface FilterConfig {
  status: string[];
  labels: string[];
  assignees: string[];
  priority: string[];
  createdBy?: string[];
  dateRange?: { from?: Date; to?: Date };
}

// From IssueTimeline.tsx
interface TimelineEvent {
  id: string;
  type: 'created' | 'commented' | 'closed' | 'reopened' | 'labeled' | 'unlabeled' | 'assigned' | 'unassigned' | 'milestone_changed' | 'status_changed';
  actor: User;
  createdAt: Date;
  description: string;
  metadata?: Record<string, any>;
}
```

## Styling

All components use **Tailwind CSS** for styling. Make sure Tailwind CSS is configured in your project:

```json
{
  "tailwindConfig": {
    "content": [
      "./src/**/*.{js,ts,jsx,tsx}"
    ]
  }
}
```

## Features Across Components

### Loading States
All data-heavy components include skeleton loaders and loading spinners:
```tsx
{isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />}
```

### Error Handling
Error states with user-friendly messages:
```tsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
    {error}
  </div>
)}
```

### Empty States
Contextual empty state messaging:
```tsx
{items.length === 0 && (
  <div className="text-center py-8 text-gray-500">
    <p>No items to display</p>
  </div>
)}
```

### Responsive Design
All components are responsive and work across different screen sizes using Tailwind's responsive utilities.

### Accessibility
- Proper semantic HTML
- ARIA labels where appropriate
- Keyboard navigation support
- Focus states

## Common Patterns

### Controlled Components
Components can be controlled via props:

```tsx
const [filters, setFilters] = useState<FilterConfig>({
  status: [],
  labels: [],
  assignees: [],
  priority: [],
});

<IssueFilters 
  activeFilters={filters}
  onFiltersChange={setFilters}
/>
```

### Async Operations
Components handle async callbacks with loading states:

```tsx
const handleSubmit = async (data: IssueFormData) => {
  // API call
  await api.createIssue(data);
};

<IssueForm onSubmit={handleSubmit} />
```

### Event Handling
Rich event callbacks for user interactions:

```tsx
<IssueList 
  onIssueClick={(issue) => navigateTo(`/issues/${issue.id}`)}
  onCreateIssue={() => openCreateModal()}
/>
```

## Integration Example

Here's a complete example of integrating multiple components:

```tsx
import {
  IssueList,
  IssueDetail,
  IssueForm,
  IssueFilters,
  type FilterConfig,
  type Issue,
} from '@/components/issues';

export function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filters, setFilters] = useState<FilterConfig>({
    status: [],
    labels: [],
    assignees: [],
    priority: [],
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateIssue = async (data: any) => {
    const newIssue = await api.createIssue(data);
    setIssues([newIssue, ...issues]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex gap-4">
      {/* Filters sidebar */}
      <IssueFilters 
        activeFilters={filters}
        onFiltersChange={setFilters}
        availableLabels={labels}
        availableUsers={users}
        compact={true}
      />

      {/* Main content */}
      <div className="flex-grow">
        {/* List */}
        <IssueList 
          issues={issues}
          onIssueClick={setSelectedIssue}
          onCreateIssue={() => setIsCreateModalOpen(true)}
          selectedFilters={filters}
        />

        {/* Detail panel */}
        {selectedIssue && (
          <IssueDetail issue={selectedIssue} />
        )}
      </div>

      {/* Create modal */}
      {isCreateModalOpen && (
        <IssueForm 
          onSubmit={handleCreateIssue}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

1. **Pagination**: IssueList implements pagination to handle large datasets
2. **Memoization**: Components use `useMemo` for expensive computations
3. **Lazy Loading**: Consider lazy loading timeline events and comments
4. **Virtual Lists**: For very large lists, consider implementing virtual scrolling

## Testing

Example test setup:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueForm } from '@/components/issues';

describe('IssueForm', () => {
  it('submits form with valid data', async () => {
    const handleSubmit = jest.fn();
    render(<IssueForm onSubmit={handleSubmit} />);
    
    await userEvent.type(screen.getByPlaceholderText(/Title/i), 'Test Issue');
    await userEvent.click(screen.getByText(/Create/i));
    
    expect(handleSubmit).toHaveBeenCalled();
  });
});
```

## Security

- Input validation on all form components
- XSS protection through React's built-in escaping
- CSRF token support in async operations (implement in parent)
- Sanitization of user-generated content recommended

## Customization

Components are designed to be customizable:

1. **Class Names**: Pass `className` prop to override styles
2. **Compact Mode**: Use `compact` prop for alternative layouts
3. **Custom Icons**: Replace SVG icons as needed
4. **Color Schemes**: Customize Tailwind colors via configuration

## Dependencies

- React 18+
- TypeScript 4.5+
- Tailwind CSS 3+

## License

MIT

## Contributing

When extending these components:

1. Maintain TypeScript strict mode compliance
2. Add JSDoc comments to all exports
3. Include loading, error, and empty states
4. Test responsive behavior
5. Follow GitHub-like patterns for UI consistency
