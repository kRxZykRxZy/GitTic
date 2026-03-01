import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Webhook, Plus, Edit, Trash2, Globe, Lock, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  content_type: 'json' | 'form';
  insecure_ssl: boolean;
  created_at: string;
  last_delivery?: {
    status: 'success' | 'failed' | 'pending';
    delivered_at: string;
  };
}

export const WebhooksPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const toast = useToast();
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    content_type: 'json' as const,
    secret: '',
    events: ['push'],
    active: true,
  });

  const { data: webhooks, loading, error, refetch } = useApi<WebhookConfig[]>(
    () => api.get(`/repositories/${owner}/${repo}/webhooks`),
    [owner, repo],
  );

  const handleCreateWebhook = async () => {
    if (!newWebhook.url.trim()) {
      toast.error('Payload URL is required');
      return;
    }

    try {
      await api.post(`/repositories/${owner}/${repo}/webhooks`, newWebhook);
      toast.success('Webhook created successfully');
      setShowCreateWebhook(false);
      setNewWebhook({ url: '', content_type: 'json', secret: '', events: ['push'], active: true });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      await api.delete(`/repositories/${owner}/${repo}/webhooks/${webhookId}`);
      toast.success('Webhook deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete webhook');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner message="Loading webhooks..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Webhooks</h1>
          <p className="text-gray-600">Manage webhook configurations</p>
        </div>
        <Button onClick={() => setShowCreateWebhook(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add webhook
        </Button>
      </div>

      {/* Create Webhook Modal */}
      {showCreateWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create webhook</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payload URL
                  </label>
                  <Input
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content type
                  </label>
                  <select
                    value={newWebhook.content_type}
                    onChange={(e) => setNewWebhook({ ...newWebhook, content_type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="json">application/json</option>
                    <option value="form">application/x-www-form-urlencoded</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secret
                  </label>
                  <Input
                    type="password"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    placeholder="Optional secret"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newWebhook.active}
                      onChange={(e) => setNewWebhook({ ...newWebhook, active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateWebhook(false);
                    setNewWebhook({ url: '', content_type: 'json', secret: '', events: ['push'], active: true });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWebhook}
                  disabled={!newWebhook.url.trim()}
                >
                  Create webhook
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {webhooks && webhooks.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Webhook className="w-5 h-5 text-gray-500" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{webhook.url}</span>
                        {webhook.active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        {getStatusIcon(webhook.last_delivery?.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>{webhook.content_type}</span>
                        </div>
                        
                        {webhook.secret && (
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Secured</span>
                          </div>
                        )}
                        
                        <span>Events: {webhook.events.join(', ')}</span>
                      </div>
                      
                      {webhook.last_delivery && (
                        <div className="text-sm text-gray-500 mt-1">
                          Last delivery: {new Date(webhook.last_delivery.delivered_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No webhooks configured yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
