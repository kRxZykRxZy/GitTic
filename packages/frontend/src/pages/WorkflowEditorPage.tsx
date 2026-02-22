import React from "react";
import { WorkflowEditor } from "../components/workflows/WorkflowEditor";

/**
 * Workflow Editor Page
 * Create and manage CI/CD workflows
 */
export const WorkflowEditorPage: React.FC = () => {
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "var(--bg-primary)",
  };

  return (
    <div style={pageStyle}>
      <WorkflowEditor />
    </div>
  );
};
