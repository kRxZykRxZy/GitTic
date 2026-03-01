import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GitBranch, Plus, Trash2, GitCommit, Calendar, User, AlertTriangle } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface Branch {
  name: string;
  commit: {
    sha: string;
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  protected: boolean;
  default: boolean;
  ahead?: number;
  behind?: number;
}

export const BranchesPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const toast = useToast();
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');
  const [loading, setLoading] = useState(false);

  const { data: branches, loading: branchesLoading, error, refetch } = useApi<Branch[]>(
    () => api.get(`/repositories/${owner}/${repo}/branches`),
    [owner, repo],
  );

  const { data: allBranches } = useApi<string[]>(
    () => api.get(`/repositories/${owner}/${repo}/branches`),
    [owner, repo],
  );

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast.error('Branch name is required');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/repositories/${owner}/${repo}/branches`, {
        name: newBranchName.trim(),
        from: baseBranch,
      });

      toast.success('Branch created successfully');
      setShowCreateBranch(false);
      setNewBranchName('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (branchName === 'main' || branchName === 'master') {
      toast.error('Cannot delete the default branch');
      return;
    }

    if (!confirm(`Are you sure you want to delete branch "${branchName}"?`)) {
      return;
    }

    try {
      await api.delete(`/repositories/${owner}/${repo}/branches/${branchName}`);
      toast.success('Branch deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete branch');
    }
  };

  const handleSetBranchAsDefault = async (branchName: string) => {
    if (!confirm(`Are you sure you want to set "${branchName}" as the default branch?`)) {
      return;
    }

    try {
      await api.patch(`/repositories/${owner}/${repo}/settings`, {
        default_branch: branchName,
      });
      toast.success('Default branch updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update default branch');
    }
  };

  if (branchesLoading) return <LoadingSpinner message="Loading branches..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Branches</h1>
          <p className="text-gray-600">Manage your repository branches</p>
        </div>
        <Button onClick={() => setShowCreateBranch(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New branch
        </Button>
      </div>

      {/* Create Branch Modal */}
      {showCreateBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create new branch</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch name
                  </label>
                  <Input
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="feature/new-feature"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Create from
                  </label>
                  <select
                    value={baseBranch}
                    onChange={(e) => setBaseBranch(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {allBranches?.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    )) || <option value="main">main</option>}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateBranch(false);
                    setNewBranchName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBranch}
                  disabled={loading || !newBranchName.trim()}
                >
                  {loading ? 'Creating...' : 'Create branch'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branches List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {branches && branches.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {branches.map((branch) => (
              <div key={branch.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <GitBranch className="w-5 h-5 text-gray-500" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{branch.name}</span>
                        {branch.default && (
                          <Badge variant="default">default</Badge>
                        )}
                        {branch.protected && (
                          <Badge variant="secondary">protected</Badge>
                        )}
                        {branch.ahead !== undefined && branch.behind !== undefined && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {branch.ahead > 0 && (
                              <span className="text-green-600">+{branch.ahead}</span>
                            )}
                            {branch.behind > 0 && (
                              <span className="text-red-600">-{branch.behind}</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <GitCommit className="w-4 h-4" />
                          <span className="font-mono">{branch.commit.sha.substring(0, 7)}</span>
                          <span>{branch.commit.message}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{branch.commit.author.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(branch.commit.author.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!branch.default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetBranchAsDefault(branch.name)}
                      >
                        Set as default
                      </Button>
                    )}
                    
                    {!branch.default && !branch.protected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBranch(branch.name)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No branches found</p>
          </div>
        )}
      </div>

      {/* Branch Protection Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Branch Protection</h3>
            <p className="text-sm text-blue-800">
              Protected branches cannot be deleted and require pull requests for changes. 
              Configure branch protection rules in repository settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
