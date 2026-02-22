import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

type Permission = 'pull' | 'triage' | 'push' | 'maintain' | 'admin';

interface Collaborator {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  permission: Permission;
}

interface CollaboratorManagerProps {
  owner: string;
  repo: string;
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({ owner, repo }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPermission, setNewPermission] = useState<Permission>('pull');
  const [addingCollaborator, setAddingCollaborator] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/collaborators`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collaborators: ${response.statusText}`);
      }

      const data = await response.json();
      setCollaborators(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      setAddingCollaborator(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/collaborators`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          permission: newPermission,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to add collaborator: ${response.statusText}`);
      }

      await fetchCollaborators();
      setNewUsername('');
      setNewPermission('pull');
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add collaborator');
    } finally {
      setAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from this repository?`)) {
      return;
    }

    try {
      setRemovingId(collaboratorId);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `/api/v1/repositories/${owner}/${repo}/collaborators/${username}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove collaborator: ${response.statusText}`);
      }

      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdatePermission = async (collaboratorId: string, username: string, newPerm: Permission) => {
    try {
      setUpdatingId(collaboratorId);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `/api/v1/repositories/${owner}/${repo}/collaborators/${username}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permission: newPerm }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update permission: ${response.statusText}`);
      }

      setCollaborators(prev =>
        prev.map(c => c.id === collaboratorId ? { ...c, permission: newPerm } : c)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permission');
    } finally {
      setUpdatingId(null);
    }
  };

  const getPermissionColor = (permission: Permission): string => {
    const colors = {
      pull: '#6e7681',
      triage: '#0969da',
      push: '#1f883d',
      maintain: '#bf8700',
      admin: '#cf222e',
    };
    return colors[permission];
  };

  const getPermissionDescription = (permission: Permission): string => {
    const descriptions = {
      pull: 'Read-only access',
      triage: 'Can manage issues and pull requests',
      push: 'Can push to the repository',
      maintain: 'Can manage repository without access to sensitive actions',
      admin: 'Full access to the repository',
    };
    return descriptions[permission];
  };

  if (loading) {
    return <LoadingSpinner message="Loading collaborators..." />;
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: 'var(--accent-blue)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    marginBottom: '16px',
  };

  const formStyle: React.CSSProperties = {
    display: 'grid',
    gap: '16px',
    marginBottom: '24px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: 'var(--text-primary)',
  };

  const collaboratorItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    marginBottom: '12px',
  };

  const avatarStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '12px',
    backgroundColor: 'var(--border-color)',
  };

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  };

  const usernameStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  };

  const emailStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  };

  const deleteButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: 'var(--accent-red)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--text-secondary)',
  };

  const badgeStyle = (permission: Permission): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: 'var(--radius)',
    backgroundColor: `${getPermissionColor(permission)}20`,
    color: getPermissionColor(permission),
    marginLeft: '8px',
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Collaborators</h1>
        <button
          style={buttonStyle}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Collaborator'}
        </button>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={() => setError(null)} />
      )}

      {showAddForm && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            Add Collaborator
          </h3>
          <form onSubmit={handleAddCollaborator} style={formStyle}>
            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                style={inputStyle}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={addingCollaborator}
              />
            </div>
            <div>
              <label style={labelStyle}>Permission</label>
              <select
                style={inputStyle}
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value as Permission)}
                disabled={addingCollaborator}
              >
                <option value="pull">Pull - {getPermissionDescription('pull')}</option>
                <option value="triage">Triage - {getPermissionDescription('triage')}</option>
                <option value="push">Push - {getPermissionDescription('push')}</option>
                <option value="maintain">Maintain - {getPermissionDescription('maintain')}</option>
                <option value="admin">Admin - {getPermissionDescription('admin')}</option>
              </select>
            </div>
            <button
              type="submit"
              style={buttonStyle}
              disabled={addingCollaborator}
            >
              {addingCollaborator ? 'Adding...' : 'Add Collaborator'}
            </button>
          </form>
        </div>
      )}

      {collaborators.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No collaborators yet</p>
          <p style={{ fontSize: '14px' }}>Add collaborators to give them access to this repository</p>
        </div>
      ) : (
        <div>
          {collaborators.map((collaborator) => (
            <div key={collaborator.id} style={collaboratorItemStyle}>
              <div style={userInfoStyle}>
                {collaborator.avatarUrl ? (
                  <img
                    src={collaborator.avatarUrl}
                    alt={collaborator.username}
                    style={avatarStyle}
                  />
                ) : (
                  <div style={avatarStyle} />
                )}
                <div>
                  <div style={usernameStyle}>
                    {collaborator.username}
                    <span style={badgeStyle(collaborator.permission)}>
                      {collaborator.permission}
                    </span>
                  </div>
                  {collaborator.email && (
                    <div style={emailStyle}>{collaborator.email}</div>
                  )}
                </div>
              </div>
              <div style={actionsStyle}>
                <select
                  style={selectStyle}
                  value={collaborator.permission}
                  onChange={(e) => handleUpdatePermission(
                    collaborator.id,
                    collaborator.username,
                    e.target.value as Permission
                  )}
                  disabled={updatingId === collaborator.id}
                >
                  <option value="pull">Pull</option>
                  <option value="triage">Triage</option>
                  <option value="push">Push</option>
                  <option value="maintain">Maintain</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  style={deleteButtonStyle}
                  onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.username)}
                  disabled={removingId === collaborator.id}
                >
                  {removingId === collaborator.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { CollaboratorManager };
