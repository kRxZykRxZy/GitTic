import React, { useState } from 'react';
import { PullRequestFilesProps, AddInlineCommentData } from './types';

/**
 * PullRequestFiles Component
 *
 * Displays files changed in a pull request with inline commenting capabilities.
 * Shows file diffs, additions/deletions, and allows adding comments on specific lines.
 *
 * Features:
 * - File list with change statistics
 * - File selection and navigation
 * - Inline diff viewing
 * - Line-by-line commenting
 * - Inline comment display and deletion
 * - Loading and error states
 * - File type icons
 * - Search/filter files
 *
 * @example
 * ```tsx
 * <PullRequestFiles
 *   files={fileChanges}
 *   inlineComments={comments}
 *   onSelectFile={handleSelectFile}
 * />
 * ```
 */
const PullRequestFiles: React.FC<PullRequestFilesProps> = ({
    files,
    inlineComments = [],
    selectedFile,
    onSelectFile,
    onAddInlineComment,
    onDeleteInlineComment,
    isLoading = false,
    className = '',
}) => {
    const [filterSearch, setFilterSearch] = useState('');
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
        selectedFile ? new Set([selectedFile]) : new Set()
    );
    const [commentingLine, setCommentingLine] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    /**
     * Get file icon based on file extension
     */
    const getFileIcon = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase();
        const iconMap: Record<string, string> = {
            js: '📜',
            jsx: '⚛️',
            ts: '📘',
            tsx: '⚛️',
            py: '🐍',
            java: '☕',
            go: '🐹',
            rs: '🦀',
            cpp: '➕',
            c: 'Ⓒ',
            html: '🌐',
            css: '🎨',
            scss: '🎨',
            less: '🎨',
            json: '📋',
            yaml: '⚙️',
            yml: '⚙️',
            md: '📝',
            txt: '📄',
        };
        return iconMap[ext || 'txt'] || '📄';
    };

    /**
     * Get change status styling
     */
    const getStatusClass = (status: string) => {
        const statusMap: Record<string, string> = {
            added: 'status-added',
            removed: 'status-removed',
            modified: 'status-modified',
            renamed: 'status-renamed',
            copied: 'status-copied',
        };
        return statusMap[status] || 'status-modified';
    };

    /**
     * Toggle file expansion
     */
    const toggleFileExpand = (path: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFiles(newExpanded);
        onSelectFile?.(path);
    };

    /**
     * Handle adding inline comment
     */
    const handleAddComment = async (path: string, line: number) => {
        if (!commentText.trim()) {
            return;
        }

        setSubmitLoading(true);
        try {
            const data: AddInlineCommentData = {
                filePath: path,
                line,
                body: commentText,
            };
            await onAddInlineComment?.(data);
            setCommentText('');
            setCommentingLine(null);
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    /**
     * Get inline comments for specific line
     */
    const getCommentsForLine = (path: string, line: number) => {
        return inlineComments.filter(
            (comment) => comment.path === path && comment.line === line
        );
    };

    /**
     * Filter files based on search
     */
    const filteredFiles = filterSearch
        ? files.filter((file) =>
            file.path.toLowerCase().includes(filterSearch.toLowerCase())
        )
        : files;

    if (isLoading) {
        return (
            <div className={`pr-files loading-state ${className}`}>
                <div className="skeleton-content">
                    <div className="skeleton-line" style={{ width: '100%' }} />
                    <div className="skeleton-line" style={{ width: '80%' }} />
                </div>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className={`pr-files empty-state ${className}`}>
                <p>No files changed</p>
            </div>
        );
    }

    return (
        <div className={`pr-files ${className}`}>
            <div className="files-header">
                <h3 className="files-title">
                    📝 Files Changed <span className="file-count">({files.length})</span>
                </h3>

                <div className="files-search">
                    <input
                        type="text"
                        placeholder="Filter files..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="files-summary">
                <span className="summary-item additions">
                    +{files.reduce((sum, f) => sum + f.additions, 0)} additions
                </span>
                <span className="summary-item deletions">
                    -{files.reduce((sum, f) => sum + f.deletions, 0)} deletions
                </span>
            </div>

            <div className="files-list">
                {filteredFiles.map((file) => {
                    const isExpanded = expandedFiles.has(file.path);
                    const comments = getCommentsForLine(file.path, 0);

                    return (
                        <div key={file.path} className={`file-item ${getStatusClass(file.status)}`}>
                            <div
                                className="file-header"
                                onClick={() => toggleFileExpand(file.path)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="file-info">
                                    <span className="file-icon">{getFileIcon(file.path)}</span>
                                    <div className="file-path-section">
                                        <span className="file-path">{file.path}</span>
                                        {file.status === 'renamed' && file.previousPath && (
                                            <span className="file-previous">← {file.previousPath}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="file-stats">
                                    <span className="stat additions">+{file.additions}</span>
                                    <span className="stat deletions">-{file.deletions}</span>
                                    <span className="status-badge">{file.status}</span>
                                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="file-content">
                                    {file.patch ? (
                                        <div className="file-diff">
                                            <pre className="diff-content">{file.patch}</pre>
                                        </div>
                                    ) : (
                                        <div className="file-content-placeholder">
                                            <p>Diff not available for this file</p>
                                        </div>
                                    )}

                                    <div className="file-comments">
                                        {comments.length > 0 &&
                                            comments.map((comment) => (
                                                <div key={comment.id} className="inline-comment">
                                                    <div className="comment-header">
                                                        <strong>{comment.author.username}</strong>
                                                        <button
                                                            onClick={() =>
                                                                onDeleteInlineComment?.(comment.id)
                                                            }
                                                            className="delete-btn"
                                                            title="Delete comment"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                    <p className="comment-body">{comment.body}</p>
                                                </div>
                                            ))}
                                    </div>

                                    {commentingLine === file.path ? (
                                        <div className="add-comment-form">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="comment-input"
                                                rows={3}
                                                disabled={submitLoading}
                                            />
                                            <div className="form-actions">
                                                <button
                                                    onClick={() =>
                                                        handleAddComment(file.path, 0)
                                                    }
                                                    disabled={
                                                        submitLoading || !commentText.trim()
                                                    }
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    {submitLoading ? 'Posting...' : 'Comment'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCommentingLine(null);
                                                        setCommentText('');
                                                    }}
                                                    disabled={submitLoading}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setCommentingLine(file.path)}
                                            className="btn btn-outline btn-sm"
                                        >
                                            💬 Add comment
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PullRequestFiles;
