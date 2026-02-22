import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitPullRequest, Plus, MessageSquare, GitCommit, GitBranch, User, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  state: 'open' | 'closed' | 'merged';
  author: {
    name: string;
    avatar?: string;
  };
  base: {
    branch: string;
    repo: string;
  };
  head: {
    branch: string;
    repo: string;
  };
  created_at: string;
  updated_at: string;
  mergeable?: boolean;
  commits_count: number;
  comments_count: number;
  review_status?: 'pending' | 'approved' | 'changes_requested';
  reviewers?: Array<{
    name: string;
    status: 'approved' | 'changes_requested' | 'pending';
  }>;
}

export const PullRequestsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const toast = useToast();
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [newPR, setNewPR] = useState({
    title: '',
    description: '',
    headBranch: '',
    baseBranch: 'main',
  });

  const { data: pullRequests, loading, error, refetch } = useApi<PullRequest[]>(
    () => api.get(`/repositories/${owner}/${repo}/pulls?state=${filter}`),
    [owner, repo, filter],
  );

  const { data: branches } = useApi<string[]>(
    () => api.get(`/repositories/${owner}/${repo}/branches`),
    [owner, repo],
  );

  const handleCreatePR = async () => {
    if (!newPR.title.trim() || !newPR.headBranch) {
      toast.error('Title and source branch are required');
      return;
    }

    try {
      await api.post(`/repositories/${owner}/${repo}/pulls`, {
        title: newPR.title.trim(),
        description: newPR.description.trim(),
        head: newPR.headBranch,
        base: newPR.baseBranch,
      });

      toast.success('Pull request created successfully');
      setShowCreatePR(false);
      setNewPR({ title: '', description: '', headBranch: '', baseBranch: 'main' });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create pull request');
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'open':
        return <GitPullRequest className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'merged':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (pr: PullRequest) => {
    if (pr.state === 'merged') {
      return <Badge variant="secondary">Merged</Badge>;
    }
    if (pr.state === 'closed') {
      return <Badge variant="destructive">Closed</Badge>;
    }
    if (pr.review_status === 'approved') {
      return <Badge variant="default">Approved</Badge>;
    }
    if (pr.review_status === 'changes_requested') {
      return <Badge variant="destructive">Changes requested</Badge>;
    }
    return <Badge variant="outline">Open</Badge>;
  };

  if (loading) return <LoadingSpinner message="Loading pull requests..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pull Requests</h1>
          <p className="text-gray-600">Review and merge code changes</p>
        </div>
        <Button onClick={() => setShowCreatePR(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New pull request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter('open')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm ${
            filter === 'open'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm ${
            filter === 'closed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Closed
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm ${
            filter === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
      </div>

      {/* Create PR Modal */}
      {showCreatePR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create pull request</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={newPR.title}
                    onChange={(e) => setNewPR({ ...newPR, title: e.target.value })}
                    placeholder="Fix: Describe your changes"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newPR.description}
                    onChange={(e) => setNewPR({ ...newPR, description: e.target.value })}
                    placeholder="Describe the changes you've made"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source branch
                    </label>
                    <select
                      value={newPR.headBranch}
                      onChange={(e) => setNewPR({ ...newPR, headBranch: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select branch</option>
                      {branches?.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      )) || <option value="main">main</option>}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target branch
                    </label>
                    <select
                      value={newPR.baseBranch}
                      onChange={(e) => setNewPR({ ...newPR, baseBranch: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {branches?.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      )) || <option value="main">main</option>}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreatePR(false);
                    setNewPR({ title: '', description: '', headBranch: '', baseBranch: 'main' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePR}
                  disabled={!newPR.title.trim() || !newPR.headBranch}
                >
                  Create pull request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PR List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {pullRequests && pullRequests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {pullRequests.map((pr) => (
              <div key={pr.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(pr.state)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/${owner}/${repo}/pulls/${pr.number}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {pr.title}
                        </Link>
                        <span className="text-gray-500">#{pr.number}</span>
                        {getStatusBadge(pr)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          <span>
                            {pr.head.branch} → {pr.base.branch}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{pr.author.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {pr.description && (
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {pr.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <GitCommit className="w-4 h-4 text-gray-500" />
                          <span>{pr.commits_count} commits</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span>{pr.comments_count} comments</span>
                        </div>
                        
                        {pr.reviewers && pr.reviewers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Reviewers:</span>
                            {pr.reviewers.map((reviewer, index) => (
                              <span key={index} className="flex items-center gap-1">
                                {reviewer.status === 'approved' && (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                )}
                                {reviewer.status === 'changes_requested' && (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                                {reviewer.status === 'pending' && (
                                  <AlertCircle className="w-3 h-3 text-yellow-600" />
                                )}
                                <span>{reviewer.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <GitPullRequest className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No pull requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};
