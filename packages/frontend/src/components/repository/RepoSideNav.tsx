import React from "react";

export interface RepoSideNavItem {
  id: string;
  label: string;
  iconPath: string;
}

export interface RepoSideNavProps {
  ownerUsername: string;
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  items: RepoSideNavItem[];
  onBackToRepositories?: () => void;
}

export const RepoSideNav: React.FC<RepoSideNavProps> = ({
  ownerUsername,
  activeTabId,
  onTabChange,
  items,
  onBackToRepositories,
}) => {
  return (
    <>
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "18px",
              color: "#03254c",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: "18px" }}>
            Code Repository
          </span>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}>
              ACCOUNT
            </div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              {ownerUsername}
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0 16px" }}>
        <div style={{ marginBottom: "16px" }}>
          <button
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
            onClick={onBackToRepositories}
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Repositories
          </button>
        </div>

        <div style={{ marginBottom: "8px" }}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "none",
                background:
                  activeTabId === item.id
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
                color:
                  activeTabId === item.id
                    ? "#fff"
                    : "rgba(255,255,255,0.8)",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
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
                <path d={item.iconPath} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div
        style={{
          padding: "16px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <button
          style={{
            width: "100%",
            textAlign: "left",
            padding: "8px",
            borderRadius: "20px",
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          type="button"
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "#4a90e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 600,
            }}
          >
            {ownerUsername.charAt(0).toUpperCase()}
          </div>
          <span style={{ flex: 1 }}>{ownerUsername}</span>
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
        </button>
      </div>
    </>
  );
};
