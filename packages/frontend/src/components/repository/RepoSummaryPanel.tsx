import React from "react";
import { GitCommit, GitBranch, Tag, GitPullRequest } from "lucide-react";

interface RepoSummaryPanelProps {
  repositoryName: string;
  createdAt: string;
  commitsCount: number;
  branchesCount: number;
  tagsCount: number;
  pullRequestsCount: number;
}

export const RepoSummaryPanel: React.FC<RepoSummaryPanelProps> = ({
  repositoryName,
  createdAt,
  commitsCount,
  branchesCount,
  tagsCount,
  pullRequestsCount,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stats = [
    { icon: GitCommit, label: "Commits", count: commitsCount },
    { icon: GitBranch, label: "Branches", count: branchesCount },
    { icon: Tag, label: "Tags", count: tagsCount },
    { icon: GitPullRequest, label: "Open Pull Requests", count: pullRequestsCount },
  ];

  return (
    <div className="w-64 p-6 border-l border-border-light">
      <div className="bg-bg-light border border-border-light rounded-lg p-4">
        <div className="font-semibold text-sm mb-3">Summary</div>
        
        <div className="space-y-3 mb-4">
          <div>
            <div className="text-xs text-text-secondary mb-1">Created</div>
            <div className="text-sm">{formatDate(createdAt)}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">Repository</div>
            <div className="text-sm">{repositoryName}</div>
          </div>
        </div>

        <div className="pt-3 border-t border-border-light">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1 text-text-secondary" />
                  <div className="text-xs text-text-secondary">{stat.label}</div>
                  <div className="text-base font-semibold">{stat.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
