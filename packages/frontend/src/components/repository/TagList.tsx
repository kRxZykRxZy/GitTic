import React, { useState, useMemo } from 'react';

/**
 * Interface for tag/release information
 */
export interface Tag {
  name: string;
  commitSha: string;
  commitUrl?: string;
  tagDate?: string;
  isRelease?: boolean;
  releaseNotes?: string;
  author?: {
    name: string;
    email?: string;
    date?: string;
  };
  downloadUrl?: string;
  prerelease?: boolean;
  draft?: boolean;
}

/**
 * Props for the TagList component
 */
export interface TagListProps {
  /** Array of tags/releases */
  tags: Tag[];
  /** Callback when a tag is clicked */
  onTagClick?: (tag: Tag) => void;
  /** Currently selected tag name */
  selectedTagName?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Show releases only or all tags */
  showReleasesOnly?: boolean;
  /** Show release notes */
  showNotes?: boolean;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Custom className */
  className?: string;
  /** Maximum tags to display initially */
  pageSize?: number;
}

/**
 * TagList Component
 * 
 * A production-quality tag and release list component.
 * Similar to GitHub's releases and tags page with version management features.
 * 
 * Features:
 * - Tag and release list display
 * - Release notes viewing
 * - Download links for releases
 * - Pre-release and draft badges
 * - Pagination support
 * - Search and filter capabilities
 * - Release notes expansion
 * - Responsive design
 */
export const TagList: React.FC<TagListProps> = ({
  tags,
  onTagClick,
  selectedTagName,
  isLoading = false,
  error = null,
  showReleasesOnly = false,
  showNotes = true,
  sortOrder = 'desc',
  className = '',
  pageSize = 10,
}) => {
  const [displayedCount, setDisplayedCount] = useState(pageSize);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let filtered = tags.filter((tag) => {
      if (showReleasesOnly && !tag.isRelease) return false;
      if (searchTerm) {
        return tag.name.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.tagDate || 0).getTime();
      const dateB = new Date(b.tagDate || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [tags, showReleasesOnly, searchTerm, sortOrder]);

  // Display tags
  const displayedTags = filteredTags.slice(0, displayedCount);
  const hasMore = displayedCount < filteredTags.length;

  // Toggle expanded release notes
  const toggleExpanded = (tagName: string) => {
    const newSet = new Set(expandedTags);
    if (newSet.has(tagName)) {
      newSet.delete(tagName);
    } else {
      newSet.add(tagName);
    }
    setExpandedTags(newSet);
  };

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get short SHA
  const getShortSha = (sha: string): string => {
    return sha.substring(0, 7);
  };

  // Copy to clipboard
  const handleCopy = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`tag-list ${className}`}>
      {/* Header */}
      <div className="tag-list-header">
        <h2>
          {showReleasesOnly ? '🚀 Releases' : '🏷️ Tags & Releases'}
        </h2>
        <div className="tag-search-container">
          <input
            type="text"
            className="tag-search-input"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDisplayedCount(pageSize);
            }}
            aria-label="Search tags"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="tag-list-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="tag-list-loading">
          <span className="loading-spinner">⏳</span> Loading tags...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredTags.length === 0 && (
        <div className="tag-list-empty">
          <span className="empty-icon">📭</span>
          <p>
            {searchTerm ? `No tags match "${searchTerm}"` : 'No tags found'}
          </p>
        </div>
      )}

      {/* Tags list */}
      {!isLoading && !error && filteredTags.length > 0 && (
        <div className="tag-list-container">
          <ul className="tag-items" role="list">
            {displayedTags.map((tag) => {
              const isSelected = tag.name === selectedTagName;
              const isExpanded = expandedTags.has(tag.name);

              return (
                <li
                  key={tag.name}
                  className={`tag-item ${isSelected ? 'selected' : ''} ${
                    isExpanded ? 'expanded' : ''
                  }`}
                  onClick={() => onTagClick?.(tag)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTagClick?.(tag);
                    }
                  }}
                >
                  {/* Tag header */}
                  <div className="tag-header">
                    <div className="tag-info">
                      <span className="tag-icon">
                        {tag.isRelease ? '🚀' : '🏷️'}
                      </span>
                      <span className="tag-name">{tag.name}</span>

                      {/* Badges */}
                      {tag.isRelease && (
                        <span className="tag-badge release-badge">Release</span>
                      )}
                      {tag.prerelease && (
                        <span className="tag-badge prerelease-badge">
                          Pre-release
                        </span>
                      )}
                      {tag.draft && (
                        <span className="tag-badge draft-badge">Draft</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="tag-meta">
                      <button
                        className="tag-sha"
                        onClick={(e) => handleCopy(tag.commitSha, e)}
                        title="Copy commit SHA"
                        aria-label={`Copy commit ${getShortSha(tag.commitSha)}`}
                      >
                        {getShortSha(tag.commitSha)}
                      </button>

                      {tag.tagDate && (
                        <span className="tag-date">
                          {formatDate(tag.tagDate)}
                        </span>
                      )}

                      {tag.author && (
                        <span className="tag-author">
                          by {tag.author.name}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="tag-actions">
                      {tag.downloadUrl && (
                        <a
                          href={tag.downloadUrl}
                          className="tag-download"
                          title="Download release"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⬇️
                        </a>
                      )}
                      {tag.releaseNotes && (
                        <button
                          className={`expand-button ${
                            isExpanded ? 'expanded' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(tag.name);
                          }}
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          ▼
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Release notes */}
                  {showNotes && tag.releaseNotes && isExpanded && (
                    <div className="tag-notes">
                      <div className="notes-content">
                        {tag.releaseNotes}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Load more button */}
          {hasMore && (
            <button
              className="load-more-button"
              onClick={() => setDisplayedCount((prev) => prev + pageSize)}
            >
              Load {Math.min(pageSize, filteredTags.length - displayedCount)} more
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && filteredTags.length > 0 && (
        <div className="tag-list-summary">
          <small>
            Showing {displayedTags.length} of {filteredTags.length} tags
          </small>
        </div>
      )}
    </div>
  );
};

export default TagList;
