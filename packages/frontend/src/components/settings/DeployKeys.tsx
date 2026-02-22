import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface DeployKey {
  id: string;
  title: string;
  key: string;
  readOnly: boolean;
  createdAt: string;
  verified: boolean;
}

interface DeployKeysProps {
  owner: string;
  repo: string;
}

const DeployKeys: React.FC<DeployKeysProps> = ({ owner, repo }) => {
  const [keys, setKeys] = useState<DeployKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [newKey, setNewKey] = useState({
    title: '',
    key: '',
    readOnly: true,
  });

  const fetchDeployKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch deploy keys: ${response.statusText}`);
      }

      const data = await response.json();
      setKeys(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deploy keys');
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchDeployKeys();
  }, [fetchDeployKeys]);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.title.trim() || !newKey.key.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKey),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to add deploy key: ${response.statusText}`);
      }

      await fetchDeployKeys();
      setNewKey({ title: '', key: '', readOnly: true });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add deploy key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the deploy key "${title}"?`)) {
      return;
    }

    try {
      setDeletingId(keyId);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `/api/v1/repositories/${owner}/${repo}/keys/${keyId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete deploy key: ${response.statusText}`);
      }

      setKeys(prev => prev.filter(k => k.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deploy key');
    } finally {
      setDeletingId(null);
    }
  };

  const extractKeyFingerprint = (key: string): string => {
    const parts = key.split(' ');
    if (parts.length < 2) return 'Invalid key format';
    const keyData = parts[1];
    return `${keyData.substring(0, 16)}...${keyData.substring(keyData.length - 16)}`;
  };

  const getKeyType = (key: string): string => {
    if (key.startsWith('ssh-rsa')) return 'RSA';
    if (key.startsWith('ssh-ed25519')) return 'Ed25519';
    if (key.startsWith('ecdsa-sha2')) return 'ECDSA';
    return 'Unknown';
  };

  if (loading) {
    return <LoadingSpinner message="Loading deploy keys..." />;
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

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '100px',
    fontFamily: 'monospace',
    resize: 'vertical',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: 'var(--text-primary)',
  };

  const keyItemStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    marginBottom: '12px',
  };

  const keyHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  };

  const keyTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  };

  const keyMetaStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  };

  const keyFingerprintStyle: React.CSSProperties = {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-primary)',
    padding: '8px',
    borderRadius: 'var(--radius)',
    marginTop: '8px',
    wordBreak: 'break-all',
  };

  const badgeStyle = (type: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: 'var(--radius)',
    backgroundColor: type === 'read-only' ? 'var(--accent-blue-light)' : 'var(--accent-green-light)',
    color: type === 'read-only' ? 'var(--accent-blue)' : 'var(--accent-green)',
    marginLeft: '8px',
  });

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

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  };

  const checkboxStyle: React.CSSProperties = {
    marginRight: '8px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  };

  const infoBoxStyle: React.CSSProperties = {
    backgroundColor: 'var(--accent-blue-light)',
    border: '1px solid var(--accent-blue)',
    borderRadius: 'var(--radius)',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    color: 'var(--text-primary)',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Deploy Keys</h1>
        <button
          style={buttonStyle}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Deploy Key'}
        </button>
      </div>

      <div style={infoBoxStyle}>
        <strong>ℹ️ About Deploy Keys:</strong> Deploy keys are SSH keys that grant access to a single repository. 
        They're useful for deployment scripts and CI/CD systems that need to clone or pull from your repository.
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={() => setError(null)} />
      )}

      {showAddForm && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            Add Deploy Key
          </h3>
          <form onSubmit={handleAddKey} style={formStyle}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                style={inputStyle}
                value={newKey.title}
                onChange={(e) => setNewKey(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Deploy Key"
                required
                disabled={creating}
              />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                A descriptive name for this key
              </small>
            </div>

            <div>
              <label style={labelStyle}>Key</label>
              <textarea
                style={textareaStyle}
                value={newKey.key}
                onChange={(e) => setNewKey(prev => ({ ...prev, key: e.target.value }))}
                placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ..."
                required
                disabled={creating}
              />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Paste your SSH public key here (starts with ssh-rsa, ssh-ed25519, or ecdsa-sha2)
              </small>
            </div>

            <div>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={newKey.readOnly}
                  onChange={(e) => setNewKey(prev => ({ ...prev, readOnly: e.target.checked }))}
                  disabled={creating}
                />
                Read-only access
              </label>
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '26px' }}>
                If checked, this key can only read from the repository, not push to it
              </small>
            </div>

            <button
              type="submit"
              style={buttonStyle}
              disabled={creating}
            >
              {creating ? 'Adding...' : 'Add Key'}
            </button>
          </form>
        </div>
      )}

      {keys.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No deploy keys</p>
          <p style={{ fontSize: '14px' }}>Deploy keys allow read or read/write access to this repository</p>
        </div>
      ) : (
        <div>
          {keys.map((key) => (
            <div key={key.id} style={keyItemStyle}>
              <div style={keyHeaderStyle}>
                <div style={{ flex: 1 }}>
                  <div style={keyTitleStyle}>
                    {key.title}
                    <span style={badgeStyle(key.readOnly ? 'read-only' : 'read-write')}>
                      {key.readOnly ? '🔒 Read-only' : '🔓 Read/Write'}
                    </span>
                    {key.verified && (
                      <span style={badgeStyle('verified')}>✓ Verified</span>
                    )}
                  </div>
                  <div style={keyMetaStyle}>
                    {getKeyType(key.key)} • Added {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                  <div style={keyFingerprintStyle}>
                    {extractKeyFingerprint(key.key)}
                  </div>
                </div>
                <button
                  style={deleteButtonStyle}
                  onClick={() => handleDeleteKey(key.id, key.title)}
                  disabled={deletingId === key.id}
                >
                  {deletingId === key.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { DeployKeys };
