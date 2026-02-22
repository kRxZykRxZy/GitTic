import React from 'react';
import { Issue, User } from './IssueList';

/**
 * Interface for label
 */
interface Label {
    id: string;
    name: string;
    color: string;
}

/**
 * Interface for timeline event
 */
export interface TimelineEvent {
    id: string;
    type: 'created' | 'commented' | 'closed' | 'reopened' | 'labeled' | 'unlabeled' | 'assigned' | 'unassigned' | 'milestone_changed' | 'status_changed';
    actor: User;
    createdAt: Date;
    description: string;
    metadata?: {
        labels?: Label[];
        user?: User;
        milestone?: { id: string; title: string };
        oldStatus?: string;
        newStatus?: string;
        [key: string]: unknown;
    };
}

/**
 * Props interface for IssueTimeline component
 */
interface IssueTimelineProps {
    /** Issue for context */
    issue: Issue;
    /** Timeline events */
    events: TimelineEvent[];
    /** Loading state */
    isLoading?: boolean;
    /** Error message */
    error?: string | null;
    /** Include issue creation event */
    showCreation?: boolean;
}

/**
 * IssueTimeline Component
 * 
 * Displays a chronological timeline of all activities on an issue including:
 * - Issue creation
 * - Comments
 * - Status changes
 * - Label changes
 * - Assignee changes
 * - Milestone changes
 * - Issue closure/reopening
 * 
 * Similar to GitHub's activity timeline.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueTimeline 
 *   issue={issue}
 *   events={timelineEvents}
 *   showCreation={true}
 * />
 * ```
 */
const IssueTimeline: React.FC<IssueTimelineProps> = ({
    issue,
    events,
    isLoading = false,
    error = null,
    showCreation = true,
}) => {
    /**
     * Format date to relative time
     */
    const formatRelativeDate = (date: Date) => {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(date).toLocaleDateString();
    };

    /**
     * Get icon for event type
     */
    const getEventIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'created':
                return (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h-6m0-6H6" />
                    </svg>
                );
            case 'commented':
                return (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-2H5a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-2.172a2 2 0 00-1.414.586l-4.414 4.414z" />
                    </svg>
                );
            case 'closed':
                return (
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                );
            case 'reopened':
                return (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
            case 'labeled':
            case 'unlabeled':
                return (
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                );
            case 'assigned':
            case 'unassigned':
                return (
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case 'milestone_changed':
                return (
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                );
            case 'status_changed':
                return (
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    /**
     * Get event label
     */
    const getEventLabel = (event: TimelineEvent): string => {
        switch (event.type) {
            case 'created':
                return 'created this issue';
            case 'commented':
                return 'commented';
            case 'closed':
                return 'closed this issue';
            case 'reopened':
                return 'reopened this issue';
            case 'labeled':
                return `added label${(event.metadata?.labels?.length ?? 0) > 1 ? 's' : ''}`;
            case 'unlabeled':
                return `removed label${(event.metadata?.labels?.length ?? 0) > 1 ? 's' : ''}`;
            case 'assigned':
                return 'assigned this issue';
            case 'unassigned':
                return 'unassigned this issue';
            case 'milestone_changed':
                return 'changed the milestone';
            case 'status_changed':
                return 'changed the status';
            default:
                return 'updated this issue';
        }
    };

    /**
     * Render event details
     */
    const renderEventDetails = (event: TimelineEvent) => {
        switch (event.type) {
            case 'labeled':
                return (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {event.metadata?.labels?.map((label) => (
                            <span
                                key={label.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: label.color + '20', color: label.color }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>
                );
            case 'unlabeled':
                return (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {event.metadata?.labels?.map((label) => (
                            <span
                                key={label.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>
                );
            case 'assigned':
                return (
                    <div className="mt-2 flex items-center gap-2">
                        {event.metadata?.user?.avatar ? (
                            <img
                                src={event.metadata.user.avatar}
                                alt={event.metadata.user.name}
                                className="w-6 h-6 rounded-full"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                {event.metadata?.user?.name.charAt(0)}
                            </div>
                        )}
                        <span className="text-sm text-gray-700">{event.metadata?.user?.name}</span>
                    </div>
                );
            case 'unassigned':
                return (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-700">{event.metadata?.user?.name}</span>
                    </div>
                );
            case 'milestone_changed':
                return (
                    <div className="mt-2">
                        {event.metadata?.milestone ? (
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {event.metadata.milestone.title}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-700">Milestone removed</span>
                        )}
                    </div>
                );
            case 'status_changed':
                return (
                    <div className="mt-2">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {String(event.metadata?.status ?? 'Unknown')}
                        </span>
                    </div>
                );
            default:
                return null;
        }
    };

    /**
     * Create timeline events array including creation event
     */
    const timelineEvents = [
        ...(showCreation
            ? [
                {
                    id: 'created',
                    type: 'created' as const,
                    actor: issue.createdBy,
                    createdAt: issue.createdAt,
                    description: 'created this issue',
                },
            ]
            : []),
        ...events,
    ];

    /**
     * Render loading state
     */
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="flex-grow space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32" />
                            <div className="h-3 bg-gray-200 rounded w-48" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /**
     * Render error state
     */
    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <h3 className="font-semibold">Failed to load timeline</h3>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    /**
     * Render empty state
     */
    if (timelineEvents.length === 0) {
        return (
            <div className="text-center py-8 text-gray-600">
                <p>No activity on this issue yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity</h2>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Events */}
                <div className="space-y-6">
                    {timelineEvents.map((event, index) => (
                        <div key={event.id} className="relative pl-16">
                            {/* Event icon */}
                            <div className="absolute left-0 top-1 w-12 h-12 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 z-10">
                                {getEventIcon(event.type)}
                            </div>

                            {/* Event content */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="font-semibold text-gray-900">{event.actor.name}</span>
                                        <span className="text-gray-600"> {getEventLabel(event)}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {formatRelativeDate(event.createdAt)}
                                    </span>
                                </div>

                                {/* Description */}
                                {event.description && (
                                    <p className="text-sm text-gray-700 mb-3">{event.description}</p>
                                )}

                                {/* Event-specific details */}
                                {renderEventDetails(event)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline summary */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">{timelineEvents.length}</span> events
                        {issue.closed && (
                            <>
                                {' • '}
                                <span className="text-red-600 font-medium">Closed {new Date(issue.closed).toLocaleDateString()}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueTimeline;
