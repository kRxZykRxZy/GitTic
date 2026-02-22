import React, { useState } from 'react';
import { Star, GitBranch, Plus, Search, Download } from 'lucide-react';

interface RepositoryHeaderProps {
  owner: string;
  repo: string;
  isPrivate: boolean;
  currentBranch?: string;
  onBranchChange?: (branch: string) => void;
}

export const RepositoryHeader: React.FC<RepositoryHeaderProps> = ({
  owner,
  repo,
  isPrivate,
  currentBranch = 'main',
  onBranchChange
}) => {
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  return (
    <div className="border-b border-border bg-main-bg">
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-breadcrumb mb-3">
          <span>Repositories</span>
          <span>/</span>
          <span className="text-text-primary">{repo}</span>
        </div>

        {/* Repository Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-text-primary">{repo}</h1>
            <Star className="w-5 h-5 text-text-secondary" />
            {isPrivate && (
              <span className="px-2 py-1 text-xs font-medium bg-private-badge border border-border rounded-md text-text-secondary">
                Private
              </span>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Code Search"
                className="pl-10 pr-4 py-2 border border-border rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm text-text-primary hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Clone
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-accent-blue text-white rounded-md text-sm hover:bg-accent-blue-hover transition-colors">
            <Plus className="w-4 h-4" />
            New File
          </button>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative">
            <button
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1 border border-border rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              <span>{currentBranch}</span>
            </button>
            
            {isBranchDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-border rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors">
                    main
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <GitBranch className="w-4 h-4" />
            <span>/</span>
          </div>
        </div>
      </div>
    </div>
  );
};
