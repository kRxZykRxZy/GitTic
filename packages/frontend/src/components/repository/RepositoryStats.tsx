import React, { useMemo } from 'react';

/**
 * Interface for repository statistics
 */
export interface RepositoryStatistics {
  totalCommits: number;
  totalContributors: number;
  totalIssues: number;
  totalPullRequests: number;
  totalReleases: number;
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  totalBranches: number;
  totalTags: number;
  createdAt?: string;
  updatedAt?: string;
  primaryLanguage?: string;
  languages?: Record<string, number>;
  licenseType?: string;
  isPrivate?: boolean;
  isFork?: boolean;
}

/**
 * Props for the RepositoryStats component
 */
export interface RepositoryStatsProps {
  /** Repository statistics */
  stats: Partial<RepositoryStatistics>;
  /** Repository name for display */
  repositoryName?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Custom className */
  className?: string;
  /** Compact mode (smaller cards) */
  compact?: boolean;
  /** Show language breakdown */
  showLanguages?: boolean;
}

/**
 * RepositoryStats Component
 * 
 * A production-quality repository statistics component.
 * Similar to GitHub's repository dashboard with key metrics and insights.
 * 
 * Features:
 * - Key statistics cards (commits, contributors, issues, PRs, etc.)
 * - Language breakdown chart
 * - Repository metadata
 * - Responsive grid layout
 * - Loading and error states
 * - Accessibility support
 */
export const RepositoryStats: React.FC<RepositoryStatsProps> = ({
  stats,
  repositoryName,
  isLoading = false,
  error = null,
  className = '',
  compact = false,
  showLanguages = true,
}) => {
  // Calculate total lines of code from languages
  const totalLoc = useMemo(() => {
    if (!stats.languages) return 0;
    return Object.values(stats.languages).reduce((sum, val) => sum + val, 0);
  }, [stats.languages]);

  // Get top languages
  const topLanguages = useMemo(() => {
    if (!stats.languages) return [];
    return Object.entries(stats.languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang, lines]) => ({
        name: lang,
        lines,
        percentage: totalLoc ? ((lines / totalLoc) * 100).toFixed(1) : 0,
      }));
  }, [stats.languages, totalLoc]);

  // Color map for languages
  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      Java: '#b07219',
      TypeScript: '#2b7489',
      'C++': '#f34b7d',
      C: '#555555',
      Go: '#00ADD8',
      Rust: '#ce422b',
      Ruby: '#cc342d',
      PHP: '#777bb4',
      Swift: '#FA7343',
      Kotlin: '#7f52ff',
      'C#': '#239120',
      HTML: '#e34c26',
      CSS: '#563d7c',
    };
    return colors[language] || '#858585';
  };

  // Format large numbers
  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`repository-stats ${compact ? 'compact' : ''} ${className}`}>
      {/* Header */}
      {repositoryName && (
        <div className="stats-header">
          <h2>{repositoryName}</h2>
          {stats.isPrivate && <span className="private-badge">Private</span>}
          {stats.isFork && <span className="fork-badge">Fork</span>}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="stats-loading">
          <span className="loading-spinner">⏳</span> Loading statistics...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="stats-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Stats content */}
      {!isLoading && !error && (
        <>
          {/* Main statistics grid */}
          <div className="stats-grid">
            {/* Commits */}
            {stats.totalCommits !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-label">Commits</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalCommits)}
                  </div>
                </div>
              </div>
            )}

            {/* Contributors */}
            {stats.totalContributors !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-label">Contributors</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalContributors)}
                  </div>
                </div>
              </div>
            )}

            {/* Issues */}
            {stats.totalIssues !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <div className="stat-label">Issues</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalIssues)}
                  </div>
                </div>
              </div>
            )}

            {/* Pull Requests */}
            {stats.totalPullRequests !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">🔀</div>
                <div className="stat-content">
                  <div className="stat-label">Pull Requests</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalPullRequests)}
                  </div>
                </div>
              </div>
            )}

            {/* Stars */}
            {stats.totalStars !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-label">Stars</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalStars)}
                  </div>
                </div>
              </div>
            )}

            {/* Forks */}
            {stats.totalForks !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">🍴</div>
                <div className="stat-content">
                  <div className="stat-label">Forks</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalForks)}
                  </div>
                </div>
              </div>
            )}

            {/* Branches */}
            {stats.totalBranches !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">🌿</div>
                <div className="stat-content">
                  <div className="stat-label">Branches</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalBranches)}
                  </div>
                </div>
              </div>
            )}

            {/* Releases */}
            {stats.totalReleases !== undefined && (
              <div className="stat-card">
                <div className="stat-icon">🚀</div>
                <div className="stat-content">
                  <div className="stat-label">Releases</div>
                  <div className="stat-value">
                    {formatNumber(stats.totalReleases)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Languages breakdown */}
          {showLanguages && topLanguages.length > 0 && (
            <div className="stats-languages">
              <h3>Languages</h3>
              <div className="languages-chart">
                {topLanguages.map((lang) => (
                  <div key={lang.name} className="language-bar">
                    <div className="language-info">
                      <span className="language-name">{lang.name}</span>
                      <span className="language-percentage">
                        {lang.percentage}%
                      </span>
                    </div>
                    <div className="language-bar-track">
                      <div
                        className="language-bar-fill"
                        style={{
                          width: `${lang.percentage}%`,
                          backgroundColor: getLanguageColor(lang.name),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="stats-metadata">
            <div className="metadata-row">
              <span className="metadata-label">Primary Language:</span>
              <span className="metadata-value">
                {stats.primaryLanguage || 'Unknown'}
              </span>
            </div>
            {stats.licenseType && (
              <div className="metadata-row">
                <span className="metadata-label">License:</span>
                <span className="metadata-value">{stats.licenseType}</span>
              </div>
            )}
            {stats.createdAt && (
              <div className="metadata-row">
                <span className="metadata-label">Created:</span>
                <span className="metadata-value">
                  {formatDate(stats.createdAt)}
                </span>
              </div>
            )}
            {stats.updatedAt && (
              <div className="metadata-row">
                <span className="metadata-label">Updated:</span>
                <span className="metadata-value">
                  {formatDate(stats.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RepositoryStats;
