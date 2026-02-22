# Component Structure & Architecture

## Directory Layout

```
src/components/issues/
├── IssueList.tsx           # Main list view with filtering & sorting
├── IssueCard.tsx           # Compact card representation
├── IssueDetail.tsx         # Full-page detail view
├── IssueForm.tsx           # Create/edit form
├── IssueComments.tsx       # Comment thread
├── IssueLabels.tsx         # Label management
├── IssueMilestone.tsx      # Milestone selector
├── IssueAssignees.tsx      # Assignee management
├── IssueFilters.tsx        # Advanced filters sidebar
├── IssueTimeline.tsx       # Activity timeline
├── index.ts                # Exports
├── README.md               # Full documentation
└── COMPONENT_STRUCTURE.md  # This file
```

## Component Hierarchy

```
Page Level
    │
    ├─ IssueList (primary content)
    │   └─ IssueCard (individual items)
    │
    ├─ IssueFilters (sidebar)
    │
    └─ IssueDetail (detail panel/modal)
        ├─ IssueForm (when editing)
        ├─ IssueComments (comments section)
        ├─ IssueTimeline (activity log)
        ├─ IssueLabels
        ├─ IssueMilestone
        └─ IssueAssignees
```

## Data Flow

### Creating/Editing Issues
```
IssueForm (form input)
    ↓
onSubmit callback
    ↓
API call
    ↓
Update issue state
    ↓
IssueList/IssueDetail update
```

### Filtering Issues
```
IssueFilters (user input)
    ↓
onFiltersChange callback
    ↓
Filter state updated
    ↓
IssueList recalculates filtered issues
```

### Managing Comments
```
IssueComments (input)
    ↓
onCommentSubmit callback
    ↓
API call
    ↓
Update comments array
    ↓
IssueComments re-renders
```

## Type System

### Root Types (from IssueList.tsx)
All shared data types are exported from `IssueList.tsx`:
- `Issue` - Main issue entity
- `Label` - Label entity
- `User` - User entity
- `Milestone` - Milestone entity

### Component-Specific Types
Each component may have additional interfaces:
- `IssueForm` exports `IssueFormData`
- `IssueComments` exports `Comment`
- `IssueFilters` exports `FilterConfig`
- `IssueTimeline` exports `TimelineEvent`

## State Management Pattern

All components use React hooks for state:
- `useState` for local state
- `useMemo` for computed values
- Props callbacks for parent communication
- Controlled components where appropriate

### Example Pattern
```tsx
// Parent component
const [issues, setIssues] = useState<Issue[]>([]);
const [filters, setFilters] = useState<FilterConfig>({...});

// Child receives state and callbacks
<IssueList 
  issues={issues}
  selectedFilters={filters}
  onIssueClick={handleClick}
/>
```

## Props Patterns

### Common Props Pattern
```tsx
interface ComponentProps {
  // Required data
  data: DataType[];
  
  // Callbacks
  onAction: (item: DataType) => void;
  onDelete?: (id: string) => void;
  
  // States
  isLoading?: boolean;
  error?: string | null;
  
  // Options
  compact?: boolean;
  canEdit?: boolean;
  
  // Styling
  className?: string;
}
```

## Loading & Error States

### Three-State Pattern
Every async component follows this pattern:

```tsx
// Loading state
if (isLoading) return <LoadingSkeleton />;

// Error state
if (error) return <ErrorMessage />;

// Success/empty state
if (data.length === 0) return <EmptyState />;

// Render content
return <Content />;
```

## Styling Architecture

### Tailwind CSS Classes
- Used throughout all components
- Responsive design built-in
- Consistent color palette
- Standard spacing scale

### Color Scheme
- **Primary**: Blue (blue-600)
- **Success**: Green (green-600)
- **Warning**: Yellow (orange-600)
- **Error**: Red (red-600)
- **Neutral**: Gray (gray-600)

## Event Handling

### Async Operations
Components handle async callbacks with proper loading/error states:

```tsx
const handleSubmit = async (data) => {
  setIsSubmitting(true);
  try {
    await onSubmit(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

## Performance Optimizations

### Memoization
- `useMemo` for filtered/sorted lists
- Expensive computations are memoized
- Dependencies carefully managed

### Pagination
- IssueList includes pagination
- Reduces rendered items
- Improves performance with large datasets

### Conditional Rendering
- Components only render visible sections
- Dropdowns close when not needed
- Async content only loads when needed

## Browser Compatibility

All components use:
- ES2020+ JavaScript features
- CSS Grid & Flexbox
- Modern React patterns
- Tailwind CSS 3.0+

## Code Quality

### TypeScript
- Strict mode enabled
- Full type coverage
- Exported interfaces

### Documentation
- JSDoc comments on exports
- Component examples
- Props documentation
- Type definitions

### Testing Considerations
- Pure component logic
- No external dependencies required
- Props-based testing strategy
- Easy to mock callbacks

## Extensibility

### Common Extensions

#### Add Custom Styling
```tsx
<IssueCard 
  issue={issue}
  className="custom-shadow rounded-xl"
/>
```

#### Add Custom Icons
Replace SVG icons in component files

#### Add Custom Fields
Extend `Issue` interface and update components

#### Add Custom Filters
Extend `FilterConfig` in IssueFilters

## Security Considerations

### Input Validation
- Form validation in IssueForm
- Search term sanitization
- URL parameter validation

### XSS Protection
- React's built-in escaping
- No dangerouslySetInnerHTML
- Sanitize user content recommendation

### CSRF Protection
- Implement token in parent component
- Pass to API calls
- Not directly in components

## Accessibility

### Semantic HTML
- `<button>`, `<label>`, `<form>` elements
- Proper heading hierarchy
- ARIA labels where needed

### Keyboard Navigation
- Tab order
- Enter to submit
- Escape to close

### Screen Readers
- Alt text on images
- Label associations
- Semantic elements

## Migration Guide

### From Previous Version
If updating from older component versions:

1. Check type definitions (may have changed)
2. Update callback signatures
3. Update prop names
4. Update Tailwind classes if customized

## Best Practices

### When Using Components
1. Always provide required props
2. Handle async callbacks properly
3. Implement proper error boundaries
4. Test with different data shapes
5. Consider performance with large datasets

### When Extending
1. Maintain TypeScript compliance
2. Add JSDoc comments
3. Keep Tailwind styling consistent
4. Test all state combinations
5. Document new props/behavior
