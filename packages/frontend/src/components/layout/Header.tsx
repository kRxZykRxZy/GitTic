import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Top header bar with search input, user menu dropdown.
 */
export const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  /** Close dropdown when clicking outside */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "1px solid var(--border-color)",
    background: "var(--bg-secondary)",
    height: "56px",
    gap: "16px",
  };

  const searchStyle: React.CSSProperties = {
    flex: 1,
    maxWidth: "480px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 12px",
    fontSize: "14px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
  };

  const userMenuStyle: React.CSSProperties = {
    position: "relative",
  };

  const avatarBtnStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "var(--accent-purple)",
    border: "none",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "40px",
    right: 0,
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    minWidth: "180px",
    boxShadow: "var(--shadow)",
    zIndex: 100,
    padding: "4px 0",
  };

  const menuItemStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "8px 16px",
    fontSize: "14px",
    color: "var(--text-primary)",
    background: "none",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    background: "var(--border-color)",
    margin: "4px 0",
  };

  const initial = user?.username?.charAt(0).toUpperCase() ?? "?";

  return (
    <header style={headerStyle}>
      <form style={searchStyle} onSubmit={handleSearch}>
        <input
          style={inputStyle}
          type="text"
          placeholder="Search projects, users, code…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search"
        />
      </form>

      <div style={userMenuStyle} ref={menuRef}>
        <button
          style={avatarBtnStyle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="User menu"
          type="button"
        >
          {initial}
        </button>

        {menuOpen && (
          <div style={dropdownStyle}>
            <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>{user?.username}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{user?.email}</div>
            </div>
            <button style={menuItemStyle} onClick={() => { setMenuOpen(false); navigate("/settings"); }}>
              Profile &amp; Settings
            </button>
            {isAdmin && (
              <button style={menuItemStyle} onClick={() => { setMenuOpen(false); navigate("/admin"); }}>
                Admin Panel
              </button>
            )}
            <div style={dividerStyle} />
            <button style={{ ...menuItemStyle, color: "var(--accent-red)" }} onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
