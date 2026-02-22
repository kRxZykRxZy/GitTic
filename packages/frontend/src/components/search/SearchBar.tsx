import React, { useState, useEffect, useRef, useCallback } from "react";
import { SEARCH_TYPES, SEARCH_DEBOUNCE_MS } from "../../utils/constants";

/** Props for SearchBar */
interface SearchBarProps {
  initialQuery?: string;
  initialType?: string;
  onSearch: (query: string, type: string) => void;
}

/**
 * Search input with type filter dropdown, debounced input,
 * and Ctrl+K keyboard shortcut.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = "",
  initialType = "all",
  onSearch,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Keyboard shortcut: Ctrl+K to focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /** Debounced search trigger */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim(), type);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, type, onSearch]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.trim()) {
        onSearch(query.trim(), type);
      }
    },
    [query, type, onSearch],
  );

  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
  };

  const inputWrapper: React.CSSProperties = {
    flex: 1,
    position: "relative",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    paddingRight: "70px",
    fontSize: "15px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
  };

  const shortcutBadge: React.CSSProperties = {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "11px",
    color: "var(--text-muted)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    padding: "1px 6px",
    background: "var(--bg-tertiary)",
    pointerEvents: "none",
  };

  const selectStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: "14px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    minWidth: "140px",
  };

  return (
    <form onSubmit={handleSubmit} style={containerStyle}>
      <div style={inputWrapper}>
        <input
          ref={inputRef}
          style={inputStyle}
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        <span style={shortcutBadge}>Ctrl+K</span>
      </div>
      <select
        style={selectStyle}
        value={type}
        onChange={(e) => setType(e.target.value)}
        aria-label="Search type"
      >
        {SEARCH_TYPES.map((st) => (
          <option key={st.value} value={st.value}>
            {st.label}
          </option>
        ))}
      </select>
    </form>
  );
};
