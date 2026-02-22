import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Star, GitBranch, Plus, Copy, Search, GitFork } from "lucide-react";
import { Button, Input, Badge } from "../ui";
import { CloneModal } from "../repository/CloneModal";

interface RepoHeaderProps {
  repositoryName: string;
  isPrivate?: boolean;
  currentBranch: string;
  onBranchChange?: (branch: string) => void;
  stars?: number;
  forks?: number;
  isStarred?: boolean;
  onStar?: () => void;
  onFork?: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({
  repositoryName,
  isPrivate = false,
  currentBranch,
  onBranchChange,
  stars = 0,
  forks = 0,
  isStarred = false,
  onStar,
  onFork,
}) => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCloneModal, setShowCloneModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/${owner}/${repo}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNewFile = () => {
    navigate(`/${owner}/${repo}/new`);
  };

  const handleNewFolder = () => {
    // For now, navigate to files tab with folder creation mode
    // In a real implementation, this would open a folder creation modal
    navigate(`/${owner}/${repo}?createFolder=true`);
  };

  const repositoryUrl = `${owner}/${repo}`;

  return (
    <div className="px-6 py-4 border-b border-border-light bg-white">
      {/* Breadcrumbs and repo title */}
      <div className="flex items-center gap-2 mb-3">
        <Link to="/repositories" className="text-sm text-text-secondary hover:text-text-primary">
          Repositories
        </Link>
        <span className="text-sm text-text-secondary">&gt;</span>
        <Link to={`/${owner}/${repo}`} className="text-sm text-accent-blue hover:underline">
          {repo}
        </Link>
        <button 
          onClick={onStar}
          className={`p-1 hover:bg-bg-light rounded flex items-center gap-1 ${isStarred ? 'text-yellow-500' : 'text-text-secondary'}`}
        >
          <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
          <span className="text-sm">{stars}</span>
        </button>
        <button 
          onClick={onFork}
          className="p-1 hover:bg-bg-light rounded flex items-center gap-1 text-text-secondary"
        >
          <GitFork className="w-4 h-4" />
          <span className="text-sm">{forks}</span>
        </button>
        {isPrivate && (
          <Badge variant="outline" className="text-xs">
            Private
          </Badge>
        )}
      </div>

      {/* Repository actions bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Branch selector */}
          <Button variant="secondary" size="sm" className="flex items-center gap-2">
            <GitBranch className="w-3 h-3" />
            {currentBranch}
          </Button>

          {/* Action buttons */}
          <button className="p-2 hover:bg-bg-light rounded border border-border-light bg-white">
            <Plus className="w-4 h-4" />
          </button>

          <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={() => setShowCloneModal(true)}>
            <Copy className="w-3 h-3" />
            Clone
          </Button>

          <Button size="sm" className="flex items-center gap-2" onClick={handleNewFile}>
            <Plus className="w-3 h-3" />
            New File
          </Button>

          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleNewFolder}>
            <Plus className="w-3 h-3" />
            New Folder
          </Button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input
            type="text"
            placeholder="Code Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-48"
          />
        </form>
      </div>

      {/* Clone Modal */}
      <CloneModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        repositoryUrl={repositoryUrl}
        repositoryName={repositoryName}
      />
    </div>
  );
};
