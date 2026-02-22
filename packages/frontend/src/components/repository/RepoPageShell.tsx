import React from "react";

export interface RepoPageShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  content: React.ReactNode;
  summary?: React.ReactNode;
}

export const RepoPageShell: React.FC<RepoPageShellProps> = ({
  sidebar,
  header,
  content,
  summary,
}) => {
  return (
    <div style={{ height: "100vh", display: "flex", background: "#fff" }}>
      <aside
        style={{
          width: "256px",
          background: "#03254c",
          display: "flex",
          flexDirection: "column",
          color: "#fff",
        }}
      >
        {sidebar}
      </aside>

      <main
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {header}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "16px 24px", overflow: "auto" }}>{content}</div>
          {summary ? (
            <div
              style={{
                width: "256px",
                padding: "16px 24px 16px 0",
                borderLeft: "1px solid #d0d7de",
              }}
            >
              {summary}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};
