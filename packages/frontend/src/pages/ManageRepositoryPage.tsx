import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, Users, Shield, Globe, Lock, Trash2, Save, AlertTriangle, Key, Webhook } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

interface RepositorySettings {
  name: string;
  description: string;
  default_branch: string;
  private: boolean;
  allow_merge_commit: boolean;
  allow_squash_merge: boolean;
  allow_rebase_merge: boolean;
  delete_branch_on_merge: boolean;
  auto_delete_head_branch: boolean;
  has_issues: boolean;
  has_wiki: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  license: string;
  homepage: string;
  topics: string[];
}

interface Collaborator {
  id: string;
  username: string;
  role: 'admin' | 'maintain' | 'write' | 'read' | 'triage';
  permissions: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  };
}

export const ManageRepositoryPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'collaborators' | 'branches' | 'webhooks' | 'danger'>('general');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<RepositorySettings>({
    name: '',
    description: '',
    default_branch: 'main',
    private: false,
    allow_merge_commit: true,
    allow_squash_merge: true,
    allow_rebase_merge: true,
    delete_branch_on_merge: false,
    auto_delete_head_branch: false,
    has_issues: true,
    has_wiki: true,
    has_projects: true,
    has_downloads: true,
    license: '',
    homepage: '',
    topics: [],
  });

  const { data: repositorySettings, loading: settingsLoading, error, refetch } = useApi<RepositorySettings>(
    () => api.get(`/repositories/${owner}/${repo}/settings`),
    [owner, repo],
  );

  const { data: collaborators, loading: collaboratorsLoading } = useApi<Collaborator[]>(
    () => api.get(`/repositories/${owner}/${repo}/collaborators`),
    [owner, repo],
  );

  const { data: permissions } = useApi<{
    admin: boolean;
    push: boolean;
    pull: boolean;
  }>(
    () => api.get(`/repositories/${owner}/${repo}/permissions`),
    [owner, repo],
  );

  React.useEffect(() => {
    if (repositorySettings) {
      setSettings(repositorySettings);
    }
  }, [repositorySettings]);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await api.patch(`/repositories/${owner}/${repo}/settings`, settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    const username = prompt('Enter username to add as collaborator:');
    if (!username) return;

    try {
      await api.put(`/repositories/${owner}/${repo}/collaborators/${username}`, {
        permission: 'write',
      });
      toast.success('Collaborator added successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add collaborator');
    }
  };

  const handleRemoveCollaborator = async (username: string) => {
    if (!confirm(`Remove ${username} from collaborators?`)) return;

    try {
      await api.delete(`/repositories/${owner}/${repo}/collaborators/${username}`);
      toast.success('Collaborator removed successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove collaborator');
    }
  };

  const handleUpdateCollaboratorRole = async (username: string, role: string) => {
    try {
      await api.put(`/repositories/${owner}/${repo}/collaborators/${username}`, {
        permission: role,
      });
      toast.success('Collaborator role updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update collaborator role');
    }
  };

  const handleDeleteRepository = async () => {
    const repoName = prompt(`Type "${repo}" to confirm deletion:`);
    if (repoName !== repo) return;

    if (!confirm('⚠️ This action cannot be undone. This will permanently delete the repository.')) return;

    try {
      await api.delete(`/repositories/${owner}/${repo}`);
      toast.success('Repository deleted successfully');
      window.location.href = '/repositories';
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete repository');
    }
  };

  if (!permissions?.admin) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-1">Access Denied</h3>
              <p className="text-sm text-yellow-800">
                You don't have admin permissions to manage this repository. 
                Only repository owners and admins can access these settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (settingsLoading) return <LoadingSpinner message="Loading settings..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Repository</h1>
        <p className="text-gray-600">Configure repository settings and permissions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'collaborators', label: 'Collaborators', icon: Users },
            { id: 'branches', label: 'Branches', icon: Shield },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'general' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">General Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository name
                </label>
                <Input
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  placeholder="repository-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  placeholder="Describe your repository"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Homepage URL
                </label>
                <Input
                  value={settings.homepage}
                  onChange={(e) => setSettings({ ...settings, homepage: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.private}
                    onChange={(e) => setSettings({ ...settings, private: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Private repository
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Only you and collaborators can see this repository
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Collaborators</h2>
              <Button onClick={handleAddCollaborator} className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add people
              </Button>
            </div>

            {collaboratorsLoading ? (
              <LoadingSpinner message="Loading collaborators..." />
            ) : collaborators && collaborators.length > 0 ? (
              <div className="space-y-4">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {collaborator.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{collaborator.username}</div>
                        <div className="text-sm text-gray-500">
                          {collaborator.permissions.admin ? 'Admin' :
                           collaborator.permissions.push ? 'Write' : 'Read'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <select
                        value={collaborator.role}
                        onChange={(e) => handleUpdateCollaboratorRole(collaborator.username, e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="read">Read</option>
                        <option value="triage">Triage</option>
                        <option value="write">Write</option>
                        <option value="maintain">Maintain</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.username)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No collaborators yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Branch Protection Rules</h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium mb-2">Default branch protection</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure rules for the default branch ({settings.default_branch})
                </p>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm">Require pull request reviews before merging</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm">Require status checks to pass before merging</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm">Require branches to be up to date before merging</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm">Restrict pushes that create files</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Webhooks</h2>
              <Button className="flex items-center gap-2">
                <Webhook className="w-4 h-4" />
                Add webhook
              </Button>
            </div>
            
            <div className="text-center py-8 text-gray-500">
              <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No webhooks configured yet</p>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-red-600">Danger Zone</h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg">
                <h3 className="font-medium mb-2">Transfer ownership</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Transfer this repository to another user or organization
                </p>
                <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  Transfer ownership
                </Button>
              </div>

              <div className="p-4 border border-red-200 rounded-lg">
                <h3 className="font-medium mb-2">Archive repository</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Make this repository read-only. You can always unarchive later.
                </p>
                <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  Archive repository
                </Button>
              </div>

              <div className="p-4 border border-red-200 rounded-lg">
                <h3 className="font-medium mb-2 text-red-600">Delete this repository</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete a repository, there is no going back. Please be certain.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleDeleteRepository}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete this repository
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
