import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RepositoryPageNew } from "./pages/RepositoryPageNew";
import { IssueDetailPage } from "./pages/IssueDetailPage";
import { IssueCreatePage } from "./pages/IssueCreatePage";
import { PullRequestCreatePage } from "./pages/PullRequestCreatePage";
import { RepositorySettingsPage } from "./pages/RepositorySettingsPage";
import { ActionsPage } from "./pages/ActionsPage";
import { InsightsPage } from "./pages/InsightsPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { SearchPage } from "./pages/SearchPage";
import { CodeSearchPage } from "./pages/CodeSearchPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { CreateOrganizationPage } from "./pages/CreateOrganizationPage";
import { WorkflowEditorPage } from "./pages/WorkflowEditorPage";
import { FileEditorPage } from "./pages/FileEditorPage";
import { CommitsPage } from "./pages/CommitsPage";
import { CommitDetailPage } from "./pages/CommitDetailPage";
import { BranchesPage } from "./pages/BranchesPage";
import { TagsPage } from "./pages/TagsPage";
import { PullRequestsPage } from "./pages/PullRequestsPageNew";
import { PullRequestDetailPage } from "./pages/PullRequestDetailPageNew";
import { IssuesPage } from "./pages/IssuesPageNew";
import { DiscussionsPage } from "./pages/DiscussionsPageNew";
import { WebhooksPage } from "./pages/WebhooksPage";
import { RepositorySearchPage } from "./pages/RepositorySearchPage";
import { ManageRepositoryPage } from "./pages/ManageRepositoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import CreateRepoPage from "./pages/CreateRepoPage";

/**
 * Component to redirect logged-in users away from landing page
 */
const PublicOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

/**
 * Root application component.
 * Sets up routing, auth context, and toast notifications.
 */
export const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />

                        {/* Landing page - only for logged out users */}
                        <Route path="/" element={
                            <PublicOnlyRoute>
                                <LandingPage />
                            </PublicOnlyRoute>
                        } />

                        {/* Protected routes with layout */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/projects" element={<ProjectsPage />} />
                                <Route path="/admin/*" element={<AdminPage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/organizations/new" element={<CreateOrganizationPage />} />
                                <Route path="/workflows/editor" element={<WorkflowEditorPage />} />
                                <Route path="/projects/new" element={<CreateRepoPage />} />
                                {/* User profile route */}
                                <Route path="/:username" element={<UserProfilePage />} />
                            </Route>

                            {/* GitHub-like routes - :owner/:repo (use repository-specific layout) */}
                            <Route path="/:owner/:repo" element={<RepositoryPageNew />} />
                            <Route path="/:owner/:repo/new" element={<FileEditorPage />} />
                            <Route path="/:owner/:repo/issues" element={<IssuesPage />} />
                            <Route path="/:owner/:repo/commits" element={<CommitsPage />} />
                            <Route path="/:owner/:repo/commits/:sha" element={<CommitDetailPage />} />
                            <Route path="/:owner/:repo/branches" element={<BranchesPage />} />
                            <Route path="/:owner/:repo/tags" element={<TagsPage />} />
                            <Route path="/:owner/:repo/pulls" element={<PullRequestsPage />} />
                            <Route path="/:owner/:repo/pulls/:number" element={<PullRequestDetailPage />} />
                            <Route path="/:owner/:repo/discussions" element={<DiscussionsPage />} />
                            <Route path="/:owner/:repo/webhooks" element={<WebhooksPage />} />
                            <Route path="/:owner/:repo/search" element={<RepositorySearchPage />} />
                            <Route path="/:owner/:repo/manage" element={<ManageRepositoryPage />} />
                            <Route path="/:owner/:repo/settings" element={<RepositorySettingsPage />} />
                            <Route path="/:owner/:repo/issues/create" element={<IssueCreatePage />} />
                            <Route path="/:owner/:repo/issues/new" element={<IssueCreatePage />} />
                            <Route path="/:owner/:repo/issues/:number" element={<IssueDetailPage />} />
                            <Route path="/:owner/:repo/pulls/create" element={<PullRequestCreatePage />} />
                            <Route path="/:owner/:repo/pulls/new" element={<PullRequestCreatePage />} />
                            <Route path="/:owner/:repo/actions" element={<ActionsPage />} />
                            <Route path="/:owner/:repo/insights" element={<InsightsPage />} />

                        </Route>

                        {/* Fallback */}
                        <Route path="/404" element={<NotFoundPage />} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};
