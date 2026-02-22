import React, { useState, useCallback } from "react";
import { DataTable, Column } from "../common/DataTable";
import { Badge, roleBadgeVariant, statusBadgeVariant } from "../common/Badge";
import { Pagination } from "../common/Pagination";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { usePaginatedApi } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";
import { adminService } from "../../services/admin-service";
import { showConfirm } from "../common/ConfirmDialog";
import { User, UserRole } from "../../types/api";
import { formatRelativeTime } from "../../utils/format";
import { ROLE_OPTIONS } from "../../utils/constants";

/**
 * User list table with role badges, search, and admin actions.
 */
export const UserManagement: React.FC = () => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");

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
      adminService.getUsers({
        page: pg,
        perPage: pp,
        search: searchTerm || undefined,
      }),
    25,
  );

  const handleRoleChange = useCallback(
    async (user: User, newRole: UserRole) => {
      try {
        await adminService.updateUserRole(user.id, newRole);
        toast.success(`Role updated to ${newRole} for ${user.username}`);
        await refetch();
      } catch {
        toast.error("Failed to update role");
      }
    },
    [toast, refetch],
  );

  const handleSuspend = useCallback(
    async (user: User) => {
      const confirmed = await showConfirm({
        title: "Suspend User",
        message: `Are you sure you want to suspend ${user.username}?`,
        variant: "warning",
      });
      if (!confirmed) return;
      try {
        await adminService.suspendUser(user.id, "Admin action");
        toast.success(`${user.username} has been suspended`);
        await refetch();
      } catch {
        toast.error("Failed to suspend user");
      }
    },
    [toast, refetch],
  );

  const handleBan = useCallback(
    async (user: User) => {
      const confirmed = await showConfirm({
        title: "Ban User",
        message: `Permanently ban ${user.username}? This action cannot be easily undone.`,
        variant: "danger",
      });
      if (!confirmed) return;
      try {
        await adminService.banUser(user.id, "Admin action");
        toast.success(`${user.username} has been banned`);
        await refetch();
      } catch {
        toast.error("Failed to ban user");
      }
    },
    [toast, refetch],
  );

  const columns: Column<User>[] = [
    {
      key: "username",
      header: "Username",
      sortable: true,
      render: (user) => (
        <span style={{ fontWeight: 600 }}>{user.username}</span>
      ),
    },
    { key: "email", header: "Email", sortable: true },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge label={user.role} variant={roleBadgeVariant(user.role)} />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <Badge label={user.status} variant={statusBadgeVariant(user.status)} dot />
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (user) => <span>{formatRelativeTime(user.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      width: "240px",
      render: (user) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <select
            className="input"
            style={{ width: "auto", padding: "2px 8px", fontSize: "12px" }}
            value={user.role}
            onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button className="btn" style={{ padding: "2px 8px", fontSize: "12px" }}
            onClick={() => handleSuspend(user)} type="button">
            Suspend
          </button>
          <button className="btn btn-danger" style={{ padding: "2px 8px", fontSize: "12px" }}
            onClick={() => handleBan(user)} type="button">
            Ban
          </button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  };

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        User Management
      </h2>

      <div style={controlsStyle}>
        <input
          className="input"
          type="text"
          placeholder="Search users…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: "320px" }}
          aria-label="Search users"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Loading users…" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(u) => u.id}
            emptyMessage="No users found"
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
