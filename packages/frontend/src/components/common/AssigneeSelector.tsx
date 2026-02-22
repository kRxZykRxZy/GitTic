import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api-client";
import "./AssigneeSelector.css";

interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
}

interface AssigneeSelectorProps {
  owner: string;
  repo: string;
  resourceType: "issue" | "pr";
  resourceNumber: number;
  currentAssignees: string[];
  onAssigneesChange?: () => void;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  owner,
  repo,
  resourceType,
  resourceNumber,
  currentAssignees,
  onAssigneesChange,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      searchUsers();
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    try {
      const response = await api.get<{ items: User[] }>(`/api/v1/search/users`, {
        params: { q: searchTerm, perPage: 10 },
      });
      setUsers(response.data?.items || []);
    } catch (err) {
      console.error("Failed to search users:", err);
    }
  };

  const handleAddAssignee = async (username: string) => {
    if (currentAssignees.includes(username)) return;

    try {
      setLoading(true);
      const endpoint = resourceType === "issue"
        ? `/api/v1/${owner}/${repo}/issues/${resourceNumber}/assignees`
        : `/api/v1/${owner}/${repo}/pulls/${resourceNumber}/assignees`;
      
      await api.post(endpoint, { assignee: username });
      onAssigneesChange?.();
      setShowDropdown(false);
      setSearchTerm("");
    } catch (err) {
      console.error("Failed to add assignee:", err);
      alert("Failed to add assignee");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignee = async (username: string) => {
    try {
      setLoading(true);
      const endpoint = resourceType === "issue"
        ? `/api/v1/${owner}/${repo}/issues/${resourceNumber}/assignees/${username}`
        : `/api/v1/${owner}/${repo}/pulls/${resourceNumber}/assignees/${username}`;
      
      await api.delete(endpoint);
      onAssigneesChange?.();
    } catch (err) {
      console.error("Failed to remove assignee:", err);
      alert("Failed to remove assignee");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) => !currentAssignees.includes(user.username)
  );

  return (
    <div className="assignee-selector" ref={dropdownRef}>
      <div className="assignee-selector-header">
        <h4>Assignees</h4>
        <button
          className="btn-sm btn-secondary"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading}
        >
          + Add
        </button>
      </div>

      {showDropdown && (
        <div className="assignee-dropdown">
          <input
            type="text"
            className="assignee-search"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="assignee-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="assignee-option"
                  onClick={() => handleAddAssignee(user.username)}
                >
                  <div className="assignee-avatar">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="assignee-info">
                    <div className="assignee-username">{user.username}</div>
                    {user.name && (
                      <div className="assignee-name">{user.name}</div>
                    )}
                  </div>
                </div>
              ))
            ) : searchTerm ? (
              <div className="empty-message">No users found</div>
            ) : (
              <div className="empty-message">Type to search users</div>
            )}
          </div>
        </div>
      )}

      <div className="current-assignees">
        {currentAssignees.length > 0 ? (
          currentAssignees.map((username) => (
            <div key={username} className="assignee-card">
              <div className="assignee-avatar">
                {username[0].toUpperCase()}
              </div>
              <span className="assignee-username">{username}</span>
              <button
                className="remove-btn"
                onClick={() => handleRemoveAssignee(username)}
                disabled={loading}
                title="Remove assignee"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="empty-message">No assignees yet</div>
        )}
      </div>
    </div>
  );
};
