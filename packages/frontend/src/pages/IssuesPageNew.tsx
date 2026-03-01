import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, Plus, GitCommit, MessageSquare, User, Calendar, Tag, Milestone, Search, Filter } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  author: {
    login: string;
    avatar_url?: string;
  };
  assignees: Array<{
    login: string;
    avatar_url?: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
  milestone?: {
    title: string;
  };
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  pull_request?: {
    html_url: string;
  };
}

interface CreateIssueData {
  title: string;
  body: string;
  assignees: string[];
  labels: string[];
  milestone?: string;
}

export const IssuesPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const toast = useToast();
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [newIssue, setNewIssue] = useState<CreateIssueData>({
    title: '',
    body: '',
    assignees: [],
    labels: [],
  });

  const { data: issues, loading, error, refetch } = useApi<Issue[]>(
    () => api.get(`/repositories/${owner}/${repo}/issues?state=${filter}&search=${encodeURIComponent(searchQuery)}`),
    [owner, repo, filter, searchQuery],
  );

  const { data: labels } = useApi<Array<{ name: string; color: string }>>(
    () => api.get(`/repositories/${owner}/${repo}/labels`),
    [owner, repo],
  );

  const { data: milestones } = useApi<Array<{ title: string }>>(
    () => api.get(`/repositories/${owner}/${repo}/milestones`),
    [owner, repo],
  );

  const { data: collaborators } = useApi<Array<{ login: string }>>(
    () => api.get(`/repositories/${owner}/${repo}/collaborators`),
    [owner, repo],
  );

  const handleCreateIssue = async () => {
    if (!newIssue.title.trim()) {
      toast.error('Issue title is required');
      return;
    }

    try {
      await api.post(`/repositories/${owner}/${repo}/issues`, newIssue);
      toast.success('Issue created successfully');
      setShowCreateIssue(false);
      setNewIssue({ title: '', body: '', assignees: [], labels: [] });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create issue');
    }
  };

  const handleToggleIssueState = async (issueNumber: number, currentState: string) => {
    try {
      const newState = currentState === 'open' ? 'closed' : 'open';
      await api.patch(`/repositories/${owner}/${repo}/issues/${issueNumber}`, {
        state: newState,
      });
      toast.success(`Issue ${newState} successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update issue');
    }
  };

  const getStatusIcon = (state: string) => {
    return state === 'open' ? (
      <AlertCircle className="w-4 h-4 text-green-600" />
    ) : (
      <AlertCircle className="w-4 h-4 text-gray-600" />
    );
  };

  const getStatusBadge = (state: string) => {
    return state === 'open' ? (
      <Badge variant="default">Open</Badge>
    ) : (
      <Badge variant="outline">Closed</Badge>
    );
  };

  if (loading) return <LoadingSpinner message="Loading issues..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Issues</h1>
          <p className="text-gray-600">Track tasks, enhancements, and bugs</p>
        </div>
        <Button onClick={() => setShowCreateIssue(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New issue
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-2">
              {[
                { value: 'open', label: 'Open' },
                { value: 'closed', label: 'Closed' },
                { value: 'all', label: 'All' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilter(status.value as any)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === status.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Issue Modal */}
      {showCreateIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create new issue</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    placeholder="Issue title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newIssue.body}
                    onChange={(e) => setNewIssue({ ...newIssue, body: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-48 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignees
                    </label>
                    <select
                      multiple
                      value={newIssue.assignees}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setNewIssue({ ...newIssue, assignees: selected });
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                    >
                      {collaborators?.map((collaborator) => (
                        <option key={collaborator.login} value={collaborator.login}>
                          {collaborator.login}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Labels
                    </label>
                    <select
                      multiple
                      value={newIssue.labels}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setNewIssue({ ...newIssue, labels: selected });
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                    >
                      {labels?.map((label) => (
                        <option key={label.name} value={label.name}>
                          {label.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Milestone
                  </label>
                  <select
                    value={newIssue.milestone || ''}
                    onChange={(e) => setNewIssue({ ...newIssue, milestone: e.target.value || undefined })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">No milestone</option>
                    {milestones?.map((milestone) => (
                      <option key={milestone.title} value={milestone.title}>
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateIssue(false);
                    setNewIssue({ title: '', body: '', assignees: [], labels: [] });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateIssue}
                  disabled={!newIssue.title.trim()}
                >
                  Create issue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {issues && issues.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {issues.map((issue) => (
              <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(issue.state)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/${owner}/${repo}/issues/${issue.number}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {issue.title}
                        </Link>
                        <span className="text-gray-500">#{issue.number}</span>
                        {getStatusBadge(issue.state)}
                        {issue.pull_request && (
                          <Badge variant="secondary">Pull Request</Badge>
                        )}
                      </div>
                      
                      {issue.body && (
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {issue.body}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{issue.author.login}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Opened {new Date(issue.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {issue.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{issue.comments}</span>
                          </div>
                        )}
                        
                        {issue.assignees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span>Assigned to:</span>
                            {issue.assignees.map((assignee) => (
                              <span key={assignee.login} className="text-blue-600">
                                {assignee.login}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {(issue.labels.length > 0 || issue.milestone) && (
                        <div className="flex items-center gap-2 mt-2">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label.name}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                          {issue.milestone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Milestone className="w-3 h-3" />
                              <span>{issue.milestone.title}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleIssueState(issue.number, issue.state)}
                    >
                      {issue.state === 'open' ? 'Close' : 'Reopen'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No issues found</p>
          </div>
        )}
      </div>
    </div>
  );
};
