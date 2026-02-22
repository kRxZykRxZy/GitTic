# Organization Components

Comprehensive React TypeScript components for managing organizations, teams, and permissions in the platform.

## Components Overview

### 1. OrgProfile.tsx
**Purpose**: Display and edit organization profile information.

**Features**:
- View organization details (name, description, avatar, email, location, website)
- Edit profile information with validation
- Display organization metadata (repository count, member count, dates)
- Toggle between view and edit modes
- Avatar display with fallback placeholder
- Loading and error states

**API Endpoint**: 
- GET/PATCH `/api/v1/organizations/:orgname`

**Props**:
```typescript
interface OrgProfileProps {
  orgname: string;           // Organization username
  onUpdate?: (org: Organization) => void;  // Callback after successful update
}
```

**Usage**:
```tsx
import { OrgProfile } from '@/components/organizations';

<OrgProfile 
  orgname="acme-corp" 
  onUpdate={(org) => console.log('Updated:', org)}
/>
```

---

### 2. OrgMembers.tsx
**Purpose**: Manage organization members with role-based access control.

**Features**:
- List all organization members with avatars and details
- Add new members by username with role selection
- Remove members (except owners)
- Change member roles (member, admin, owner)
- Role-based permissions visualization
- Confirmation dialogs for destructive actions
- Empty state for organizations with no members

**API Endpoints**:
- GET `/api/v1/organizations/:orgname/members` - List members
- POST `/api/v1/organizations/:orgname/members` - Add member
- PATCH `/api/v1/organizations/:orgname/members/:username` - Change role
- DELETE `/api/v1/organizations/:orgname/members/:username` - Remove member

**Props**:
```typescript
interface OrgMembersProps {
  orgname: string;  // Organization username
}
```

**Member Roles**:
- `member` - Basic access
- `admin` - Administrative privileges
- `owner` - Full control (cannot be removed or role changed)

**Usage**:
```tsx
import { OrgMembers } from '@/components/organizations';

<OrgMembers orgname="acme-corp" />
```

---

### 3. TeamManager.tsx
**Purpose**: Create and manage teams within an organization.

**Features**:
- Grid display of all teams with metadata
- Create new teams with name, description, and privacy settings
- Update team privacy settings (public/private)
- Delete teams with confirmation
- Display team statistics (member count, repository count)
- Navigate to team details
- Visual privacy indicators (🌐 public, 🔒 private)
- Empty state for organizations without teams

**API Endpoints**:
- GET `/api/v1/organizations/:orgname/teams` - List teams
- POST `/api/v1/organizations/:orgname/teams` - Create team
- PATCH `/api/v1/organizations/:orgname/teams/:teamSlug` - Update team
- DELETE `/api/v1/organizations/:orgname/teams/:teamSlug` - Delete team

**Props**:
```typescript
interface TeamManagerProps {
  orgname: string;  // Organization username
}
```

**Team Privacy Levels**:
- `public` - Visible to everyone
- `private` - Only visible to organization members

**Usage**:
```tsx
import { TeamManager } from '@/components/organizations';

<TeamManager orgname="acme-corp" />
```

---

### 4. TeamPermissions.tsx
**Purpose**: Manage repository access and permissions for teams.

**Features**:
- Display all repositories assigned to a team
- Add repositories to team with permission level
- Update repository permissions (read, write, admin)
- Remove repositories from team
- Permission level explanations
- Filter available repositories (only show unassigned)
- Visual badges for private repositories
- Informative help text for permission levels

**API Endpoints**:
- GET `/api/v1/organizations/:orgname/teams/:teamSlug/repos` - List team repos
- PUT `/api/v1/organizations/:orgname/teams/:teamSlug/repos/:repoName` - Add/update repo
- DELETE `/api/v1/organizations/:orgname/teams/:teamSlug/repos/:repoName` - Remove repo
- GET `/api/v1/organizations/:orgname/repositories` - List available repos

**Props**:
```typescript
interface TeamPermissionsProps {
  orgname: string;   // Organization username
  teamSlug: string;  // Team slug identifier
}
```

**Permission Levels**:
- `read` (👁️) - Clone and pull
- `write` (✏️) - Push, manage issues and PRs
- `admin` (🔧) - Full repository control including settings

**Usage**:
```tsx
import { TeamPermissions } from '@/components/organizations';

<TeamPermissions 
  orgname="acme-corp" 
  teamSlug="frontend-team" 
/>
```

---

### 5. OrgSettings.tsx
**Purpose**: Configure organization-wide settings across multiple categories.

**Features**:
- Tabbed interface for different settings categories
- General settings (name, email, repository permissions)
- Billing information (plan, seats, billing email)
- Security settings (2FA, signed commits, SAML, IP restrictions)
- Member privileges (permissions, creation rights)
- Track unsaved changes with visual indicator
- Confirmation before saving
- Reset/discard changes functionality

**API Endpoint**:
- GET/PATCH `/api/v1/organizations/:orgname/settings`

**Props**:
```typescript
interface OrgSettingsProps {
  orgname: string;  // Organization username
}
```

**Settings Tabs**:
1. **General** - Basic organization info and repository defaults
2. **Billing** - Plan information and billing email
3. **Security** - 2FA, signed commits, SAML, IP allowlist
4. **Member Privileges** - Default permissions and creation rights

**Usage**:
```tsx
import { OrgSettings } from '@/components/organizations';

<OrgSettings orgname="acme-corp" />
```

---

## Common Features

All components share these production-ready features:

