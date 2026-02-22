import React from "react";
import { Link } from "react-router-dom";

export interface RepoHeaderBarProps {
  ownerUsername: string;
  repo: string;
  isPrivate?: boolean;
  selectedBranch: string;
}

export const RepoHeaderBar: React.FC<RepoHeaderBarProps> = ({
  ownerUsername,
  repo,
  isPrivate,
  selectedBranch,
}) => {
  return (
    <div style={{ padding: "16px 24px", borderBottom: "1px solid #d0d7de" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span style={{ color: "#57606a", fontSize: "14px" }}>Repositories</span>
        <span style={{ color: "#57606a" }}>&gt;</span>
        <Link
          to={`/${ownerUsername}/${repo}`}
          style={{ color: "#0969da", textDecoration: "none", fontSize: "14px" }}
        >
          {repo}
        </Link>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
          }}
          type="button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        {isPrivate ? (
          <span
            style={{
              fontSize: "11px",
              padding: "2px 6px",
              borderRadius: "10px",
              border: "1px solid #d0d7de",
              textTransform: "uppercase",
              color: "#57606a",
            }}
          >
            Private
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #d0d7de",
              background: "#fff",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {selectedBranch}
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #d0d7de",
              background: "#fff",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            type="button"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Clone
          </button>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #2da44e",
              background: "#2da44e",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            type="button"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New File
          </button>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ position: "absolute", left: "12px", color: "#57606a" }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Code Search"
            style={{
              padding: "6px 12px 6px 36px",
              borderRadius: "6px",
              border: "1px solid #d0d7de",
              background: "#fff",
              fontSize: "13px",
              width: "200px",
            }}
          />
        </div>
      </div>
    </div>
  );
};
