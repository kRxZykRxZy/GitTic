import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

type WebhookEvent = 
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'create'
  | 'delete'
  | 'release'
  | 'repository'
  | 'star'
  | 'fork'
  | '*';

interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: string;
  lastDeliveryStatus?: 'success' | 'failed';
}

interface WebhookConfigProps {
  owner: string;
  repo: string;
}

const WebhookConfig: React.FC<WebhookConfigProps> = ({ owner, repo }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    secret: '',
    events: ['push'] as WebhookEvent[],
    active: true,
  });

  const availableEvents: { value: WebhookEvent; label: string }[] = [
    { value: '*', label: 'All events' },
    { value: 'push', label: 'Push events' },
    { value: 'pull_request', label: 'Pull request events' },
    { value: 'issues', label: 'Issue events' },
    { value: 'issue_comment', label: 'Issue comment events' },
    { value: 'create', label: 'Create events' },
    { value: 'delete', label: 'Delete events' },
    { value: 'release', label: 'Release events' },
    { value: 'repository', label: 'Repository events' },
    { value: 'star', label: 'Star events' },
    { value: 'fork', label: 'Fork events' },
  ];

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/webhooks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
      }

      const data = await response.json();
      setWebhooks(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhook.url.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`/api/v1/repositories/${owner}/${repo}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWebhook),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to create webhook: ${response.statusText}`);
      }

      await fetchWebhooks();
      setNewWebhook({ url: '', secret: '', events: ['push'], active: true });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      setDeletingId(webhookId);
      setError(null);
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `/api/v1/repositories/${owner}/${repo}/webhooks/${webhookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete webhook: ${response.statusText}`);
      }

      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleEvent = (event: WebhookEvent) => {
    setNewWebhook(prev => {
      const hasEvent = prev.events.includes(event);
      
      if (event === '*') {
        return { ...prev, events: hasEvent ? [] : ['*'] };
      }

      const filteredEvents = prev.events.filter(e => e !== '*' && e !== event);
      return {
        ...prev,
        events: hasEvent ? filteredEvents : [...filteredEvents, event],
      };
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading webhooks..." />;
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: 'var(--text-primary)',
  };

  const webhookItemStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    marginBottom: '12px',
  };

  const webhookHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  };

  const urlStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    wordBreak: 'break-all',
  };

  const statusBadgeStyle = (status?: 'success' | 'failed'): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: 'var(--radius)',
    backgroundColor: status === 'success' ? 'var(--accent-green-light)' : 
                     status === 'failed' ? 'var(--accent-red-light)' : 
                     'var(--border-color)',
    color: status === 'success' ? 'var(--accent-green)' : 
           status === 'failed' ? 'var(--accent-red)' : 
           'var(--text-secondary)',
    marginLeft: '8px',
  });

  const eventsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  };

  const eventBadgeStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: 'var(--accent-blue-light)',
    color: 'var(--accent-blue)',
    borderRadius: 'var(--radius)',
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

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '8px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  };

  const checkboxStyle: React.CSSProperties = {
    marginRight: '6px',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Webhooks</h1>
        <button
          style={buttonStyle}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Webhook'}
        </button>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={() => setError(null)} />
      )}

      {showAddForm && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            Add Webhook
          </h3>
          <form onSubmit={handleCreateWebhook} style={formStyle}>
            <div>
              <label style={labelStyle}>Payload URL</label>
              <input
                type="url"
                style={inputStyle}
                value={newWebhook.url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                required
                disabled={creating}
              />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                The URL to which the webhook payloads will be delivered
              </small>
            </div>

            <div>
              <label style={labelStyle}>Secret (Optional)</label>
              <input
                type="password"
                style={inputStyle}
                value={newWebhook.secret}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Your webhook secret"
                disabled={creating}
              />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Secret token to secure your webhook
              </small>
            </div>

            <div>
              <label style={labelStyle}>Events</label>
              <div style={checkboxContainerStyle}>
                {availableEvents.map((event) => (
                  <label key={event.value} style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={newWebhook.events.includes(event.value)}
                      onChange={() => handleToggleEvent(event.value)}
                      disabled={creating}
                    />
                    {event.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={newWebhook.active}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, active: e.target.checked }))}
                  disabled={creating}
                />
                Active
              </label>
            </div>

            <button
              type="submit"
              style={buttonStyle}
              disabled={creating || newWebhook.events.length === 0}
            >
              {creating ? 'Creating...' : 'Create Webhook'}
            </button>
          </form>
        </div>
      )}

      {webhooks.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No webhooks configured</p>
          <p style={{ fontSize: '14px' }}>Add webhooks to receive HTTP POST payloads when events occur</p>
        </div>
      ) : (
        <div>
          {webhooks.map((webhook) => (
            <div key={webhook.id} style={webhookItemStyle}>
              <div style={webhookHeaderStyle}>
                <div style={{ flex: 1 }}>
                  <div style={urlStyle}>
                    {webhook.url}
                    {webhook.lastDeliveryStatus && (
                      <span style={statusBadgeStyle(webhook.lastDeliveryStatus)}>
                        {webhook.lastDeliveryStatus === 'success' ? '✓ Last delivery' : '✗ Last delivery failed'}
                      </span>
                    )}
                    {!webhook.active && (
                      <span style={statusBadgeStyle()}>Inactive</span>
                    )}
                  </div>
                  <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Created {new Date(webhook.createdAt).toLocaleDateString()}
                  </small>
                  <div style={eventsStyle}>
                    {webhook.events.map((event) => (
                      <span key={event} style={eventBadgeStyle}>
                        {event === '*' ? 'All events' : event}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  style={deleteButtonStyle}
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  disabled={deletingId === webhook.id}
                >
                  {deletingId === webhook.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { WebhookConfig };
