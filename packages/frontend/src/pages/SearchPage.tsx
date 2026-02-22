import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchBar } from "../components/search/SearchBar";
import { SearchResults } from "../components/search/SearchResults";
import { usePaginatedApi } from "../hooks/useApi";
import { searchService, SearchType } from "../services/search-service";
import { SearchResult } from "../types/api";

/**
 * Search page with SearchBar and SearchResults.
 */
export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);

  const {
    items,
    loading,
    total,
    page,
    perPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
  } = usePaginatedApi(
    (pg, pp) =>
      searchService.search({
        query,
        type: type as SearchType,
        page: pg,
        perPage: pp,
      }),
    25,
  );

  const handleSearch = useCallback(
    (newQuery: string, newType: string) => {
      setQuery(newQuery);
      setType(newType);
      setSearchParams({ q: newQuery, type: newType });
    },
    [setSearchParams],
  );

  const pageStyle: React.CSSProperties = {
    maxWidth: "900px",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "16px",
  };

  const tipsStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "48px 24px",
    color: "var(--text-muted)",
  };

  const tipTitle: React.CSSProperties = {
    fontSize: "32px",
    marginBottom: "12px",
  };

  const tipText: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    maxWidth: "400px",
    margin: "0 auto",
    lineHeight: 1.5,
  };

  const showResults = query.trim().length > 0;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Search</h1>
      </div>

      <SearchBar
        initialQuery={initialQuery}
        initialType={initialType}
        onSearch={handleSearch}
      />

      {showResults ? (
        <SearchResults
          results={items}
          loading={loading}
          total={total}
          page={page}
          perPage={perPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onPageChange={goToPage}
        />
      ) : (
        <div style={tipsStyle}>
          <div style={tipTitle}>🔍</div>
          <p style={tipText}>
            Search for projects, code, users, and more.
            Use <kbd style={{
              padding: "2px 6px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              fontSize: "12px",
            }}>Ctrl+K</kbd> to quickly focus the search bar.
          </p>
        </div>
      )}
    </div>
  );
};
