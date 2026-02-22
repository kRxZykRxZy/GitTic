import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitPullRequest, GitCommit, GitBranch, User, Calendar, MessageSquare, CheckCircle, XCircle, AlertTriangle, Triangle, Merge, Code, FileDiff } from 'lucide-react';
import { Button, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface PullRequestDetail {
  id: string;
  number: number;
  title: string;
  description: string;
  state: 'open' | 'closed' | 'merged';
  author: {
    login: string;
    avatar_url?: string;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    repo: {
      name: string;
      full_name: string;
    };
  };
  head: {
    label: string;
    ref: string;
    sha: string;
    repo: {
      name: string;
      full_name: string;
    };
  };
  mergeable: boolean | null;
  mergeable_state: 'clean' | 'dirty' | 'unknown' | 'unstable';
  merged: boolean;
  merged_at?: string;
  merged_by?: {
    login: string;
  };
  merge_commit_sha?: string;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  status: 'pending' | 'success' | 'failure' | 'error';
  reviewers: Array<{
    login: string;
    state: 'approved' | 'changes_requested' | 'pending';
  }>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    date: string;
  };
  url: string;
}

interface File {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
}

export const PullRequestDetailPage: React.FC = () => {
  const { owner, repo, number } = useParams<{ owner: string; repo: string; number: string }>();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'files'>('overview');
  const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge');

  const { data: pr, loading, error, refetch } = useApi<PullRequestDetail>(
    () => api.get(`/repositories/${owner}/${repo}/pulls/${number}`),
    [owner, repo, number],
  );

  const { data: commits } = useApi<Commit[]>(
    () => api.get(`/repositories/${owner}/${repo}/pulls/${number}/commits`),
    [owner, repo, number],
  );

  const { data: files } = useApi<File[]>(
    () => api.get(`/repositories/${owner}/${repo}/pulls/${number}/files`),
    [owner, repo, number],
  );

  const { data: diff } = useApi<string>(
    () => api.get(`/repositories/${owner}/${repo}/pulls/${number}/diff`),
    [owner, repo, number],
  );

  const handleMerge = async () => {
    if (!pr?.mergeable) {
      toast.error('Pull request cannot be merged');
      return;
    }

    try {
      await api.put(`/repositories/${owner}/${repo}/pulls/${number}/merge`, {
        merge_method: mergeMethod,
      });
      toast.success('Pull request merged successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to merge pull request');
    }
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this pull request?')) {
      return;
    }

    try {
      await api.patch(`/repositories/${owner}/${repo}/pulls/${number}`, {
        state: 'closed',
      });
      toast.success('Pull request closed successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to close pull request');
    }
  };

  const handleReopen = async () => {
    try {
      await api.patch(`/repositories/${owner}/${repo}/pulls/${number}`, {
        state: 'open',
      });
      toast.success('Pull request reopened successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reopen pull request');
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
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMergeableStatus = () => {
    if (!pr) return null;
    
    if (pr.merged) {
      return { icon: <CheckCircle className="w-4 h-4 text-purple-600" />, text: 'Merged', color: 'purple' };
    }
    
    if (pr.mergeable === null) {
      return { icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, text: 'Checking...', color: 'yellow' };
    }
    
    if (!pr.mergeable) {
      return { icon: <XCircle className="w-4 h-4 text-red-600" />, text: 'Merge conflict', color: 'red' };
    }
    
    if (pr.mergeable_state === 'dirty') {
      return { icon: <Triangle className="w-4 h-4 text-yellow-600" />, text: 'Unstable', color: 'yellow' };
    }
    
    return { icon: <CheckCircle className="w-4 h-4 text-green-600" />, text: 'Ready to merge', color: 'green' };
  };

  if (loading) return <LoadingSpinner message="Loading pull request..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!pr) return <ErrorMessage message="Pull request not found" />;

  const mergeableStatus = getMergeableStatus();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/${owner}/${repo}/pulls`} className="text-sm text-blue-600 hover:underline">
                ← Back to pull requests
              </Link>
              <div className="flex items-center gap-2">
                {getStatusIcon(pr.state)}
                <span className="font-medium">Pull Request #{pr.number}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PR Title and Status */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{pr.title}</h1>
            <div className="flex items-center gap-2">
              {mergeableStatus && (
                <Badge variant="outline" className={`border-${mergeableStatus.color}-300 text-${mergeableStatus.color}-700`}>
                  <div className="flex items-center gap-1">
                    {mergeableStatus.icon}
                    {mergeableStatus.text}
                  </div>
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              <span>
                <span className="font-medium">{pr.base.label}</span>
                {' ← '}
                <span className="font-medium">{pr.head.label}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{pr.author.login} wants to merge {pr.commits} commit{pr.commits !== 1 ? 's' : ''} into {pr.base.ref} from {pr.head.ref}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(pr.created_at).toLocaleDateString()}</span>
            </div>
            
            {pr.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{pr.comments} comment{pr.comments !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              <span>{pr.additions} additions, {pr.deletions} deletions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {pr.state === 'open' && (
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4">
              {pr.mergeable && (
                <div className="flex items-center gap-2">
                  <select
                    value={mergeMethod}
                    onChange={(e) => setMergeMethod(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="merge">Create a merge commit</option>
                    <option value="squash">Squash and merge</option>
                    <option value="rebase">Rebase and merge</option>
                  </select>
                  <Button onClick={handleMerge} className="flex items-center gap-2">
                    <Merge className="w-4 h-4" />
                    Merge pull request
                  </Button>
                </div>
              )}
              
              <Button variant="outline" onClick={handleClose}>
                Close pull request
              </Button>
            </div>
          </div>
        </div>
      )}

      {pr.state === 'closed' && !pr.merged && (
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6">
            <Button onClick={handleReopen}>
              Reopen pull request
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Conversation', icon: MessageSquare },
            { id: 'commits', label: `Commits (${pr.commits})`, icon: GitCommit },
            { id: 'files', label: `Files changed (${pr.changed_files})`, icon: FileDiff },
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
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="prose max-w-none">
              {pr.description ? (
                <div dangerouslySetInnerHTML={{ __html: pr.description.replace(/\n/g, '<br>') }} />
              ) : (
                <p className="text-gray-500">No description provided.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="divide-y divide-gray-200">
            {commits?.map((commit) => (
              <div key={commit.sha} className="p-6">
                <div className="flex items-start gap-4">
                  <GitCommit className="w-5 h-5 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-gray-600">{commit.sha.substring(0, 7)}</span>
                      <span className="font-medium">{commit.message}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {commit.author.name} committed {new Date(commit.author.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            {files?.map((file) => (
              <div key={file.sha} className="border-b border-gray-200">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${
                      file.status === 'added' ? 'bg-green-500' :
                      file.status === 'removed' ? 'bg-red-500' :
                      file.status === 'renamed' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-mono text-sm">{file.filename}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {file.additions > 0 && <span className="text-green-600">+{file.additions}</span>}
                    {file.deletions > 0 && <span className="text-red-600">-{file.deletions}</span>}
                  </div>
                </div>
                {file.patch && (
                  <div className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
                    <pre className="text-sm font-mono">{file.patch}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
