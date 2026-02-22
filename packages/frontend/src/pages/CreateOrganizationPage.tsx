import React from "react";
import { OrganizationForm } from "../components/organizations/OrganizationForm";

/**
 * Create Organization Page
 * Form to create new organizations
 */
export const CreateOrganizationPage: React.FC = () => {
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "48px 24px",
    background: "var(--bg-primary)",
  };

  return (
    <div style={pageStyle}>
      <OrganizationForm />
    </div>
  );
};
