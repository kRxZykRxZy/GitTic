import React, { useState, useRef, useEffect } from 'react';

/**
 * Interface for branch information
 */
export interface Branch {
  name: string;
  isDefault?: boolean;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitDate?: string;
}

/**
 * Props for the BranchSelector component
 */
export interface BranchSelectorProps {
  /** List of available branches */
  branches: Branch[];
  /** Currently selected branch name */
  selectedBranch: string;
  /** Callback when branch is selected */
  onBranchChange: (branchName: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Custom className */
  className?: string;
  /** Whether to show branch icons */
  showIcons?: boolean;
}

/**
 * BranchSelector Component
 * 
 * A dropdown component for selecting repository branches.
 * Similar to GitHub's branch selector with support for branch information display.
 * 
 * Features:
 * - Branch dropdown with search capability
 * - Default branch highlighting
 * - Branch information display (last commit, etc.)
 * - Loading and error states
 * - Keyboard navigation support
 * - Click outside to close
 */
export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  selectedBranch,
  onBranchChange,
  isLoading = false,
  error = null,
  className = '',
  showIcons = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter branches based on search term
  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get currently selected branch
  const currentBranch = branches.find((b) => b.name === selectedBranch);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      searchInputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredBranches.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredBranches[highlightedIndex]) {
          handleSelectBranch(filteredBranches[highlightedIndex].name);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  // Handle branch selection
  const handleSelectBranch = (branchName: string) => {
    onBranchChange(branchName);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  return (
    <div className={`branch-selector ${className}`} ref={containerRef}>
      {/* Main button */}
      <button
        className="branch-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isLoading}
      >
        {showIcons && <span className="branch-icon">🌿</span>}
        <span className="branch-name">{currentBranch?.name || 'Select branch'}</span>
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="branch-selector-dropdown">
          {/* Search input */}
          <div className="branch-search-container">
            <input
              ref={searchInputRef}
              type="text"
              className="branch-search-input"
              placeholder="Find a branch..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              aria-label="Search branches"
            />
          </div>

          {/* Error state */}
          {error && (
            <div className="branch-error" role="alert">
              {error}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="branch-loading">
              <span className="loading-spinner">⏳</span> Loading branches...
            </div>
          )}

          {/* Branch list */}
          {!isLoading && !error && filteredBranches.length > 0 && (
            <ul className="branch-list" role="listbox">
              {filteredBranches.map((branch, index) => (
                <li
                  key={branch.name}
                  className={`branch-item ${
                    branch.name === selectedBranch ? 'selected' : ''
                  } ${index === highlightedIndex ? 'highlighted' : ''} ${
                    branch.isDefault ? 'default' : ''
                  }`}
                  onClick={() => handleSelectBranch(branch.name)}
                  role="option"
                  aria-selected={branch.name === selectedBranch}
                >
                  <div className="branch-item-main">
                    {branch.isDefault && (
                      <span className="default-badge" title="Default branch">
                        ★
                      </span>
                    )}
                    <span className="branch-item-name">{branch.name}</span>
                    {branch.name === selectedBranch && (
                      <span className="check-icon">✓</span>
                    )}
                  </div>
                  {branch.lastCommitMessage && (
                    <div className="branch-item-info">
                      <span className="commit-message">
                        {branch.lastCommitMessage.substring(0, 50)}
                      </span>
                      {branch.lastCommitDate && (
                        <span className="commit-date">{branch.lastCommitDate}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Empty state */}
          {!isLoading && !error && filteredBranches.length === 0 && (
            <div className="branch-empty">
              No branches match "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
