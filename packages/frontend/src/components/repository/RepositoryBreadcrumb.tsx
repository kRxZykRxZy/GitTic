import React from 'react';


/**
 * Interface for breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * Props for the RepositoryBreadcrumb component
 */
export interface RepositoryBreadcrumbProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Callback when a breadcrumb item is clicked */
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
  /** Separator character */
  separator?: string;
  /** Custom className */
  className?: string;
  /** Show home icon */
  showHome?: boolean;
  /** Maximum visible items before collapsing */
  maxItems?: number;
  /** Custom home label */
  homeLabel?: string;
  /** Home path */
  homePath?: string;
}

/**
 * RepositoryBreadcrumb Component
 * 
 * A production-quality breadcrumb navigation component.
 * Similar to GitHub's repository breadcrumb with support for file path navigation.
 * 
 * Features:
 * - File path navigation breadcrumb
 * - Home link with icon
 * - Collapsible items for deep paths
 * - Keyboard navigation support
 * - Click callbacks for navigation
 * - Responsive design
 * - Accessibility support
 * - Custom separators
 */
export const RepositoryBreadcrumb: React.FC<RepositoryBreadcrumbProps> = ({
  items,
  onItemClick,
  separator = '/',
  className = '',
  showHome = true,
  maxItems = 10,
  homeLabel = 'Repository',
  homePath = '/',
}) => {
  // Determine which items to show
  const itemsToDisplay = items.slice(0, maxItems);
  const hasCollapsed = items.length > maxItems;

  // Handle breadcrumb click
  const handleClick = (item: BreadcrumbItem, index: number) => {
    if (item.onClick) {
      item.onClick();
    }
    onItemClick?.(item, index);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, item: BreadcrumbItem, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(item, index);
    }
  };

  return (
    <nav className={`repository-breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {/* Home breadcrumb */}
        {showHome && (
          <>
            <li className="breadcrumb-item">
              <button
                className="breadcrumb-button home-button"
                onClick={() => {
                  const homeItem: BreadcrumbItem = { label: homeLabel, path: homePath };
                  handleClick(homeItem, -1);
                }}
                onKeyDown={(e) => {
                  const homeItem: BreadcrumbItem = { label: homeLabel, path: homePath };
                  handleKeyDown(e, homeItem, -1);
                }}
              >
                <span className="breadcrumb-icon">🏠</span>
                <span className="breadcrumb-label">{homeLabel}</span>
              </button>
            </li>
            {items.length > 0 && (
              <li className="breadcrumb-separator" aria-hidden="true">
                {separator}
              </li>
            )}
          </>
        )}

        {/* Collapsed indicator */}
        {hasCollapsed && (
          <>
            <li className="breadcrumb-item">
              <span className="breadcrumb-ellipsis" title={`${items.length - maxItems} more items`}>
                ...
              </span>
            </li>
            <li className="breadcrumb-separator" aria-hidden="true">
              {separator}
            </li>
          </>
        )}

        {/* Regular breadcrumb items */}
        {itemsToDisplay.map((item, index) => {
          const actualIndex = hasCollapsed ? index + (items.length - maxItems) : index;
          const isLast = actualIndex === items.length - 1;

          return (
            <React.Fragment key={`${item.label}-${actualIndex}`}>
              <li
                className={`breadcrumb-item ${item.isActive ? 'active' : ''} ${
                  isLast ? 'last' : ''
                }`}
              >
                {isLast ? (
                  // Last item is not a button
                  <span className="breadcrumb-text">
                    {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                    <span className="breadcrumb-label">{item.label}</span>
                  </span>
                ) : (
                  // Other items are clickable buttons
                  <button
                    className="breadcrumb-button"
                    onClick={() => handleClick(item, actualIndex)}
                    onKeyDown={(e) => handleKeyDown(e, item, actualIndex)}
                    title={item.path}
                  >
                    {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                    <span className="breadcrumb-label">{item.label}</span>
                  </button>
                )}
              </li>

              {/* Separator */}
              {!isLast && (
                <li className="breadcrumb-separator" aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default RepositoryBreadcrumb;
