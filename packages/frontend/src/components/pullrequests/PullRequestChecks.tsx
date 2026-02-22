import React, { useState } from 'react';
import {
    PullRequestChecksProps,
    CheckStatus,
    CheckConclusion,
    PRCheckRun,
    PRStatusCheck,
} from './types';

type StatusDisplay = {
    class: string;
    label: string;
    icon?: string;
    color?: string;
};

/**
 * PullRequestChecks Component
 *
 * Displays CI/CD check runs and status checks for a pull request.
 * Shows check status, conclusions, and allows retrying failed checks.
 *
 * Features:
 * - Display check runs with status indicators
 * - Display status checks (GitHub checks, etc.)
 * - Expand/collapse check details
 * - View check output and annotations
 * - Retry failed checks
 * - Loading and error states
 * - Color-coded status indicators
 * - Timestamp information
 *
 * @example
 * ```tsx
 * <PullRequestChecks
 *   checkRuns={checks}
 *   statusChecks={statusChecks}
 *   onRetryCheck={handleRetry}
 * />
 * ```
 */
const PullRequestChecks: React.FC<PullRequestChecksProps> = ({
    checkRuns,
    statusChecks = [],
    isLoading = false,
    onRetryCheck,
    className = '',
}) => {
    const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
    const [retryingCheckId, setRetryingCheckId] = useState<string | null>(null);

    /**
     * Get status badge styling and icon
     */
    const getStatusDisplay = (
        status: CheckStatus,
        conclusion?: CheckConclusion
    ): StatusDisplay => {
        const statusMap = {
            queued: {
                class: 'status-queued',
                label: '⏱ Queued',
                color: 'gray',
            },
            in_progress: {
                class: 'status-in-progress',
                label: '⏳ In Progress',
                color: 'blue',
            },
            completed: {
                class: 'status-completed',
                label: '✓ Completed',
                color: 'green',
            },
        };

        if (status === 'completed' && conclusion) {
            const conclusionMap = {
                success: {
                    class: 'conclusion-success',
                    label: '✓ Success',
                    icon: '✓',
                },
                failure: {
                    class: 'conclusion-failure',
                    label: '✗ Failed',
                    icon: '✗',
                },
                neutral: {
                    class: 'conclusion-neutral',
                    label: '◇ Neutral',
                    icon: '◇',
                },
                cancelled: {
                    class: 'conclusion-cancelled',
                    label: '⊘ Cancelled',
                    icon: '⊘',
                },
                timed_out: {
                    class: 'conclusion-timeout',
                    label: '⏱ Timed Out',
                    icon: '⏱',
                },
                action_required: {
                    class: 'conclusion-action',
                    label: '⚠ Action Required',
                    icon: '⚠',
                },
                stale: {
                    class: 'conclusion-stale',
                    label: '◌ Stale',
                    icon: '◌',
                },
            };
            return conclusionMap[conclusion];
        }

        return statusMap[status];
    };

    /**
     * Get status check state badge
     */
    const getCheckStateDisplay = (state: string): StatusDisplay => {
        const stateMap: Record<PRStatusCheck['state'], StatusDisplay> = {
            pending: { class: 'state-pending', label: '⏳ Pending', color: 'blue' },
            success: { class: 'state-success', label: '✓ Success', color: 'green' },
            error: { class: 'state-error', label: '✗ Error', color: 'red' },
            failure: { class: 'state-failure', label: '✗ Failure', color: 'red' },
        };
        if (state in stateMap) {
            return stateMap[state as PRStatusCheck['state']];
        }
        return stateMap.pending;
    };

    /**
     * Format date to relative time
     */
    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const then = new Date(dateString);
        const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return then.toLocaleDateString();
    };

    /**
     * Format duration in seconds to readable time
     */
    const formatDuration = (seconds?: number) => {
        if (!seconds) return 'N/A';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    /**
     * Handle retry check
     */
    const handleRetry = async (checkId: string) => {
        setRetryingCheckId(checkId);
        try {
            await onRetryCheck?.(checkId);
        } catch (error) {
            console.error('Failed to retry check:', error);
        } finally {
            setRetryingCheckId(null);
        }
    };

    if (isLoading) {
        return (
            <div className={`pr-checks loading-state ${className}`}>
                <div className="skeleton-content">
                    {[1, 2].map((i) => (
                        <div key={i} className="skeleton-line" style={{ width: '100%' }} />
                    ))}
                </div>
            </div>
        );
    }

    const totalChecks = checkRuns.length + statusChecks.length;

    if (totalChecks === 0) {
        return (
            <div className={`pr-checks empty-state ${className}`}>
                <p>No checks have been run yet</p>
            </div>
        );
    }

    /**
     * Calculate check summary
     */
    const checkSummary = {
        total: checkRuns.length,
        success: checkRuns.filter((c) => c.conclusion === 'success').length,
        failure: checkRuns.filter((c) => c.conclusion === 'failure').length,
        in_progress: checkRuns.filter((c) => c.status === 'in_progress').length,
    };

    return (
        <div className={`pr-checks ${className}`}>
            <div className="checks-header">
                <h3 className="checks-title">✓ Checks</h3>
                <div className="checks-summary">
                    <span className="summary-item total">
                        {checkSummary.total} checks
                    </span>
                    {checkSummary.success > 0 && (
                        <span className="summary-item success">
                            ✓ {checkSummary.success} passed
                        </span>
                    )}
                    {checkSummary.failure > 0 && (
                        <span className="summary-item failure">
                            ✗ {checkSummary.failure} failed
                        </span>
                    )}
                    {checkSummary.in_progress > 0 && (
                        <span className="summary-item in-progress">
                            ⏳ {checkSummary.in_progress} in progress
                        </span>
                    )}
                </div>
            </div>

            {/* Check Runs Section */}
            {checkRuns.length > 0 && (
                <div className="checks-section">
                    <h4 className="section-title">Check Runs</h4>
                    <div className="checks-list">
                        {checkRuns.map((check) => {
                            const isExpanded = expandedCheckId === check.id;
                            const display = getStatusDisplay(check.status, check.conclusion);

                            return (
                                <div
                                    key={check.id}
                                    className={`check-item ${display?.class || ''} ${isExpanded ? 'expanded' : ''
                                        }`}
                                >
                                    <div
                                        className="check-header"
                                        onClick={() =>
                                            setExpandedCheckId(
                                                isExpanded ? null : check.id
                                            )
                                        }
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="check-info">
                                            <span className="check-icon">{display?.icon || '◇'}</span>
                                            <div className="check-details">
                                                <h5 className="check-name">{check.name}</h5>
                                                <span className={`check-status ${display?.class}`}>
                                                    {display?.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="check-meta">
                                            {check.completedAt && (
                                                <span className="check-time">
                                                    {formatRelativeTime(check.completedAt)}
                                                </span>
                                            )}
                                            {check.startedAt && check.completedAt && (
                                                <span className="check-duration">
                                                    {formatDuration(
                                                        Math.floor(
                                                            (new Date(check.completedAt).getTime() -
                                                                new Date(check.startedAt).getTime()) /
                                                            1000
                                                        )
                                                    )}
                                                </span>
                                            )}
                                            <span className="expand-icon">
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="check-expanded">
                                            {check.detailsUrl && (
                                                <div className="check-link">
                                                    <a href={check.detailsUrl} target="_blank" rel="noreferrer">
                                                        🔗 View in external service
                                                    </a>
                                                </div>
                                            )}

                                            {check.output && (
                                                <div className="check-output">
                                                    {check.output.title && (
                                                        <h6 className="output-title">
                                                            {check.output.title}
                                                        </h6>
                                                    )}
                                                    {check.output.summary && (
                                                        <p className="output-summary">
                                                            {check.output.summary}
                                                        </p>
                                                    )}
                                                    {check.output.text && (
                                                        <pre className="output-text">
                                                            {check.output.text}
                                                        </pre>
                                                    )}

                                                    {check.output.annotations && (
                                                        <div className="annotations">
                                                            <h6 className="annotations-title">
                                                                Annotations ({check.output.annotations.length})
                                                            </h6>
                                                            {check.output.annotations.map(
                                                                (annotation, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={`annotation annotation-${annotation.annotationLevel}`}
                                                                    >
                                                                        <div className="annotation-header">
                                                                            <span className="annotation-level">
                                                                                {annotation.annotationLevel.toUpperCase()}
                                                                            </span>
                                                                            <span className="annotation-location">
                                                                                {annotation.path}:{annotation.startLine}
                                                                            </span>
                                                                        </div>
                                                                        <p className="annotation-message">
                                                                            {annotation.message}
                                                                        </p>
                                                                        {annotation.title && (
                                                                            <p className="annotation-title">
                                                                                {annotation.title}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {check.conclusion === 'failure' && (
                                                <div className="check-actions">
                                                    <button
                                                        onClick={() => handleRetry(check.id)}
                                                        disabled={retryingCheckId === check.id}
                                                        className="btn btn-outline btn-sm"
                                                    >
                                                        {retryingCheckId === check.id ? '⏳ Retrying...' : '🔄 Retry'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Status Checks Section */}
            {statusChecks.length > 0 && (
                <div className="checks-section">
                    <h4 className="section-title">Status Checks</h4>
                    <div className="status-checks-list">
                        {statusChecks.map((check) => {
                            const display = getCheckStateDisplay(check.state);

                            return (
                                <div
                                    key={check.id}
                                    className={`status-check-item ${display.class}`}
                                >
                                    <div className="status-check-info">
                                        <span className="status-check-icon">●</span>
                                        <div className="status-check-details">
                                            <h5 className="status-check-context">
                                                {check.context}
                                            </h5>
                                            {check.description && (
                                                <p className="status-check-description">
                                                    {check.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="status-check-meta">
                                        <span className={`status-check-state ${display.class}`}>
                                            {display.label}
                                        </span>
                                        {check.targetUrl && (
                                            <a
                                                href={check.targetUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="status-check-link"
                                            >
                                                🔗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PullRequestChecks;
