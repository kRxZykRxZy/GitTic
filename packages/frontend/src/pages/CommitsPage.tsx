import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitCommit, ArrowLeft, GitBranch, User, Calendar, FileText, RotateCcw, Eye } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  parents: string[];
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: 'added' | 'removed' | 'modified' | 'renamed';
    additions: number;
    deletions: number;
  }>;
}

export const CommitsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [branch, setBranch] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: commits, loading, error, refetch } = useApi<Commit[]>(
    () => api.get(`/repositories/${owner}/${repo}/commits?branch=${branch}&search=${encodeURIComponent(searchQuery)}`),
    [owner, repo, branch, searchQuery],
  );

  const { data: branches } = useApi<string[]>(
    () => api.get(`/repositories/${owner}/${repo}/branches`),
    [owner, repo],
  );

  if (loading) return <LoadingSpinner message="Loading commits..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Commits</h1>
        
        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-500" />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {branches?.map((branchName) => (
                <option key={branchName} value={branchName}>
                  {branchName}
                </option>
              )) || <option value="main">main</option>}
            </select>
          </div>
          
          <Input
            placeholder="Search commits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Commits List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {commits && commits.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {commits.map((commit) => (
              <Link
                key={commit.sha}
                to={`/${owner}/${repo}/commits/${commit.sha}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{commit.message}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{commit.author.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(commit.author.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm text-gray-500">
                      {commit.sha.substring(0, 7)}
                    </div>
                    {commit.stats && (
                      <div className="flex items-center gap-2 text-sm">
                        {commit.stats.additions > 0 && (
                          <span className="text-green-600">+{commit.stats.additions}</span>
                        )}
                        {commit.stats.deletions > 0 && (
                          <span className="text-red-600">-{commit.stats.deletions}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <GitCommit className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No commits found</p>
          </div>
        )}
      </div>
    </div>
  );
};
