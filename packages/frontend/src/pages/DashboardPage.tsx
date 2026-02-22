import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { Project } from "../types/api";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Button, Avatar, Badge } from "../components/ui";
import { 
  FolderOpen, 
  Search, 
  Settings, 
  Plus, 
  GitCommit, 
  Star, 
  Users, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import "../styles/globals.css";

/** Activity feed item */
interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: string;
  repo?: string;
}

/** Dashboard API response */
interface UserDashboardData {
  recentProjects: Project[];
  activity: ActivityItem[];
  stats?: {
    totalCommits: number;
    totalRepos: number;
    totalStars: number;
    totalCollaborators: number;
  };
}

/**
 * Modern Dashboard showing user's projects, activity, and quick actions.
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data, loading } = useApi<UserDashboardData>(
    () => api.get<UserDashboardData>("/dashboard"),
    [],
  );

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  const recentProjects = data?.recentProjects ?? [];
  const activity = data?.activity ?? [];
  const stats = data?.stats ?? {
    totalCommits: 0,
    totalRepos: 0,
    totalStars: 0,
    totalCollaborators: 0,
  };

  const displayActivity = activity;

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "commit":
        return <GitCommit className="w-4 h-4 text-green-500" />;
      case "star":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "pull_request":
        return <GitCommit className="w-4 h-4 text-blue-500" />;
      case "issue":
        return <Activity className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Welcome back, {user?.username ?? "User"} 👋
        </h1>
        <p className="text-text-secondary">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-border-light rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <GitCommit className="w-5 h-5 text-blue-500" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.totalCommits}</div>
          <div className="text-sm text-text-secondary">Total Commits</div>
        </div>

        <div className="bg-white border border-border-light rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <FolderOpen className="w-5 h-5 text-purple-500" />
            <Plus className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.totalRepos}</div>
          <div className="text-sm text-text-secondary">Repositories</div>
        </div>

        <div className="bg-white border border-border-light rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.totalStars}</div>
          <div className="text-sm text-text-secondary">Stars Received</div>
        </div>

        <div className="bg-white border border-border-light rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.totalCollaborators}</div>
          <div className="text-sm text-text-secondary">Collaborators</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/projects/new">
          <Button className="w-full h-16 flex items-center justify-center gap-3 text-base">
            <Plus className="w-5 h-5" />
            New Project
          </Button>
        </Link>
        
        <Link to="/projects">
          <Button variant="secondary" className="w-full h-16 flex items-center justify-center gap-3 text-base">
            <FolderOpen className="w-5 h-5" />
            My Projects
          </Button>
        </Link>
        
        <Link to="/search">
          <Button variant="secondary" className="w-full h-16 flex items-center justify-center gap-3 text-base">
            <Search className="w-5 h-5" />
            Explore
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-accent-blue hover:underline">
              View all →
            </Link>
          </div>

          {recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.slice(0, 6).map((project) => (
                <div key={project.id} className="bg-white border border-border-light rounded-lg p-4 hover:bg-bg-light transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-text-primary">{project.name}</h3>
                        {project.visibility === "private" && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                        {project.description || "No description provided"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <div className="flex items-center gap-1">
                          <GitCommit className="w-3 h-3" />
                          <span>Updated {formatRelativeTime(project.updatedAt)}</span>
                        </div>
                        {project.language && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{project.language}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link to={`/${project.ownerUsername}/${project.name}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-border-light rounded-lg p-12 text-center">
              <FolderOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No projects yet</h3>
              <p className="text-text-secondary mb-4">Create your first project to get started!</p>
              <Link to="/projects/new">
                <Button>Create Project</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
            <Button variant="ghost" size="sm">
              <Activity className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-white border border-border-light rounded-lg">
            {displayActivity.length > 0 ? (
              <div className="divide-y divide-border-light">
                {displayActivity.slice(0, 10).map((item) => (
                  <div key={item.id} className="p-4 hover:bg-bg-light transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary mb-1">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(item.createdAt)}</span>
                          {item.repo && (
                            <>
                              <span>•</span>
                              <Link to={`/${item.user}/${item.repo}`} className="hover:text-accent-blue">
                                {item.repo}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Activity className="w-8 h-8 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
