import React from "react";
import { SearchResult } from "../../types/api";
import { Pagination } from "../common/Pagination";
import { LoadingSpinner } from "../common/LoadingSpinner";

/** Props for SearchResults */
interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

/** Icon map for result types */
const typeIcons: Record<string, string> = {
  project: "📁",
  user: "👤",
  code: "💻",
  issue: "🐛",
};

/**
 * Search results display with type-specific result cards,
 * highlighting, and pagination.
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  total,
  page,
  perPage,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
}) => {
  if (loading) {
    return <LoadingSpinner message="Searching…" />;
  }

  if (results.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
        <div style={{ fontSize: "16px" }}>No results found</div>
        <div style={{ fontSize: "13px", marginTop: "4px" }}>
          Try different keywords or filters
        </div>
      </div>
    );
  }

  const listStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "16px",
    transition: "border-color 0.15s",
    cursor: "pointer",
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--accent-blue)",
  };

  const typeTag: React.CSSProperties = {
    fontSize: "11px",
    padding: "1px 6px",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    color: "var(--text-muted)",
    textTransform: "capitalize",
  };

  const descStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  };

  const highlightStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    marginTop: "6px",
    padding: "6px 8px",
    background: "var(--bg-tertiary)",
    borderRadius: "4px",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
  };

  const summaryStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginBottom: "12px",
  };

  return (
    <div>
      <div style={summaryStyle}>
        Found <strong>{total}</strong> result{total !== 1 ? "s" : ""}
      </div>

      <div style={listStyle}>
        {results.map((result) => (
          <div
            key={`${result.type}-${result.id}`}
            style={cardStyle}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--accent-blue)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-color)";
            }}
          >
            <div style={headerRow}>
              <span>{typeIcons[result.type] ?? "📄"}</span>
              <span style={titleStyle}>{result.title}</span>
              <span style={typeTag}>{result.type}</span>
            </div>
            <div style={descStyle}>{result.description}</div>
            {result.highlights.length > 0 && (
              <div style={highlightStyle}>
                {result.highlights.slice(0, 3).join("\n")}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          total={total}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onPageChange={onPageChange}
          showPerPage={false}
        />
      )}
    </div>
  );
};
