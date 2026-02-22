import React from "react";
import { Link, useParams } from "react-router-dom";
import {
    FileText,
    GitCommit,
    GitBranch,
    Tag,
    GitPullRequest,
    Webhook,
    Search,
    Settings,
    HelpCircle,
    ArrowLeft,
    Grid3X3,
    Package,
    Terminal,
    AlertCircle,
    MessageSquare
} from "lucide-react";
import { Button, Avatar } from "../ui";

type RepoTab = "files" | "commits" | "branches" | "tags" | "pulls" | "issues" | "discussions" | "settings" | "devchat" | "terminal" | "ai" | "workflows" | "webhooks" | "search" | "manage" | "help";

interface RepoSidebarProps {
    activeTab: string;
    onTabChange: (tab: RepoTab) => void;
}

export const RepoSidebar: React.FC<RepoSidebarProps> = ({ activeTab, onTabChange }) => {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();

    const navigationItems: Array<{ id: RepoTab; label: string; icon: any }> = [
        { id: "files", label: "Files", icon: FileText },
        { id: "issues", label: "Issues", icon: AlertCircle },
        { id: "pulls", label: "Pull Requests", icon: GitPullRequest },
        { id: "discussions", label: "Discussions", icon: MessageSquare },
        { id: "commits", label: "Commits", icon: GitCommit },
        { id: "branches", label: "Branches", icon: GitBranch },
        { id: "tags", label: "Tags", icon: Tag },
        { id: "webhooks", label: "Webhooks", icon: Webhook },
        { id: "search", label: "Search", icon: Search },
        { id: "manage", label: "Manage Repository", icon: Settings },
        { id: "workflows", label: "Workflows", icon: Terminal },
        { id: "help", label: "Help", icon: HelpCircle },
    ];

    return (
        <aside
            className="w-64 flex flex-col h-screen"
            style={{
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
            }}
        >
            {/* Logo section */}
            <div
                className="p-5"
                style={{ borderBottom: '1px solid var(--border-color)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                        <Grid3X3 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-lg text-gray-900">Code Repository</span>
                </div>
            </div>

            {/* Account section */}
            <div className="p-4">
                <div
                    className="rounded-lg p-3 flex items-center justify-between"
                    style={{ background: 'var(--bg-primary)' }}
                >
                    <div>
                        <div className="text-xs text-gray-500 mb-1">ACCOUNT</div>
                        <div className="text-sm font-medium text-gray-900">{owner || "hi1992"}</div>
                    </div>
                    <HelpCircle className="w-4 h-4 text-gray-500" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 overflow-y-auto">
                <div className="mb-4">
                    <Link to="/repositories">
                        <Button variant="sidebar" className="mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Repositories
                        </Button>
                    </Link>
                </div>

                <div className="space-y-1">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <Button
                                key={item.id}
                                variant={isActive ? "sidebarActive" : "sidebar"}
                                onClick={() => onTabChange(item.id)}
                                className="justify-start"
                            >
                                <Icon className="w-4 h-4 mr-3" />
                                {item.label}
                            </Button>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom user section */}
            <div
                className="p-4"
                style={{ borderTop: '1px solid var(--border-color)' }}
            >
                <Button variant="sidebar" className="w-full justify-between">
                    <div className="flex items-center">
                        <Avatar size="sm" fallback="kR" className="w-6 h-6 mr-2" />
                        <span className="text-sm text-gray-900">kRxZy</span>
                    </div>
                    <div className="w-3 h-3 text-gray-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </Button>
            </div>
        </aside>
    );
};
