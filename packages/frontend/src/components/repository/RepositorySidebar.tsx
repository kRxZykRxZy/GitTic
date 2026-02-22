import React from 'react';
import { 
  ChevronLeft, 
  Grid3X3, 
  ArrowLeft, 
  File, 
  GitCommit, 
  GitBranch, 
  Tag, 
  GitPullRequest, 
  Webhook, 
  Search, 
  Settings, 
  HelpCircle,
  Star
} from 'lucide-react';

interface RepositorySidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  owner: string;
  repo: string;
}

export const RepositorySidebar: React.FC<RepositorySidebarProps> = ({
  activeTab,
  onTabChange,
  owner,
  repo
}) => {
  const navigationItems = [
    { id: 'back', label: 'Back to Repositories', icon: ArrowLeft },
    { id: 'files', label: 'Files', icon: File },
    { id: 'commits', label: 'Commits', icon: GitCommit },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'manage', label: 'Manage Repository', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-sidebar-bg min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-white">
          <Grid3X3 className="w-6 h-6" />
          <span className="font-semibold">Code Repository</span>
        </div>
      </div>

      {/* Account Section */}
      <div className="p-4">
        <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
          <span className="text-white text-sm">ACCOUNT hi1992</span>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 custom-scrollbar overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-accent-blue text-white'
                  : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="p-4 border-t border-gray-700">
        <div className="w-12 h-12 bg-accent-orange rounded-full flex items-center justify-center text-white font-bold">
          kRxZy
        </div>
      </div>
    </div>
  );
};
