import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/common/Icon";

/**
 * Landing Page - shown to logged-out users
 * Features showcase and call-to-action
 */
export const LandingPage: React.FC = () => {
  const heroStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "80px 24px",
    background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "48px",
    fontWeight: 700,
    marginBottom: "24px",
    color: "var(--text-primary)",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "20px",
    color: "var(--text-secondary)",
    marginBottom: "40px",
    maxWidth: "600px",
    margin: "0 auto 40px",
    lineHeight: 1.5,
  };

  const ctaStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginTop: "32px",
  };

  const featuresStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 24px",
  };

  const featuresTitleStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: 600,
    textAlign: "center",
    marginBottom: "48px",
  };

  const featuresGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "32px",
  };

  const featureCardStyle: React.CSSProperties = {
    padding: "24px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
  };

  const featureIconStyle: React.CSSProperties = {
    marginBottom: "16px",
    color: "var(--accent-blue)",
  };

  const featureTitleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "12px",
  };

  const featureDescStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  };

  const statsStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "60px 24px",
    background: "var(--bg-secondary)",
  };

  const statsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "40px",
    maxWidth: "800px",
    margin: "0 auto",
  };

  const statStyle: React.CSSProperties = {
    fontSize: "14px",
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: 700,
    color: "var(--accent-blue)",
    display: "block",
    marginBottom: "8px",
  };

  const features = [
    {
      icon: "git-branch" as const,
      title: "Git Hosting",
      description: "Host unlimited Git repositories with full version control, branching, and collaboration features.",
    },
    {
      icon: "git-pull-request" as const,
      title: "Pull Requests",
      description: "Collaborate with team members through pull requests, code reviews, and inline comments.",
    },
    {
      icon: "issue" as const,
      title: "Issue Tracking",
      description: "Track bugs, features, and tasks with a powerful issue management system.",
    },
    {
      icon: "users" as const,
      title: "Team Collaboration",
      description: "Work together with your team using organizations, teams, and granular permissions.",
    },
    {
      icon: "analytics" as const,
      title: "CI/CD Pipelines",
      description: "Automate your workflows with integrated continuous integration and deployment pipelines.",
    },
    {
      icon: "lock" as const,
      title: "Security Scanning",
      description: "Automatically scan for vulnerabilities, secrets, and security issues in your code.",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div style={heroStyle}>
        <h1 style={titleStyle}>Build better software, together</h1>
        <p style={subtitleStyle}>
          A complete platform for version control, code review, project management, and team collaboration.
        </p>
        <div style={ctaStyle}>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started for Free
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div style={featuresStyle}>
        <h2 style={featuresTitleStyle}>Everything you need to build great software</h2>
        <div style={featuresGridStyle}>
          {features.map((feature) => (
            <div key={feature.title} style={featureCardStyle}>
              <div style={featureIconStyle}>
                <Icon name={feature.icon} size={32} />
              </div>
              <h3 style={featureTitleStyle}>{feature.title}</h3>
              <p style={featureDescStyle}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div style={statsStyle}>
        <div style={statsGridStyle}>
          <div style={statStyle}>
            <span style={statValueStyle}>1M+</span>
            <span>Developers</span>
          </div>
          <div style={statStyle}>
            <span style={statValueStyle}>10M+</span>
            <span>Repositories</span>
          </div>
          <div style={statStyle}>
            <span style={statValueStyle}>50M+</span>
            <span>Pull Requests</span>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ ...heroStyle, paddingTop: "60px", paddingBottom: "60px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "24px" }}>
          Ready to get started?
        </h2>
        <p style={{ ...subtitleStyle, marginBottom: "32px" }}>
          Join thousands of developers building the future of software.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Your Free Account
        </Link>
      </div>
    </div>
  );
};
