import React from "react";
import { PAGE_SIZES } from "../../utils/constants";

/** Props for Pagination component */
interface PaginationProps {
  page: number;
  totalPages: number;
  perPage: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  showPerPage?: boolean;
}

/**
 * Pagination controls component with prev/next, page numbers, and per-page selector.
 */
export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  perPage,
  total,
  hasNext,
  hasPrev,
  onPageChange,
  onPerPageChange,
  showPerPage = true,
}) => {
  /** Generate visible page numbers around the current page */
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) pages.push("ellipsis");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("ellipsis");

    pages.push(totalPages);
    return pages;
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    flexWrap: "wrap",
    gap: "12px",
  };

  const navStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  };

  const buttonStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    background: active ? "var(--accent-blue)" : "var(--bg-tertiary)",
    color: active ? "#fff" : disabled ? "var(--text-muted)" : "var(--text-primary)",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  const infoStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const selectStyle: React.CSSProperties = {
    padding: "4px 8px",
    fontSize: "13px",
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
  };

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  return (
    <div style={containerStyle}>
      <div style={infoStyle}>
        <span>
          Showing {startItem}–{endItem} of {total}
        </span>
        {showPerPage && onPerPageChange && (
          <select
            style={selectStyle}
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            aria-label="Items per page"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      <nav style={navStyle} aria-label="Pagination">
        <button
          style={buttonStyle(false, !hasPrev)}
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {getPageNumbers().map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} style={{ padding: "6px 4px", color: "var(--text-muted)" }}>
              …
            </span>
          ) : (
            <button
              key={p}
              style={buttonStyle(p === page, false)}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          ),
        )}

        <button
          style={buttonStyle(false, !hasNext)}
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next →
        </button>
      </nav>
    </div>
  );
};
