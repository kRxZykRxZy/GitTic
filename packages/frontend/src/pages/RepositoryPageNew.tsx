import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { RepositorySidebar } from "../components/repository/RepositorySidebar";
import { RepositoryHeader } from "../components/repository/RepositoryHeader";
import { FileBrowserNew } from "../components/repository/FileBrowserNew";
import { ReadmePreview } from "../components/repository/ReadmePreview";
import { SummarySidebar } from "../components/repository/SummarySidebar";
import { CommitsPage } from "./CommitsPage";
import { BranchesPage } from "./BranchesPage";
import { TagsPage } from "./TagsPage";

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

export const RepositoryPageNew: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<RepoTab>("files");
  const [currentBranch, setCurrentBranch] = useState<string>("main");

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !repositoryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage message={`Failed to load repository: ${error || 'Unknown error'}`} />
      </div>
    );
  }

  const ownerName = typeof repositoryData.owner === 'string' ? repositoryData.owner : repositoryData.owner.username;
  const createdDate = repositoryData.createdAt 
    ? new Date(repositoryData.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) 
    : 'Unknown';

  return (
    <div className="flex h-screen bg-main-bg">
      {/* Left Sidebar */}
      <RepositorySidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as RepoTab)}
        owner={ownerName}
        repo={repositoryData.name}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <RepositoryHeader
          owner={ownerName}
          repo={repositoryData.name}
          isPrivate={repositoryData.isPrivate || false}
          currentBranch={currentBranch}
          onBranchChange={setCurrentBranch}
        />

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "files" && (
              <div className="p-6">
                {/* File Browser */}
                <FileBrowserNew
                  branch={currentBranch}
                  onFileClick={(file) => {
                    console.log('File clicked:', file);
                    // TODO: Navigate to file viewer/editor
                  }}
                />

                {/* README Preview */}
                <ReadmePreview
                  branch={currentBranch}
                  onEdit={() => {
                    console.log('Edit README');
                  }}
                />
              </div>
            )}

            {/* Other tabs can be added here */}
            {activeTab === "commits" && (
              <div className="p-6">
                <CommitsPage />
              </div>
            )}

            {activeTab === "branches" && (
              <div className="p-6">
                <BranchesPage />
              </div>
            )}

            {activeTab === "tags" && (
              <div className="p-6">
                <TagsPage />
              </div>
            )}

            {activeTab === "pulls" && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Pull Requests</h2>
                <p className="text-text-secondary">Pull Requests view coming soon...</p>
              </div>
            )}

            {activeTab === "webhooks" && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Webhooks</h2>
                <p className="text-text-secondary">Webhooks configuration coming soon...</p>
              </div>
            )}

            {activeTab === "search" && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Search</h2>
                <p className="text-text-secondary">Repository search coming soon...</p>
              </div>
            )}

            {activeTab === "manage" && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Manage Repository</h2>
                <p className="text-text-secondary">Repository management coming soon...</p>
              </div>
            )}

            {activeTab === "help" && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Help</h2>
                <p className="text-text-secondary">Help documentation coming soon...</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Summary */}
          {activeTab === "files" && (
            <SummarySidebar
              repositoryName={repositoryData.name}
              createdAt={createdDate}
            />
          )}
        </div>
      </div>
    </div>
  );
};
