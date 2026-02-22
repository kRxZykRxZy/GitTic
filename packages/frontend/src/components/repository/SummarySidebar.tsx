import React from 'react';
import { 
  GitCommit, 
  GitBranch, 
  Tag, 
  GitPullRequest, 
  Calendar,
  Package
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api-client';
import { useParams } from 'react-router-dom';

interface SummarySidebarProps {
  repositoryName: string;
  createdAt: string;
}

export const SummarySidebar: React.FC<SummarySidebarProps> = ({
  repositoryName,
  createdAt
}) => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  const { data: repoStats } = useApi<{
    commits: number;
    branches: number;
    tags: number;
    openPullRequests: number;
    stars: number;
    forks: number;
  }>(
    () => api.get(`/repositories/${owner}/${repo}/stats`),
    [owner, repo],
  );

  const stats = [
    { icon: GitCommit, label: 'Commits', value: repoStats?.commits || 0 },
    { icon: GitBranch, label: 'Branches', value: repoStats?.branches || 0 },
    { icon: Tag, label: 'Tags', value: repoStats?.tags || 0 },
    { icon: GitPullRequest, label: 'Open Pull Requests', value: repoStats?.openPullRequests || 0 },
  ];

  return (
    <div className="w-80 bg-gray-50 border-l border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Summary</h3>
        
        {/* Created Date */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
          <Calendar className="w-4 h-4" />
          <span>Created {createdAt}</span>
        </div>

        {/* Repository Name */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Package className="w-4 h-4" />
          <span>{repositoryName}</span>
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-secondary">{stat.label}</span>
                </div>
                <span className="text-sm font-medium text-text-primary">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
