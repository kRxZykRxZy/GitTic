import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface RepositorySettings {
  name: string;
  description: string;
  visibility: 'public' | 'private' | 'internal';
  defaultBranch: string;
  features: {
    hasIssues: boolean;
    hasProjects: boolean;
    hasWiki: boolean;
    hasDiscussions: boolean;
  };
  mergeOptions: {
    allowMergeCommit: boolean;
    allowSquashMerge: boolean;
    allowRebaseMerge: boolean;
    deleteBranchOnMerge: boolean;
  };
}

interface RepositorySettingsProps {
  owner: string;
  repo: string;
}

const RepositorySettings: React.FC<RepositorySettingsProps> = ({ owner, repo }) => {
  const [settings, setSettings] = useState<RepositorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();
      setSettings(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`);
      }

      setSuccessMessage('Settings updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = <K extends keyof RepositorySettings>(
    key: K,
    value: RepositorySettings[K]
  ) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateFeatures = (key: keyof RepositorySettings['features'], value: boolean) => {
    setSettings(prev => prev ? {
      ...prev,
      features: { ...prev.features, [key]: value }
    } : null);
  };

  const updateMergeOptions = (key: keyof RepositorySettings['mergeOptions'], value: boolean) => {
    setSettings(prev => prev ? {
      ...prev,
      mergeOptions: { ...prev.mergeOptions, [key]: value }
    } : null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading repository settings..." />;
  }

  if (error && !settings) {
    return <ErrorMessage message={error} onRetry={fetchSettings} />;
  }

  if (!settings) {
    return <ErrorMessage message="No settings found" />;
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    marginBottom: '20px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--text-primary)',
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: 'var(--text-primary)',
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
    resize: 'vertical',
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const checkboxStyle: React.CSSProperties = {
    marginRight: '8px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: 'var(--accent-blue)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.6 : 1,
  };

  const alertStyle = (type: 'success' | 'error'): React.CSSProperties => ({
    padding: '12px 16px',
    marginBottom: '16px',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    backgroundColor: type === 'success' ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
    color: type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
    border: `1px solid ${type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
  });

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        Repository Settings
      </h1>

      {successMessage && (
        <div style={alertStyle('success')}>{successMessage}</div>
      )}

      {error && (
        <div style={alertStyle('error')}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* General Settings */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>General</h2>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Repository Name</label>
            <input
              type="text"
              style={inputStyle}
              value={settings.name}
              onChange={(e) => updateSettings('name', e.target.value)}
              disabled
            />
            <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Repository name cannot be changed
            </small>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={textareaStyle}
              value={settings.description}
              onChange={(e) => updateSettings('description', e.target.value)}
              placeholder="A brief description of your repository"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Visibility</label>
            <select
              style={inputStyle}
              value={settings.visibility}
              onChange={(e) => updateSettings('visibility', e.target.value as RepositorySettings['visibility'])}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="internal">Internal</option>
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Default Branch</label>
            <input
              type="text"
              style={inputStyle}
              value={settings.defaultBranch}
              onChange={(e) => updateSettings('defaultBranch', e.target.value)}
              placeholder="main"
            />
          </div>
        </div>

        {/* Features */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Features</h2>
          
          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="hasIssues"
              style={checkboxStyle}
              checked={settings.features.hasIssues}
              onChange={(e) => updateFeatures('hasIssues', e.target.checked)}
            />
            <label htmlFor="hasIssues" style={checkboxLabelStyle}>
              Issues - Track and manage issues
            </label>
          </div>

          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="hasProjects"
              style={checkboxStyle}
              checked={settings.features.hasProjects}
              onChange={(e) => updateFeatures('hasProjects', e.target.checked)}
            />
            <label htmlFor="hasProjects" style={checkboxLabelStyle}>
              Projects - Organize work with project boards
            </label>
          </div>

          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="hasWiki"
              style={checkboxStyle}
              checked={settings.features.hasWiki}
              onChange={(e) => updateFeatures('hasWiki', e.target.checked)}
            />
            <label htmlFor="hasWiki" style={checkboxLabelStyle}>
              Wiki - Create and maintain documentation
            </label>
          </div>

          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="hasDiscussions"
              style={checkboxStyle}
              checked={settings.features.hasDiscussions}
              onChange={(e) => updateFeatures('hasDiscussions', e.target.checked)}
            />
            <label htmlFor="hasDiscussions" style={checkboxLabelStyle}>
              Discussions - Community discussions and Q&A
            </label>
          </div>
        </div>

        {/* Merge Options */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Pull Request Merge Options</h2>
          
          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="allowMergeCommit"
              style={checkboxStyle}
              checked={settings.mergeOptions.allowMergeCommit}
              onChange={(e) => updateMergeOptions('allowMergeCommit', e.target.checked)}
            />
            <label htmlFor="allowMergeCommit" style={checkboxLabelStyle}>
              Allow merge commits
            </label>
          </div>

          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="allowSquashMerge"
              style={checkboxStyle}
              checked={settings.mergeOptions.allowSquashMerge}
              onChange={(e) => updateMergeOptions('allowSquashMerge', e.target.checked)}
            />
            <label htmlFor="allowSquashMerge" style={checkboxLabelStyle}>
              Allow squash merging
            </label>
          </div>

          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="allowRebaseMerge"
              style={checkboxStyle}
              checked={settings.mergeOptions.allowRebaseMerge}
              onChange={(e) => updateMergeOptions('allowRebaseMerge', e.target.checked)}
            />
            <label htmlFor="allowRebaseMerge" style={checkboxLabelStyle}>
              Allow rebase merging
            </label>
          </div>

          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="deleteBranchOnMerge"
              style={checkboxStyle}
              checked={settings.mergeOptions.deleteBranchOnMerge}
              onChange={(e) => updateMergeOptions('deleteBranchOnMerge', e.target.checked)}
            />
            <label htmlFor="deleteBranchOnMerge" style={checkboxLabelStyle}>
              Automatically delete head branches after merge
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{
          ...sectionStyle,
          borderColor: 'var(--accent-red)',
          backgroundColor: 'rgba(255, 0, 0, 0.05)',
        }}>
          <h2 style={{...sectionTitleStyle, color: 'var(--accent-red)'}}>Danger Zone</h2>
          
          <div style={formGroupStyle}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--accent-red)' }}>Archive Repository</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 8px 0' }}>
                Mark this repository as archived and read-only.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to archive this repository? It will become read-only.')) {
                    // TODO: Implement archive
                    alert('Archive functionality coming soon');
                  }
                }}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'var(--accent-yellow)',
                  color: 'var(--text-primary)',
                }}
              >
                Archive Repository
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--accent-red)' }}>Delete Repository</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 8px 0' }}>
              Once deleted, it will be gone forever. Please be certain.
            </p>
            <button
              type="button"
              onClick={() => {
                const confirmText = prompt(`Please type "${owner}/${repo}" to confirm deletion:`);
                if (confirmText === `${owner}/${repo}`) {
                  // TODO: Implement delete
                  alert('Delete functionality coming soon');
                } else if (confirmText !== null) {
                  alert('Repository name did not match. Deletion cancelled.');
                }
              }}
              style={{
                ...buttonStyle,
                backgroundColor: 'var(--accent-red)',
              }}
            >
              Delete Repository
            </button>
          </div>
        </div>

        <button type="submit" style={buttonStyle} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export { RepositorySettings };
