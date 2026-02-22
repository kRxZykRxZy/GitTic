import React, { useCallback } from "react";
import { usePaginatedApi } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";
import { clusterService } from "../../services/cluster-service";
import { showConfirm } from "../common/ConfirmDialog";
import { Badge, statusBadgeVariant } from "../common/Badge";
import { DataTable, Column } from "../common/DataTable";
import { Pagination } from "../common/Pagination";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { ClusterNode } from "../../types/api";
import { formatRelativeTime } from "../../utils/format";

/**
 * Cluster nodes list with status, resource usage, jobs, and admin actions.
 */
export const ClusterPanel: React.FC = () => {
  const toast = useToast();

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
    (pg, pp) => clusterService.list({ page: pg, perPage: pp }),
    25,
  );

  const handleDrain = useCallback(
    async (node: ClusterNode) => {
      const confirmed = await showConfirm({
        title: "Drain Node",
        message: `Drain ${node.hostname}? It will stop accepting new jobs.`,
        variant: "warning",
      });
      if (!confirmed) return;
      try {
        await clusterService.drain(node.id);
        toast.success(`${node.hostname} is now draining`);
        await refetch();
      } catch {
        toast.error("Failed to drain node");
      }
    },
    [toast, refetch],
  );

  const handleRemove = useCallback(
    async (node: ClusterNode) => {
      const confirmed = await showConfirm({
        title: "Remove Node",
        message: `Remove ${node.hostname} from the cluster? This cannot be undone.`,
        variant: "danger",
      });
      if (!confirmed) return;
      try {
        await clusterService.remove(node.id);
        toast.success(`${node.hostname} removed`);
        await refetch();
      } catch {
        toast.error("Failed to remove node");
      }
    },
    [toast, refetch],
  );

  const usageBar = (value: number): React.ReactElement => {
    const color =
      value > 80
        ? "var(--accent-red)"
        : value > 60
          ? "var(--accent-yellow)"
          : "var(--accent-green)";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "60px",
            height: "6px",
            background: "var(--bg-tertiary)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${value}%`,
              height: "100%",
              background: color,
              borderRadius: "3px",
            }}
          />
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{value}%</span>
      </div>
    );
  };

  const columns: Column<ClusterNode>[] = [
    {
      key: "hostname",
      header: "Hostname",
      sortable: true,
      render: (n) => <span style={{ fontWeight: 600 }}>{n.hostname}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (n) => <Badge label={n.status} variant={statusBadgeVariant(n.status)} dot />,
    },
    { key: "cpuUsage", header: "CPU", render: (n) => usageBar(n.cpuUsage) },
    { key: "ramUsage", header: "RAM", render: (n) => usageBar(n.ramUsage) },
    {
      key: "activeJobs",
      header: "Jobs",
      render: (n) => <span>{n.activeJobs} / {n.maxJobs}</span>,
    },
    {
      key: "lastHeartbeat",
      header: "Last Heartbeat",
      render: (n) => <span>{formatRelativeTime(n.lastHeartbeat)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      width: "180px",
      render: (n) => (
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="btn" style={{ padding: "2px 8px", fontSize: "12px" }}
            onClick={() => handleDrain(n)} disabled={n.status === "draining"} type="button">
            Drain
          </button>
          <button className="btn btn-danger" style={{ padding: "2px 8px", fontSize: "12px" }}
            onClick={() => handleRemove(n)} type="button">
            Remove
          </button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        Cluster Nodes
      </h2>

      {loading ? (
        <LoadingSpinner message="Loading cluster nodes…" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(n) => n.id}
            emptyMessage="No cluster nodes registered"
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
