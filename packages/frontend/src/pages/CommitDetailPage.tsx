import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitCommit, ArrowLeft, GitBranch, User, Calendar, FileText, RotateCcw, Eye } from 'lucide-react';
import { Button, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface Commit {
    sha: string;
    message: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
    committer: {
        name: string;
        email: string;
        date: string;
    };
    parents: string[];
    stats?: {
        additions: number;
        deletions: number;
        total: number;
    };
    files?: Array<{
        filename: string;
        status: 'added' | 'removed' | 'modified' | 'renamed';
        additions: number;
        deletions: number;
    }>;
}

export const CommitDetailPage: React.FC = () => {
    const { owner, repo, sha } = useParams<{ owner: string; repo: string; sha: string }>();
    const toast = useToast();

    const { data: commit, loading, error, refetch } = useApi<Commit>(
        () => api.get(`/repositories/${owner}/${repo}/commits/${sha}`),
        [owner, repo, sha],
    );

    const { data: diff, loading: diffLoading } = useApi<string>(
        () => api.get(`/repositories/${owner}/${repo}/commits/${sha}/diff`),
        [owner, repo, sha],
    );

    const handleRevert = async () => {
        if (!confirm('Are you sure you want to revert this commit? This will create a new commit that undoes the changes.')) {
            return;
        }

        try {
            await api.post(`/repositories/${owner}/${repo}/commits/${sha}/revert`);
            toast.success('Commit reverted successfully');
        } catch (error) {
            toast.error('Failed to revert commit');
        }
    };

    if (loading) return <LoadingSpinner message="Loading commit details..." />;
    if (error) return <ErrorMessage message={error} onRetry={refetch} />;
    if (!commit) return <ErrorMessage message="Commit not found" />;

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 mb-6">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to={`/${owner}/${repo}/commits`}>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to commits
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <GitCommit className="w-5 h-5 text-gray-500" />
                                <span className="font-medium">Commit Details</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={handleRevert} className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Revert
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commit Info */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{commit.message}</h2>

                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{commit.author.name}</span>
                            <span className="text-gray-400">&lt;{commit.author.email}&gt;</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(commit.author.date).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                            SHA: {commit.sha}
                        </div>
                        {commit.stats && (
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-green-600">+{commit.stats.additions}</span>
                                <span className="text-red-600">-{commit.stats.deletions}</span>
                                <span className="text-gray-600">{commit.stats.total} total</span>
                            </div>
                        )}
                    </div>

                    {commit.parents.length > 0 && (
                        <div className="text-sm">
                            <span className="font-medium">Parents: </span>
                            {commit.parents.map((parent, index) => (
                                <span key={parent}>
                                    {index > 0 && ', '}
                                    <Link to={`/${owner}/${repo}/commits/${parent}`} className="text-blue-600 hover:underline font-mono">
                                        {parent.substring(0, 7)}
                                    </Link>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Files Changed */}
            {commit.files && commit.files.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Files Changed ({commit.files.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {commit.files.map((file, index) => (
                            <div key={index} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Badge variant={
                                        file.status === 'added' ? 'default' :
                                            file.status === 'removed' ? 'outline' :
                                                file.status === 'renamed' ? 'secondary' : 'outline'
                                    }>
                                        {file.status}
                                    </Badge>
                                    <span className="font-mono text-sm">{file.filename}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    {file.additions > 0 && <span className="text-green-600">+{file.additions}</span>}
                                    {file.deletions > 0 && <span className="text-red-600">-{file.deletions}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Diff View */}
            {diff && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="font-medium flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Diff View
                        </h3>
                    </div>
                    <div className="p-6">
                        {diffLoading ? (
                            <LoadingSpinner message="Loading diff..." />
                        ) : (
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                {diff}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
