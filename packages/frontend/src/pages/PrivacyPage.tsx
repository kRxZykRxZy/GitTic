import React from "react";
import { Link } from "react-router-dom";

/**
 * Privacy Policy Page
 * Comprehensive privacy information for users
 */
export const PrivacyPage: React.FC = () => {
  const pageStyle: React.CSSProperties = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "48px 24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "16px",
    color: "var(--text-primary)",
  };

  const updateDateStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "32px",
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "32px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "12px",
    color: "var(--text-primary)",
  };

  const paragraphStyle: React.CSSProperties = {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "var(--text-primary)",
    marginBottom: "16px",
  };

  const listStyle: React.CSSProperties = {
    paddingLeft: "24px",
    marginBottom: "16px",
  };

  const listItemStyle: React.CSSProperties = {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "var(--text-primary)",
    marginBottom: "8px",
  };

  const linkStyle: React.CSSProperties = {
    color: "var(--accent-blue)",
    textDecoration: "none",
  };

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>Privacy Policy</h1>
      <p style={updateDateStyle}>Last Updated: February 18, 2026</p>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>1. Introduction</h2>
        <p style={paragraphStyle}>
          Welcome to DevForge ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
          This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        </p>
        <p style={paragraphStyle}>
          By using DevForge, you agree to the collection and use of information in accordance with this policy.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>2. Age Restriction</h2>
        <p style={paragraphStyle}>
          <strong>DevForge is intended for users who are 13 years of age or older.</strong> We do not knowingly collect personal 
          information from children under 13. If you are under 13, please do not use this platform or provide any personal information.
        </p>
        <p style={paragraphStyle}>
          We require date of birth during registration to verify age compliance. If we discover that we have collected information 
          from a child under 13, we will delete that information immediately.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>3. Information We Collect</h2>
        <p style={paragraphStyle}>We collect several types of information:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Account Information:</strong> Username, email address, password (encrypted), date of birth, and profile details
          </li>
          <li style={listItemStyle}>
            <strong>Repository Data:</strong> Code, commits, issues, pull requests, and related metadata
          </li>
          <li style={listItemStyle}>
            <strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns
          </li>
          <li style={listItemStyle}>
            <strong>Technical Data:</strong> IP address, browser type, device information, and cookies
          </li>
          <li style={listItemStyle}>
            <strong>Communication Data:</strong> Messages, comments, discussions, and chat history
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>4. How We Use Your Information</h2>
        <p style={paragraphStyle}>We use your information to:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Provide and maintain the platform services</li>
          <li style={listItemStyle}>Verify age requirements and account eligibility</li>
          <li style={listItemStyle}>Authenticate users and prevent unauthorized access</li>
          <li style={listItemStyle}>Process and store your code repositories</li>
          <li style={listItemStyle}>Enable collaboration features (issues, PRs, discussions, chat)</li>
          <li style={listItemStyle}>Improve platform features and user experience</li>
          <li style={listItemStyle}>Send important notifications and updates</li>
          <li style={listItemStyle}>Analyze usage patterns and performance metrics</li>
          <li style={listItemStyle}>Detect and prevent fraud, abuse, and security issues</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>5. Data Sharing and Disclosure</h2>
        <p style={paragraphStyle}>
          We do not sell your personal information. We may share your information in the following circumstances:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Public Repositories:</strong> Code and data in public repositories are visible to all users
          </li>
          <li style={listItemStyle}>
            <strong>Collaborators:</strong> Repository collaborators can access shared project data
          </li>
          <li style={listItemStyle}>
            <strong>Service Providers:</strong> Third-party services that help us operate the platform
          </li>
          <li style={listItemStyle}>
            <strong>Legal Requirements:</strong> When required by law or to protect rights and safety
          </li>
          <li style={listItemStyle}>
            <strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>6. Data Security</h2>
        <p style={paragraphStyle}>
          We implement industry-standard security measures to protect your data:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Passwords are encrypted using bcrypt hashing</li>
          <li style={listItemStyle}>HTTPS encryption for all data transmission</li>
          <li style={listItemStyle}>Regular security audits and updates</li>
          <li style={listItemStyle}>Access controls and authentication mechanisms</li>
          <li style={listItemStyle}>Secure database storage with backups</li>
        </ul>
        <p style={paragraphStyle}>
          However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>7. Your Rights</h2>
        <p style={paragraphStyle}>You have the right to:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Access your personal data</li>
          <li style={listItemStyle}>Update or correct your information</li>
          <li style={listItemStyle}>Delete your account and associated data</li>
          <li style={listItemStyle}>Export your data in a portable format</li>
          <li style={listItemStyle}>Opt-out of non-essential communications</li>
          <li style={listItemStyle}>Restrict or object to certain data processing</li>
        </ul>
        <p style={paragraphStyle}>
          To exercise these rights, please contact us at privacy@devforge.io
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>8. Cookies and Tracking</h2>
        <p style={paragraphStyle}>
          We use cookies and similar technologies to:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Maintain your login session</li>
          <li style={listItemStyle}>Remember your preferences</li>
          <li style={listItemStyle}>Analyze platform usage and performance</li>
          <li style={listItemStyle}>Provide personalized features</li>
        </ul>
        <p style={paragraphStyle}>
          You can control cookies through your browser settings, but some features may not work properly if disabled.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>9. Data Retention</h2>
        <p style={paragraphStyle}>
          We retain your personal data for as long as your account is active or as needed to provide services. 
          When you delete your account, we will delete or anonymize your personal information within 30 days, 
          except where we must retain it for legal or security purposes.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>10. International Data Transfers</h2>
        <p style={paragraphStyle}>
          Your data may be transferred to and processed in countries other than your own. We ensure appropriate 
          safeguards are in place to protect your data in accordance with this privacy policy.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>11. Changes to This Policy</h2>
        <p style={paragraphStyle}>
          We may update this privacy policy from time to time. We will notify you of significant changes by 
          posting the new policy on this page and updating the "Last Updated" date. Your continued use of the 
          platform after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>12. Contact Us</h2>
        <p style={paragraphStyle}>
          If you have questions about this privacy policy or our data practices, please contact us:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Email: privacy@devforge.io</li>
          <li style={listItemStyle}>Address: DevForge Inc., 123 Dev Street, Tech City, TC 12345</li>
        </ul>
      </section>

      <div style={{ 
        marginTop: "48px", 
        paddingTop: "24px", 
        borderTop: "1px solid var(--border-color)",
        textAlign: "center",
      }}>
        <Link to="/terms" style={linkStyle}>Terms of Service</Link>
        {" • "}
        <Link to="/login" style={linkStyle}>Back to Login</Link>
        {" • "}
        <Link to="/" style={linkStyle}>Home</Link>
      </div>
    </div>
  );
};
