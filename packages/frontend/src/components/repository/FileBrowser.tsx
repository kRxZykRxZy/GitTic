import React, { useState, useEffect } from 'react';
import { File, Folder, GitCommit } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api-client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useToast } from '../../hooks/useToast';
import { useSearchParams } from 'react-router-dom';

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
    files: FileTreeItem[];
    onFileClick?: (file: FileTreeItem) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ 
    files, 
    onFileClick 
}) => {
    return (
        <div className="space-y-4">
            {files.map((file) => (
                <div key={file.path} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    {file.type === 'directory' ? (
                        <Folder className="w-4 h-4 text-blue-500" />
                    ) : (
                        <File className="w-4 h-4 text-gray-500" />
                    )}
                    <span 
                        className="text-sm cursor-pointer hover:text-blue-600"
                        onClick={() => onFileClick?.(file)}
                    >
                        {file.name}
                    </span>
                </div>
            ))}
            {files.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No files in this directory
                </div>
            )}
        </div>
    );
};

interface AdvancedFileBrowserProps {
    owner: string;
    repo: string;
    branch?: string;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ 
    files, 
    onFileClick 
}) => {
    const defaultFiles: FileTreeItem[] = [
        {
            type: 'file',
            name: '.gitignore',
            path: '.gitignore',
            lastCommitDate: '4 seconds ago',
            lastCommitHash: '7ad856',
            lastCommitMessage: 'initial commit'
        },
        {
            type: 'file',
            name: 'LICENSE',
            path: 'LICENSE',
            lastCommitDate: '4 seconds ago',
            lastCommitHash: '7ad856',
            lastCommitMessage: 'initial commit'
        },
        {
            type: 'file',
            name: 'README.md',
            path: 'README.md',
            lastCommitDate: '4 seconds ago',
            lastCommitHash: '7ad856',
            lastCommitMessage: 'initial commit'
        }
    ];

    const displayFiles = files.length > 0 ? files : defaultFiles;

/**
 * Repository file browser with upload, delete, and navigation.
 */
export const AdvancedFileBrowser: React.FC<AdvancedFileBrowserProps> = ({ owner, repo, branch = "main" }) => {
    const [currentPath, setCurrentPath] = useState<string>("");
    const [showCreateFile, setShowCreateFile] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [newFileContent, setNewFileContent] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
    const [selectedFileContent, setSelectedFileContent] = useState<string>("");
    const [loadingFileContent, setLoadingFileContent] = useState(false);
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        if (type === "success") toast.success(message);
        else if (type === "error") toast.error(message);
        else toast.info(message);
    };

    // Handle createFolder query parameter
    useEffect(() => {
        if (searchParams.get('createFolder') === 'true') {
            setShowCreateFolder(true);
            // Remove the query parameter from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    const { data: tree, loading, error, refetch } = useApi<{ path: string; branch: string; entries: FileTreeItem[] }>(
        () => api.get<{ path: string; branch: string; entries: FileTreeItem[] }>(`/repositories/${owner}/${repo}/tree/${branch}?path=${encodeURIComponent(currentPath)}`),
        [owner, repo, branch, currentPath],
    );

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
    };

    const handleCreateFile = async () => {
        if (!newFileName || !newFileContent) {
            showToast("Please provide both file name and content", "error");
            return;
        }

        try {
            const filePath = currentPath ? `${currentPath}/${newFileName}` : newFileName;

            await api.post(`/repositories/${owner}/${repo}/files`, {
                branch,
                path: filePath,
                content: newFileContent,
                message: `Add ${newFileName}`,
            });

            showToast("File created successfully", "success");
            setShowCreateFile(false);
            setNewFileName("");
            setNewFileContent("");
            refetch();
        } catch (err) {
            showToast("Failed to create file", "error");
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            showToast("Folder name is required", "error");
            return;
        }

        try {
            const folderPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
            await api.post(`/repositories/${owner}/${repo}/files`, {
                branch,
                path: folderPath,
                type: "directory",
                message: `Create folder ${newFolderName.trim()}`,
            });

            showToast("Folder created successfully", "success");
            setShowCreateFolder(false);
            setNewFolderName("");
            refetch();
        } catch {
            showToast("Failed to create folder", "error");
        }
    };

    const handleDeletePath = async (path: string, type: "file" | "directory") => {
        if (!confirm(`Are you sure you want to delete ${type} '${path}'?`)) {
            return;
        }

        try {
            await api.delete(`/repositories/${owner}/${repo}/files?branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}&type=${type}`);
            showToast(`${type === "directory" ? "Folder" : "File"} deleted successfully`, "success");
            if (selectedFilePath === path) {
                setSelectedFilePath(null);
                setSelectedFileContent("");
            }
            refetch();
        } catch {
            showToast(`Failed to delete ${type}`, "error");
        }
    };

    const handleFileClick = async (item: FileTreeItem) => {
        if (item.type === "directory") {
            handleNavigate(item.path);
        } else {
            try {
                setLoadingFileContent(true);
                const response = await api.get<{ content: string; path: string }>(
                    `/repositories/${owner}/${repo}/blob/${branch}/${item.path}`,
                );
                setSelectedFilePath(item.path);
                setSelectedFileContent(response.data.content || "");
            } catch {
                showToast("Failed to load file", "error");
            } finally {
                setLoadingFileContent(false);
            }
        }
    };

    const handleBackNavigation = () => {
        const parts = currentPath.split("/");
        parts.pop();
        setCurrentPath(parts.join("/"));
    };

    const containerStyle: React.CSSProperties = {
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        background: "var(--bg-secondary)",
    };

    const headerStyle: React.CSSProperties = {
        padding: "12px 16px",
        background: "var(--bg-tertiary)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
    };

    const breadcrumbStyle: React.CSSProperties = {
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
    };

    const actionButtonStyle: React.CSSProperties = {
        padding: "4px 12px",
        fontSize: "13px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    };

    const fileListStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
    };

    const fileRowStyle: React.CSSProperties = {
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "background 0.15s",
    };

    const fileInfoStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flex: 1,
    };

    const uploadFormStyle: React.CSSProperties = {
        padding: "16px",
        background: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    };

    const inputStyle: React.CSSProperties = {
        padding: "8px 12px",
        fontSize: "14px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
    };

    const textareaStyle: React.CSSProperties = {
        ...inputStyle,
        minHeight: "150px",
        fontFamily: "monospace",
        resize: "vertical" as const,
    };

    if (loading) return <LoadingSpinner message="Loading files..." />;
    if (error) return <ErrorMessage message={error} onRetry={refetch} />;

    const files = tree?.entries ?? [];

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={breadcrumbStyle}>
                    <span>📁</span>
                    <strong>{owner}</strong>
                    <span>/</span>
                    <strong>{repo}</strong>
                    {currentPath && (
                        <>
                            <span>/</span>
                            <span>{currentPath}</span>
                        </>
                    )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        style={actionButtonStyle}
                        onClick={() => {
                            setShowCreateFolder(false);
                            setShowCreateFile((prev) => !prev);
                        }}
                    >
                        {showCreateFile ? "✕ Cancel" : "➕ Create File"}
                    </button>
                    <button
                        style={actionButtonStyle}
                        onClick={() => {
                            setShowCreateFile(false);
                            setShowCreateFolder((prev) => !prev);
                        }}
                    >
                        {showCreateFolder ? "✕ Cancel" : "📁 Create Folder"}
                    </button>
                </div>
            </div>

            {showCreateFile && (
                <div style={uploadFormStyle}>
                    <input
                        type="text"
                        placeholder="File name (e.g., src/index.ts)"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        style={inputStyle}
                    />
                    <textarea
                        placeholder="File content..."
                        value={newFileContent}
                        onChange={(e) => setNewFileContent(e.target.value)}
                        style={textareaStyle}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button style={actionButtonStyle} onClick={handleCreateFile}>
                            💾 Create File
                        </button>
                        <button style={actionButtonStyle} onClick={() => setShowCreateFile(false)}>
                            ✕ Cancel
                        </button>
                    </div>
                </div>
            )}

            {showCreateFolder && (
                <div style={uploadFormStyle}>
                    <input
                        type="text"
                        placeholder="Folder name (e.g., src/components)"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        style={inputStyle}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button style={actionButtonStyle} onClick={handleCreateFolder}>
                            📁 Create Folder
                        </button>
                        <button style={actionButtonStyle} onClick={() => setShowCreateFolder(false)}>
                            ✕ Cancel
                        </button>
                    </div>
                </div>
            )}

            <div style={fileListStyle}>
                {currentPath && (
                    <div
                        style={{ ...fileRowStyle, background: "var(--bg-tertiary)" }}
                        onClick={handleBackNavigation}
                    >
                        <div style={fileInfoStyle}>
                            <span>↩️</span>
                            <span>..</span>
                        </div>
                    </div>
                )}

                {files.map((item) => (
                    <div
                        key={item.path}
                        style={fileRowStyle}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = "var(--bg-tertiary)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = "transparent";
                        }}
                    >
                        <div style={fileInfoStyle} onClick={() => handleFileClick(item)}>
                            <span>{item.type === "directory" ? "📁" : "📄"}</span>
                            <span>{item.name}</span>
                            {item.size !== undefined && (
                                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                    {item.size < 1024
                                        ? `${item.size} B`
                                        : item.size < 1024 * 1024
                                            ? `${(item.size / 1024).toFixed(1)} KB`
                                            : `${(item.size / (1024 * 1024)).toFixed(1)} MB`}
                                </span>
                            )}
                        </div>
                        <button
                            style={{
                                ...actionButtonStyle,
                                padding: "2px 8px",
                                background: "var(--accent-red)",
                                color: "#fff",
                                border: "none",
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePath(item.path, item.type);
                            }}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                ))}

                {files.length === 0 && (
                    <div
                        style={{
                            padding: "32px",
                            textAlign: "center",
                            color: "var(--text-secondary)",
                            fontSize: "14px",
                        }}
                    >
                        This directory is empty
                    </div>
                )}
            </div>

            <div
                style={{
                    borderTop: "1px solid var(--border-color)",
                    background: "var(--bg-primary)",
                    minHeight: "220px",
                }}
            >
                <div
                    style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border-color)",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                    }}
                >
                    {selectedFilePath ? `Preview: ${selectedFilePath}` : "Select a file to preview"}
                </div>
                <pre
                    style={{
                        margin: 0,
                        padding: "16px",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        overflowX: "auto",
                        color: "var(--text-primary)",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        maxHeight: "420px",
                    }}
                >
                    {loadingFileContent
                        ? "Loading file..."
                        : selectedFilePath
                            ? selectedFileContent || "(Empty file)"
                            : "Open a file from the list above to see its code."}
                </pre>
            </div>
        </div>
    );
};
