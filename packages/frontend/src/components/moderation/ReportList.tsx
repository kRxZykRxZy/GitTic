import React, { useState, useCallback } from "react";
import { usePaginatedApi } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api-client";
import { DataTable, Column } from "../common/DataTable";
import { Badge, statusBadgeVariant } from "../common/Badge";
import { Pagination } from "../common/Pagination";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { ModerationReport, PaginatedResponse, ReportStatus } from "../../types/api";
import { formatRelativeTime } from "../../utils/format";

/** Status filter options */
const statusFilters: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

/**
 * Reports table with status filter, target type, reporter, assignee, and resolve action.
 */
export const ReportList: React.FC = () => {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    items,
    loading,
    error,
    page,
    perPage,
    total,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    setPerPage,
    refetch,
  } = usePaginatedApi(
    (pg, pp) =>
      api.get<PaginatedResponse<ModerationReport>>("/moderation/reports", {
        params: {
          page: pg,
          perPage: pp,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      }),
    25,
  );

  const handleResolve = useCallback(
    async (report: ModerationReport) => {
      try {
        await api.post(`/moderation/reports/${report.id}/resolve`);
        toast.success("Report resolved");
        await refetch();
      } catch {
        toast.error("Failed to resolve report");
      }
    },
    [toast, refetch],
  );

  const handleDismiss = useCallback(
    async (report: ModerationReport) => {
      try {
        await api.post(`/moderation/reports/${report.id}/dismiss`);
        toast.success("Report dismissed");
        await refetch();
      } catch {
        toast.error("Failed to dismiss report");
      }
    },
    [toast, refetch],
  );

  const columns: Column<ModerationReport>[] = [
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span style={{ fontWeight: 500 }}>{r.reason}</span>,
    },
    {
      key: "targetType",
      header: "Target",
      render: (r) => (
        <span style={{ textTransform: "capitalize" }}>{r.targetType}</span>
      ),
    },
    {
      key: "reporterUsername",
      header: "Reporter",
    },
    {
      key: "assigneeUsername",
      header: "Assignee",
      render: (r) => (
        <span>{r.assigneeUsername ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge label={r.status} variant={statusBadgeVariant(r.status)} />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => <span>{formatRelativeTime(r.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      width: "200px",
      render: (r) =>
        r.status === "open" || r.status === "reviewing" ? (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className="btn btn-primary"
              style={{ padding: "2px 8px", fontSize: "12px" }}
              onClick={() => handleResolve(r)}
              type="button"
            >
              Resolve
            </button>
            <button
              className="btn"
              style={{ padding: "2px 8px", fontSize: "12px" }}
              onClick={() => handleDismiss(r)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        ) : null,
    },
  ];

  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    fontSize: "13px",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    background: active ? "var(--accent-blue)" : "var(--bg-tertiary)",
    color: active ? "#fff" : "var(--text-secondary)",
    cursor: "pointer",
  });

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        Reports
      </h2>

      <div style={controlsStyle}>
        {statusFilters.map((sf) => (
          <button
            key={sf.value}
            style={filterBtnStyle(statusFilter === sf.value)}
            onClick={() => setStatusFilter(sf.value)}
            type="button"
          >
            {sf.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading reports…" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(r) => r.id}
            emptyMessage="No reports found"
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            perPage={perPage}
            total={total}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={goToPage}
            onPerPageChange={setPerPage}
          />
        </>
      )}
    </div>
  );
};
