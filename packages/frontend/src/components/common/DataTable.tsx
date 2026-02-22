import React, { useState, useCallback, useMemo } from "react";

/** Column definition for the data table */
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => React.ReactNode;
}

/** Sort state */
interface SortState {
  key: string;
  direction: "asc" | "desc";
}

/** Props for DataTable */
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  onRowClick?: (item: T) => void;
}

/**
 * Generic data table component with sortable columns, loading state,
 * and empty state message.
 */
export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  keyExtractor,
  onSort,
  onRowClick,
}: DataTableProps<T>): React.ReactElement {
  const [sortState, setSortState] = useState<SortState | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      const newDirection: "asc" | "desc" =
        sortState?.key === key && sortState.direction === "asc"
          ? "desc"
          : "asc";
      setSortState({ key, direction: newDirection });
      onSort?.(key, newDirection);
    },
    [sortState, onSort],
  );

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const thStyle = (col: Column<T>): React.CSSProperties => ({
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "2px solid var(--border-color)",
    color: "var(--text-secondary)",
    fontWeight: 600,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: col.sortable ? "pointer" : "default",
    width: col.width,
    userSelect: "none",
  });

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    verticalAlign: "middle",
  };

  const rowStyle: React.CSSProperties = {
    cursor: onRowClick ? "pointer" : "default",
    transition: "background 0.1s",
  };

  const sortIndicator = (key: string): string => {
    if (sortState?.key !== key) return " ↕";
    return sortState.direction === "asc" ? " ↑" : " ↓";
  };

  const emptyStyle: React.CSSProperties = {
    padding: "32px",
    textAlign: "center",
    color: "var(--text-muted)",
  };

  const loadingOverlay: React.CSSProperties = {
    opacity: loading ? 0.5 : 1,
    transition: "opacity 0.2s",
    position: "relative",
  };

  const sortedData = useMemo(() => {
    if (!sortState || onSort) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortState.key];
      const bVal = (b as Record<string, unknown>)[sortState.key];
      const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
      return sortState.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sortState, onSort]);

  return (
    <div style={loadingOverlay}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={thStyle(col)}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.header}
                {col.sortable && sortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 && !loading ? (
            <tr>
              <td colSpan={columns.length} style={emptyStyle}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                style={rowStyle}
                onClick={() => onRowClick?.(item)}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-tertiary)";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "";
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={tdStyle}>
                    {col.render
                      ? col.render(item)
                      : String(
                          (item as Record<string, unknown>)[col.key] ?? "",
                        )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