### State Management
- Loading states with spinner
- Error states with retry functionality
- Empty states with helpful messages
- Optimistic UI updates where appropriate

### Error Handling
- Graceful API error handling
- User-friendly error messages
- Specific error messages for common scenarios (404, 409, etc.)
- Error recovery with retry buttons

### UX Best Practices
- Confirmation dialogs for destructive actions
- Disabled states during async operations
- Visual feedback for user actions
- Consistent styling following platform design system
- Accessible HTML with proper ARIA labels
- Keyboard navigation support (Modal ESC key)

### Authentication
- JWT token from localStorage automatically included
- Unauthorized access handled via API client
- Token retrieved using `STORAGE_KEYS.ACCESS_TOKEN`

### TypeScript
- Full type safety with interfaces
- Type-safe API responses
- Proper typing for all props and state
- No `any` types used

---

## Styling

All components use inline styles with CSS variables for theming:

**Available CSS Variables**:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary` - Background colors
- `--text-primary`, `--text-secondary`, `--text-muted` - Text colors
- `--border-color` - Border color
- `--accent-blue`, `--accent-red` - Accent colors
- `--radius` - Border radius

Components also use global CSS classes:
- `.btn` - Base button style
- `.btn-primary` - Primary button variant

---

## Installation & Setup

### Prerequisites
```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "sweetalert2": "^11.0.0"
}
```

### Import
```typescript
// Import individual components
import { OrgProfile, OrgMembers, TeamManager, TeamPermissions, OrgSettings } 
  from '@/components/organizations';

// Or import all
import * as OrgComponents from '@/components/organizations';
```

---

## API Response Format

All components expect API responses in this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
```

The API client (`api-client.ts`) automatically wraps responses if they're not in this format.

---

## Example Integration

### Complete Organization Dashboard Page
```tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  OrgProfile, 
  OrgMembers, 
  TeamManager, 
  OrgSettings 
} from '@/components/organizations';

export const OrganizationPage: React.FC = () => {
  const { orgname } = useParams<{ orgname: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container">
      <div className="tabs">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('members')}>Members</button>
        <button onClick={() => setActiveTab('teams')}>Teams</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {activeTab === 'overview' && <OrgProfile orgname={orgname!} />}
      {activeTab === 'members' && <OrgMembers orgname={orgname!} />}
      {activeTab === 'teams' && <TeamManager orgname={orgname!} />}
      {activeTab === 'settings' && <OrgSettings orgname={orgname!} />}
    </div>
  );
};
```

### Team Detail Page with Permissions
```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { TeamPermissions } from '@/components/organizations';

export const TeamDetailPage: React.FC = () => {
  const { orgname, teamSlug } = useParams<{ orgname: string; teamSlug: string }>();

  return (
    <div className="container">
      <h1>Team Permissions</h1>
      <TeamPermissions orgname={orgname!} teamSlug={teamSlug!} />
    </div>
  );
};
```

---

## Testing

### Component Testing Example
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgMembers } from './OrgMembers';

test('adds new member', async () => {
  render(<OrgMembers orgname="test-org" />);
  
  await waitFor(() => {
    expect(screen.getByText(/Members/i)).toBeInTheDocument();
  });

  const addButton = screen.getByRole('button', { name: /Add Member/i });
  await userEvent.click(addButton);

  // Fill form and submit...
});
```

---

## Security Considerations

1. **Authentication**: All API calls include JWT token from localStorage
2. **Authorization**: Server-side validation of user permissions required
3. **Input Validation**: Client-side validation for user inputs
4. **XSS Prevention**: All user inputs are escaped by React
5. **CSRF Protection**: Token-based authentication prevents CSRF
6. **Role-Based Access**: Owner role cannot be changed or removed

---

## Performance Optimizations

- **Lazy Loading**: Components can be lazy-loaded with React.lazy()
- **Memoization**: Add React.memo() for performance if needed
- **Debouncing**: Consider debouncing for search/filter inputs
- **Pagination**: Large lists should use pagination (built into API)
- **Caching**: Consider adding React Query for advanced caching

---

## Troubleshooting

### Common Issues

**API 401 Unauthorized**:
- Check if JWT token exists in localStorage
- Verify token hasn't expired
- Ensure Authorization header is set correctly

**Components not rendering**:
- Verify all dependencies are installed
- Check console for TypeScript errors
- Ensure API endpoints are accessible

**Styling issues**:
- Verify CSS variables are defined in global styles
- Check that `.btn` and `.btn-primary` classes exist
- Ensure theme provider is wrapping the app

---

## Future Enhancements

Potential improvements for future iterations:

1. **Search & Filtering**: Add search for members and teams
2. **Sorting**: Multi-column sorting for tables
3. **Bulk Actions**: Select multiple items for bulk operations
4. **Export**: Export member/team lists to CSV
5. **Activity Log**: Display organization activity timeline
6. **Webhooks**: Configure organization webhooks
7. **Audit Logs**: View security and access logs
8. **Advanced Permissions**: More granular permission levels
9. **Team Sync**: LDAP/AD team synchronization
10. **Analytics**: Organization usage analytics dashboard

---

## Contributing

When modifying these components:

1. Maintain TypeScript type safety
2. Follow existing code style and patterns
3. Update this README with any new features
4. Add proper error handling
5. Include loading and empty states
6. Test with various organization sizes
7. Ensure mobile responsiveness
8. Maintain accessibility standards

---

## License

Part of the platform codebase - internal use only.

---

## Support

For issues or questions, contact the platform team or create an issue in the project repository.
