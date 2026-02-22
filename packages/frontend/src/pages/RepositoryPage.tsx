import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ChatPanel } from "../components/chat/ChatPanel";
import { RepoTerminalPanel } from "../components/repository/RepoTerminalPanel";
import { PollinationsPanel } from "../components/repository/PollinationsPanel";
import { RepoSidebar } from "../components/layout/RepoSidebar";
import { RepoHeader } from "../components/layout/RepoHeader";
import { RepoFilesView } from "../components/repository/RepoFilesView";
import { AdvancedFileBrowser } from "../components/repository/FileBrowser";
import { RepoSummaryPanel } from "../components/repository/RepoSummaryPanel";
import { RepoWorkflowsView } from "../components/repository/RepoWorkflowsView";
import "../styles/globals.css";

type RepoTab = "files" | "commits" | "branches" | "tags" | "pulls" | "issues" | "discussions" | "settings" | "devchat" | "terminal" | "ai" | "workflows" | "webhooks" | "search" | "manage" | "help";

interface RepositoryResponse {
  id: string;
  name: string;
  description?: string;
  owner: { id: string; username: string } | string;
  slug: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  isPrivate?: boolean;
  avatarUrl?: string;
}

export const RepositoryPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<RepoTab>("files");
  const [currentBranch, setCurrentBranch] = useState<string>("main");
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const navigate = useNavigate();

  const { data: repositoryData, loading, error } = useApi<RepositoryResponse>(
    () => api.get<RepositoryResponse>(`/repositories/${owner}/${repo}`),
    [owner, repo],
  );

  const { data: branches } = useApi<string[]>(
    () =>
      api
        .get<{ branches: string[] }>(`/repositories/${owner}/${repo}/branches`)
        .then((res) => ({
          ...res,
          data:
            (res.data as unknown as Array<{ name: string } | string>)?.map((entry) =>
              typeof entry === "string" ? entry : entry.name,
            ) || ["main"],
        })),
    [owner, repo],
  );

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

  const { data: starStatus, refetch: refetchStarStatus } = useApi<{
    starred: boolean;
    stars: number;
  }>(
    () => api.get(`/repositories/${owner}/${repo}/starred`),
    [owner, repo],
  );

  // Calculate ownerUsername after we have the data
  const ownerUsername = repositoryData 
    ? typeof repositoryData.owner === "string" 
      ? repositoryData.owner 
      : repositoryData.owner.username
    : owner || "";

  // Update starred state when API data changes
  React.useEffect(() => {
    if (starStatus) {
      setIsStarred(starStatus.starred);
    }
  }, [starStatus]);

  // Navigate to dedicated pages for certain tabs
  React.useEffect(() => {
    const routeMap: Record<string, string> = {
      issues: `/${ownerUsername}/${repo}/issues`,
      pulls: `/${ownerUsername}/${repo}/pulls`,
      discussions: `/${ownerUsername}/${repo}/discussions`,
      commits: `/${ownerUsername}/${repo}/commits`,
      branches: `/${ownerUsername}/${repo}/branches`,
      tags: `/${ownerUsername}/${repo}/tags`,
      webhooks: `/${ownerUsername}/${repo}/webhooks`,
      search: `/${ownerUsername}/${repo}/search`,
      manage: `/${ownerUsername}/${repo}/manage`,
      settings: `/${ownerUsername}/${repo}/settings`,
      help: `/${ownerUsername}/${repo}/help`,
    };

    if (routeMap[activeTab] && ownerUsername && repo) {
      navigate(routeMap[activeTab]);
    }
  }, [activeTab, ownerUsername, repo, navigate]);

  if (loading) return <LoadingSpinner message="Loading repository..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!repositoryData || !repo) return <ErrorMessage message="Repository not found" />;

  const branchList = branches && branches.length > 0 ? branches : ["main"];
  const selectedBranch = currentBranch || branchList[0];

  const handleStar = async () => {
    try {
      if (isStarred) {
        await api.delete(`/repositories/${owner}/${repo}/star`);
      } else {
        await api.post(`/repositories/${owner}/${repo}/star`);
      }
      // Refetch star status to get updated state
      refetchStarStatus();
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleFork = () => {
    // TODO: Implement actual fork API call
    window.open(`/${owner}/${repo}/fork`, '_blank');
  };

  const mainTabButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    borderRadius: "4px",
    border: active ? "1px solid #d0d7de" : "1px solid transparent",
    background: active ? "#fff" : "transparent",
    color: active ? "#24292f" : "#57606a",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
  });

  const renderMainContent = () => {
    if (activeTab === "files") {
      return <AdvancedFileBrowser owner={ownerUsername} repo={repo} branch={selectedBranch} />;
    }

    if (activeTab === "workflows") {
      return <RepoWorkflowsView />;
    }

    if (activeTab === "devchat") {
      return <ChatPanel room={`repo:${ownerUsername}/${repo}`} title="Repo DevChat" height="620px" />;
    }

    if (activeTab === "terminal") {
      return <RepoTerminalPanel owner={ownerUsername} repo={repo} branch={selectedBranch} />;
    }

    if (activeTab === "ai") {
      return <PollinationsPanel owner={ownerUsername} repo={repo} />;
    }

    // Show loading for tabs that navigate to separate pages
    return <LoadingSpinner message="Loading..." />;
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left sidebar */}
      <RepoSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <RepoHeader
          repositoryName={repo}
          isPrivate={repositoryData.isPrivate}
          currentBranch={selectedBranch}
          stars={starStatus?.stars || repoStats?.stars || 0}
          forks={repoStats?.forks || 0}
          isStarred={isStarred}
          onStar={handleStar}
          onFork={handleFork}
        />

        {/* Content area with files and summary */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 p-6 overflow-auto">
            {renderMainContent()}
          </div>

          {/* Summary panel - only show on files tab */}
          {activeTab === "files" && (
            <RepoSummaryPanel
              repositoryName={repo}
              createdAt={repositoryData.createdAt}
              commitsCount={repoStats?.commits || 0}
              branchesCount={repoStats?.branches || branchList.length}
              tagsCount={repoStats?.tags || 0}
              pullRequestsCount={repoStats?.openPullRequests || 0}
            />
          )}
        </div>
      </main>
    </div>
  );
};
