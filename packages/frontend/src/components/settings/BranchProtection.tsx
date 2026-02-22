import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface BranchProtectionRule {
  id: string;
  pattern: string;
  requiredReviews: {
    enabled: boolean;
    count: number;
    dismissStaleReviews: boolean;
    requireCodeOwnerReviews: boolean;
  };
  requiredStatusChecks: {
    enabled: boolean;
    strict: boolean;
    contexts: string[];
  };
  enforceAdmins: boolean;
  requireSignedCommits: boolean;
  requireLinearHistory: boolean;
  allowForcePushes: boolean;
  allowDeletions: boolean;
  createdAt: string;
}

interface BranchProtectionProps {
  owner: string;
  repo: string;
}

const BranchProtection: React.FC<BranchProtectionProps> = ({ owner, repo }) => {
  const [rules, setRules] = useState<BranchProtectionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<BranchProtectionRule, 'id' | 'createdAt'>>({
    pattern: '',
    requiredReviews: {
      enabled: false,
      count: 1,
      dismissStaleReviews: false,
      requireCodeOwnerReviews: false,
    },
    requiredStatusChecks: {
      enabled: false,
      strict: false,
      contexts: [],
    },
    enforceAdmins: false,
    requireSignedCommits: false,
    requireLinearHistory: false,
    allowForcePushes: false,
    allowDeletions: false,
  });

  const [newStatusCheck, setNewStatusCheck] = useState('');

  const fetchBranchProtectionRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/branches/protection`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch branch protection rules: ${response.statusText}`);
      }

      const data = await response.json();
      setRules(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branch protection rules');
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchBranchProtectionRules();
  }, [fetchBranchProtectionRules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pattern.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const url = editingId
        ? `/api/v1/repositories/${owner}/${repo}/branches/protection/${editingId}`
        : `/api/v1/repositories/${owner}/${repo}/branches/protection`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to save rule: ${response.statusText}`);
      }

      await fetchBranchProtectionRules();
      resetForm();
      setShowAddForm(false);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branch protection rule');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (rule: BranchProtectionRule) => {
    setFormData({
      pattern: rule.pattern,
      requiredReviews: rule.requiredReviews,
      requiredStatusChecks: rule.requiredStatusChecks,
      enforceAdmins: rule.enforceAdmins,
      requireSignedCommits: rule.requireSignedCommits,
      requireLinearHistory: rule.requireLinearHistory,
      allowForcePushes: rule.allowForcePushes,
      allowDeletions: rule.allowDeletions,
    });
    setEditingId(rule.id);
    setShowAddForm(true);
  };

  const handleDelete = async (ruleId: string, pattern: string) => {
    if (!confirm(`Are you sure you want to delete the protection rule for "${pattern}"?`)) {
      return;
    }

    try {
      setDeletingId(ruleId);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `/api/v1/repositories/${owner}/${repo}/branches/protection/${ruleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete rule: ${response.statusText}`);
      }

      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch protection rule');
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      pattern: '',
      requiredReviews: {
        enabled: false,
        count: 1,
        dismissStaleReviews: false,
        requireCodeOwnerReviews: false,
      },
      requiredStatusChecks: {
        enabled: false,
        strict: false,
        contexts: [],
      },
      enforceAdmins: false,
      requireSignedCommits: false,
      requireLinearHistory: false,
      allowForcePushes: false,
      allowDeletions: false,
    });
    setNewStatusCheck('');
  };

  const addStatusCheck = () => {
    if (newStatusCheck.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredStatusChecks: {
          ...prev.requiredStatusChecks,
          contexts: [...prev.requiredStatusChecks.contexts, newStatusCheck.trim()],
        },
      }));
      setNewStatusCheck('');
    }
  };

  const removeStatusCheck = (context: string) => {
    setFormData(prev => ({
      ...prev,
      requiredStatusChecks: {
        ...prev.requiredStatusChecks,
        contexts: prev.requiredStatusChecks.contexts.filter(c => c !== context),
      },
    }));
  };

  if (loading) {
    return <LoadingSpinner message="Loading branch protection rules..." />;
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
    gap: '20px',
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

  const sectionStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'var(--text-primary)',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    marginBottom: '12px',
  };

  const checkboxStyle: React.CSSProperties = {
    marginRight: '8px',
    marginTop: '2px',
    minWidth: '18px',
    height: '18px',
    cursor: 'pointer',
  };

  const ruleItemStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    marginBottom: '12px',
  };

  const ruleHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  };

  const patternStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
  };

  const ruleDetailsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
    marginTop: '12px',
  };

  const ruleDetailItemStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const editButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: 'var(--accent-blue)',
    border: 'none',
    borderRadius: 'var(--radius)',
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

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--accent-green-light)',
    color: 'var(--accent-green)',
    marginRight: '6px',
    marginBottom: '6px',
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

  const statusCheckListStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  };

  const statusCheckBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    gap: '6px',
  };

  const removeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--accent-red)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Branch Protection Rules</h1>
        <button
          style={buttonStyle}
          onClick={() => {
            if (showAddForm && editingId) {
              resetForm();
              setEditingId(null);
            }
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      <div style={infoBoxStyle}>
        <strong>ℹ️ About Branch Protection:</strong> Branch protection rules help ensure code quality 
        by requiring reviews, status checks, and other conditions before merging changes.
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={() => setError(null)} />
      )}

      {showAddForm && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {editingId ? 'Edit Branch Protection Rule' : 'Add Branch Protection Rule'}
          </h3>
          <form onSubmit={handleSubmit} style={formStyle}>
            <div>
              <label style={labelStyle}>Branch Name Pattern</label>
              <input
                type="text"
                style={inputStyle}
                value={formData.pattern}
                onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                placeholder="main, develop, release/*, etc."
                required
                disabled={creating}
              />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Use * as a wildcard (e.g., release/* matches release/v1, release/v2)
              </small>
            </div>

            {/* Required Reviews */}
            <div style={sectionStyle}>
              <h4 style={sectionTitleStyle}>Pull Request Reviews</h4>
              
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={formData.requiredReviews.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requiredReviews: { ...prev.requiredReviews, enabled: e.target.checked }
                  }))}
                  disabled={creating}
                />
                <div>
                  <div>Require pull request reviews before merging</div>
                  <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Require at least one approval before merging
                  </small>
                </div>
              </label>

              {formData.requiredReviews.enabled && (
                <>
                  <div style={{ marginLeft: '26px', marginBottom: '12px' }}>
                    <label style={labelStyle}>Required Approvals</label>
                    <input
                      type="number"
                      style={{ ...inputStyle, width: '100px' }}
                      min="1"
                      max="6"
                      value={formData.requiredReviews.count}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        requiredReviews: { ...prev.requiredReviews, count: parseInt(e.target.value) || 1 }
                      }))}
                      disabled={creating}
                    />
                  </div>

                  <label style={{ ...checkboxLabelStyle, marginLeft: '26px' }}>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.requiredReviews.dismissStaleReviews}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        requiredReviews: { ...prev.requiredReviews, dismissStaleReviews: e.target.checked }
                      }))}
                      disabled={creating}
                    />
                    Dismiss stale reviews when new commits are pushed
                  </label>

                  <label style={{ ...checkboxLabelStyle, marginLeft: '26px' }}>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.requiredReviews.requireCodeOwnerReviews}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        requiredReviews: { ...prev.requiredReviews, requireCodeOwnerReviews: e.target.checked }
                      }))}
                      disabled={creating}
                    />
                    Require review from code owners
                  </label>
                </>
              )}
            </div>

            {/* Required Status Checks */}
            <div style={sectionStyle}>
              <h4 style={sectionTitleStyle}>Status Checks</h4>
              
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={formData.requiredStatusChecks.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requiredStatusChecks: { ...prev.requiredStatusChecks, enabled: e.target.checked }
                  }))}
                  disabled={creating}
                />
                <div>
                  <div>Require status checks to pass before merging</div>
                  <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Require all CI/CD checks to pass
                  </small>
                </div>
              </label>

              {formData.requiredStatusChecks.enabled && (
                <>
                  <label style={{ ...checkboxLabelStyle, marginLeft: '26px' }}>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.requiredStatusChecks.strict}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        requiredStatusChecks: { ...prev.requiredStatusChecks, strict: e.target.checked }
                      }))}
                      disabled={creating}
                    />
                    Require branches to be up to date before merging
                  </label>

                  <div style={{ marginLeft: '26px' }}>
                    <label style={labelStyle}>Required Status Checks</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        style={{ ...inputStyle, flex: 1 }}
                        value={newStatusCheck}
                        onChange={(e) => setNewStatusCheck(e.target.value)}
                        placeholder="e.g., ci/build, ci/test"
                        disabled={creating}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addStatusCheck();
                          }
                        }}
                      />
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={addStatusCheck}
                        disabled={creating || !newStatusCheck.trim()}
                      >
                        Add
                      </button>
                    </div>
                    {formData.requiredStatusChecks.contexts.length > 0 && (
                      <div style={statusCheckListStyle}>
                        {formData.requiredStatusChecks.contexts.map(context => (
                          <span key={context} style={statusCheckBadgeStyle}>
                            {context}
                            <button
                              type="button"
                              style={removeButtonStyle}
                              onClick={() => removeStatusCheck(context)}
                              disabled={creating}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Additional Rules */}
            <div style={sectionStyle}>
              <h4 style={sectionTitleStyle}>Additional Rules</h4>
              
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={formData.requireSignedCommits}
                  onChange={(e) => setFormData(prev => ({ ...prev, requireSignedCommits: e.target.checked }))}
                  disabled={creating}
                />
                Require signed commits
              </label>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={formData.requireLinearHistory}
                  onChange={(e) => setFormData(prev => ({ ...prev, requireLinearHistory: e.target.checked }))}
                  disabled={creating}
                />
                Require linear history (no merge commits)
              </label>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={formData.enforceAdmins}
                  onChange={(e) => setFormData(prev => ({ ...prev, enforceAdmins: e.target.checked }))}
                  disabled={creating}
                />
                Include administrators (enforce rules for admins)
              </label>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={formData.allowForcePushes}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowForcePushes: e.target.checked }))}
                  disabled={creating}
                />
                <div>
                  <div>Allow force pushes</div>
                  <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    ⚠️ Not recommended for protected branches
                  </small>
                </div>
              </label>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={formData.allowDeletions}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowDeletions: e.target.checked }))}
                  disabled={creating}
                />
                <div>
                  <div>Allow deletions</div>
                  <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    ⚠️ Not recommended for protected branches
                  </small>
                </div>
              </label>
            </div>

            <button
              type="submit"
              style={buttonStyle}
              disabled={creating}
            >
              {creating ? 'Saving...' : editingId ? 'Update Rule' : 'Create Rule'}
            </button>
          </form>
        </div>
      )}

      {rules.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No branch protection rules</p>
          <p style={{ fontSize: '14px' }}>Create rules to protect important branches</p>
        </div>
      ) : (
        <div>
          {rules.map((rule) => (
            <div key={rule.id} style={ruleItemStyle}>
              <div style={ruleHeaderStyle}>
                <div style={{ flex: 1 }}>
                  <div style={patternStyle}>{rule.pattern}</div>
                  <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Created {new Date(rule.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <div style={buttonGroupStyle}>
                  <button
                    style={editButtonStyle}
                    onClick={() => handleEdit(rule)}
                  >
                    Edit
                  </button>
                  <button
                    style={deleteButtonStyle}
                    onClick={() => handleDelete(rule.id, rule.pattern)}
                    disabled={deletingId === rule.id}
                  >
                    {deletingId === rule.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div style={ruleDetailsStyle}>
                {rule.requiredReviews.enabled && (
                  <div style={ruleDetailItemStyle}>
                    ✓ Requires {rule.requiredReviews.count} review{rule.requiredReviews.count > 1 ? 's' : ''}
                  </div>
                )}
                {rule.requiredStatusChecks.enabled && (
                  <div style={ruleDetailItemStyle}>
                    ✓ Requires status checks ({rule.requiredStatusChecks.contexts.length} check{rule.requiredStatusChecks.contexts.length !== 1 ? 's' : ''})
                  </div>
                )}
                {rule.requireSignedCommits && (
                  <div style={ruleDetailItemStyle}>✓ Requires signed commits</div>
                )}
                {rule.requireLinearHistory && (
                  <div style={ruleDetailItemStyle}>✓ Requires linear history</div>
                )}
                {rule.enforceAdmins && (
                  <div style={ruleDetailItemStyle}>✓ Enforced for admins</div>
                )}
                {!rule.allowForcePushes && (
                  <div style={ruleDetailItemStyle}>✓ Force pushes disabled</div>
                )}
                {!rule.allowDeletions && (
                  <div style={ruleDetailItemStyle}>✓ Branch deletions disabled</div>
                )}
              </div>

              {rule.requiredStatusChecks.enabled && rule.requiredStatusChecks.contexts.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                    Required Status Checks:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {rule.requiredStatusChecks.contexts.map(context => (
                      <span key={context} style={badgeStyle}>{context}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { BranchProtection };
