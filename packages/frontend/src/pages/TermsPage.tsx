import React from "react";
import { Link } from "react-router-dom";

/**
 * Terms and Conditions Page
 * Legal terms for using the platform
 */
export const TermsPage: React.FC = () => {
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
      <h1 style={titleStyle}>Terms and Conditions</h1>
      <p style={updateDateStyle}>Last Updated: February 18, 2026</p>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>1. Agreement to Terms</h2>
        <p style={paragraphStyle}>
          By accessing and using DevForge ("the Platform"), you agree to be bound by these Terms and Conditions 
          ("Terms"). If you do not agree to these Terms, please do not use the Platform.
        </p>
        <p style={paragraphStyle}>
          These Terms constitute a legally binding agreement between you and DevForge Inc. ("we," "us," or "our").
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>2. Age Requirements</h2>
        <p style={paragraphStyle}>
          <strong>You must be at least 13 years old to use DevForge.</strong> By creating an account, you represent 
          and warrant that you are 13 years of age or older.
        </p>
        <p style={paragraphStyle}>
          If we discover that a user is under 13 years of age, we will immediately terminate their account and delete 
          all associated data. Parents or guardians cannot create accounts on behalf of children under 13.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>3. Account Registration</h2>
        <p style={paragraphStyle}>
          To use certain features, you must create an account. You agree to:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Provide accurate, current, and complete information</li>
          <li style={listItemStyle}>Maintain and update your information to keep it accurate</li>
          <li style={listItemStyle}>Keep your password secure and confidential</li>
          <li style={listItemStyle}>Be responsible for all activities under your account</li>
          <li style={listItemStyle}>Notify us immediately of unauthorized access</li>
          <li style={listItemStyle}>Not share your account with others</li>
        </ul>
        <p style={paragraphStyle}>
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>4. Acceptable Use Policy</h2>
        <p style={paragraphStyle}>You agree NOT to:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Violate any laws or regulations</li>
          <li style={listItemStyle}>Infringe on intellectual property rights</li>
          <li style={listItemStyle}>Upload malicious code, viruses, or malware</li>
          <li style={listItemStyle}>Harass, threaten, or abuse other users</li>
          <li style={listItemStyle}>Impersonate others or misrepresent affiliation</li>
          <li style={listItemStyle}>Spam, phish, or engage in fraudulent activities</li>
          <li style={listItemStyle}>Scrape or crawl the Platform without permission</li>
          <li style={listItemStyle}>Attempt to gain unauthorized access to systems</li>
          <li style={listItemStyle}>Interfere with platform operations or other users</li>
          <li style={listItemStyle}>Use the Platform for illegal activities</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>5. Content and Intellectual Property</h2>
        <p style={paragraphStyle}>
          <strong>Your Content:</strong> You retain ownership of code and content you create. By uploading to DevForge, 
          you grant us a license to host, display, and distribute your content as necessary to provide the service.
        </p>
        <p style={paragraphStyle}>
          <strong>Public Repositories:</strong> Content in public repositories is visible to all users and may be 
          forked, cloned, or referenced by others according to the repository's license.
        </p>
        <p style={paragraphStyle}>
          <strong>Our Content:</strong> The Platform itself, including its design, features, and code, is protected 
          by intellectual property laws and remains our property.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>6. Privacy and Data Protection</h2>
        <p style={paragraphStyle}>
          Your use of the Platform is also governed by our{" "}
          <Link to="/privacy" style={linkStyle}>Privacy Policy</Link>, which explains how we collect, use, and 
          protect your data. We take data protection seriously and comply with applicable privacy laws.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>7. Service Availability</h2>
        <p style={paragraphStyle}>
          We strive to provide reliable service but cannot guarantee:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Uninterrupted or error-free operation</li>
          <li style={listItemStyle}>That defects will be corrected immediately</li>
          <li style={listItemStyle}>That the Platform is free from viruses or harmful components</li>
          <li style={listItemStyle}>That your data will never be lost (though we maintain backups)</li>
        </ul>
        <p style={paragraphStyle}>
          We reserve the right to modify, suspend, or discontinue any part of the Platform at any time.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>8. Disclaimer of Warranties</h2>
        <p style={paragraphStyle}>
          THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
          INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>9. Limitation of Liability</h2>
        <p style={paragraphStyle}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEVFORGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING FROM 
          YOUR USE OF THE PLATFORM.
        </p>
        <p style={paragraphStyle}>
          Our total liability for any claim shall not exceed the amount you paid us in the 12 months prior to the claim.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>10. Indemnification</h2>
        <p style={paragraphStyle}>
          You agree to indemnify and hold DevForge harmless from any claims, damages, losses, or expenses (including 
          legal fees) arising from:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Your use of the Platform</li>
          <li style={listItemStyle}>Your violation of these Terms</li>
          <li style={listItemStyle}>Your violation of any rights of others</li>
          <li style={listItemStyle}>Content you upload or share</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>11. Termination</h2>
        <p style={paragraphStyle}>
          We may terminate or suspend your account at any time for:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Violation of these Terms</li>
          <li style={listItemStyle}>Fraudulent or illegal activity</li>
          <li style={listItemStyle}>Age requirement violations (under 13)</li>
          <li style={listItemStyle}>Extended inactivity</li>
          <li style={listItemStyle}>At our discretion with or without cause</li>
        </ul>
        <p style={paragraphStyle}>
          You may delete your account at any time through the settings page.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>12. Governing Law</h2>
        <p style={paragraphStyle}>
          These Terms are governed by the laws of the State of California, United States, without regard to conflict 
          of law principles. Any disputes shall be resolved in the courts of California.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>13. Changes to Terms</h2>
        <p style={paragraphStyle}>
          We reserve the right to modify these Terms at any time. We will notify users of material changes via email 
          or platform notification. Your continued use after changes constitutes acceptance of the new Terms.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>14. Contact Information</h2>
        <p style={paragraphStyle}>
          For questions about these Terms, please contact us:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Email: legal@devforge.io</li>
          <li style={listItemStyle}>Address: DevForge Inc., 123 Dev Street, Tech City, TC 12345</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>15. Severability</h2>
        <p style={paragraphStyle}>
          If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
        </p>
      </section>

      <div style={{ 
        marginTop: "48px", 
        paddingTop: "24px", 
        borderTop: "1px solid var(--border-color)",
        textAlign: "center",
      }}>
        <Link to="/privacy" style={linkStyle}>Privacy Policy</Link>
        {" • "}
        <Link to="/login" style={linkStyle}>Back to Login</Link>
        {" • "}
        <Link to="/" style={linkStyle}>Home</Link>
      </div>
    </div>
  );
};
