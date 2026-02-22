import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { AnnouncementsBar } from "../announcements/AnnouncementsBar";
import { AIChat } from "../common/AIChat";

/**
 * Main layout with sidebar + header + content area (Outlet) + footer.
 */
export const Layout: React.FC = () => {
    const layoutStyle: React.CSSProperties = {
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
    };

    const sidebarWrapper: React.CSSProperties = {
        width: "240px",
        flexShrink: 0,
        borderRight: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        display: "flex",
        flexDirection: "column",
    };

    const mainWrapper: React.CSSProperties = {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
    };

    const contentStyle: React.CSSProperties = {
        flex: 1,
        padding: "24px",
        overflowY: "auto",
    };

    return (
        <>
            <AnnouncementsBar />
            <div style={layoutStyle}>
                <aside style={sidebarWrapper}>
                    <Sidebar />
                </aside>
                <div style={mainWrapper}>
                    <Header />
                    <main style={contentStyle}>
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
            <AIChat />
        </>
    );
};
