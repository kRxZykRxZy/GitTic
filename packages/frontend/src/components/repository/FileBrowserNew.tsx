import React, { useState, useEffect } from 'react';
import { File, Folder, GitCommit, ChevronRight, ChevronDown } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api-client';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { FileViewer } from './FileViewer';

export interface FileTreeItem {
    type: "file" | "directory";
    name: string;
    path: string;
    size?: number;
    lastCommitDate?: string;
    lastCommitHash?: string;
    lastCommitMessage?: string;
}

interface FileBrowserProps {
    branch?: string;
    onFileClick?: (file: FileTreeItem) => void;
    initialPath?: string;
}

export const FileBrowserNew: React.FC<FileBrowserProps> = ({ 
    branch = 'main',
    onFileClick,
    initialPath = ''
}) => {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
    const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null);

    const { data: treeData, loading, error, refetch } = useApi<{
        path: string;
        branch: string;
        entries: FileTreeItem[];
    }>(
        () => api.get(`/repositories/${owner}/${repo}/tree/${branch}/${currentPath}`),
        [owner, repo, branch, currentPath],
    );

    const toggleDirectory = (path: string) => {
        const newExpanded = new Set(expandedDirs);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedDirs(newExpanded);
    };

    const handleFileClick = (file: FileTreeItem) => {
        if (file.type === 'directory') {
            setCurrentPath(file.path);
        } else {
            setSelectedFile(file);
            onFileClick?.(file);
        }
    };

    const navigateToPath = (path: string) => {
        setCurrentPath(path);
    };

    const getPathSegments = () => {
        if (!currentPath) return [];
        return currentPath.split('/').filter(Boolean);
    };

    if (loading) return <LoadingSpinner message="Loading files..." />;
    if (error) return <ErrorMessage message={error} onRetry={refetch} />;
    if (!treeData) return <ErrorMessage message="Unable to load files" />;

    const pathSegments = getPathSegments();

    // If a file is selected, show the file viewer
    if (selectedFile) {
        return (
            <FileViewer
                filePath={selectedFile.path}
                branch={branch}
                onClose={() => setSelectedFile(null)}
            />
        );
    }

    return (
        <div className="bg-main-bg">
            {/* Path Navigation */}
            <div className="px-6 py-3 border-b border-border bg-gray-50">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => navigateToPath('')}
                        className="text-text-secondary hover:text-text-primary transition-colors"
                    >
                        {repo}
                    </button>
                    {pathSegments.map((segment, index) => {
                        const pathSoFar = pathSegments.slice(0, index + 1).join('/');
                        return (
                            <React.Fragment key={pathSoFar}>
                                <span className="text-text-muted">/</span>
                                <button
                                    onClick={() => navigateToPath(pathSoFar)}
                                    className="text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    {segment}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Files Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Size
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Last Modified
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {/* Go back directory */}
                        {currentPath && (
                            <tr 
                                className="hover:bg-file-hover cursor-pointer transition-colors"
                                onClick={() => navigateToPath(currentPath.split('/').slice(0, -1).join('/'))}
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="w-4 h-4 text-text-secondary" />
                                        <span className="text-sm text-text-primary">..</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-text-secondary">
                                    —
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-text-secondary">
                                    —
                                </td>
                            </tr>
                        )}
                        
                        {/* Files and directories */}
                        {treeData.entries.map((file, index) => (
                            <tr 
                                key={file.path}
                                className="hover:bg-file-hover cursor-pointer transition-colors"
                                onClick={() => handleFileClick(file)}
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {file.type === 'directory' ? (
                                            <Folder className="w-4 h-4 text-text-secondary" />
                                        ) : (
                                            <File className="w-4 h-4 text-text-secondary" />
                                        )}
                                        <span className="text-sm text-text-primary">{file.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-text-secondary">
                                    {file.type === 'file' && file.size ? (
                                        file.size < 1024 ? `${file.size} B` :
                                        file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` :
                                        `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-text-secondary">
                                    {file.lastCommitDate || '—'}
                                </td>
                            </tr>
                        ))}
                        
                        {/* Empty state */}
                        {treeData.entries.length === 0 && !currentPath && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-text-muted">
                                    <div className="flex flex-col items-center gap-2">
                                        <File className="w-8 h-8 text-text-secondary" />
                                        <span>This repository is empty</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        
                        {treeData.entries.length === 0 && currentPath && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-text-muted">
                                    <div className="flex flex-col items-center gap-2">
                                        <Folder className="w-8 h-8 text-text-secondary" />
                                        <span>This directory is empty</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
