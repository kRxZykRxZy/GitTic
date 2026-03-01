import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import type { Server } from "node:http";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { getConfig } from "./config/app-config.js";
import { closeDb } from "./db/connection.js";

/* ── Middleware ───────────────────────────────────────────── */
import { buildCorsOptions } from "./middleware/cors-config.js";
import { requestLogger } from "./middleware/request-logger.js";
import { notFoundHandler, globalErrorHandler } from "./middleware/error-handler.js";
import { createNodeForwardingMiddleware } from "./middleware/node-forwarding.js";
import { orchestrationMiddleware } from "./middleware/orchestration.js";

/* ── Routes ──────────────────────────────────────────────── */
import authRoutes from "./routes/auth-routes.js";
import userRoutes from "./routes/user-routes.js";
import projectRoutes from "./routes/project-routes.js";
import dashboardRoutes from "./routes/dashboard-routes.js";
import orgRoutes from "./routes/org-routes.js";
import clusterRoutes from "./routes/cluster-routes.js";
import pipelineRoutes from "./routes/pipeline-routes.js";
import adminRoutes from "./routes/admin-routes.js";
import moderationRoutes from "./routes/moderation-routes.js";
import searchRoutes from "./routes/search-routes.js";
import gitRoutes from "./routes/git-routes.js";
import aiRoutes from "./routes/ai-routes.js";
import healthRoutes from "./routes/health-routes.js";
import repositoryRoutes from "./routes/repository-routes.js";
import issueRoutes from "./routes/issue-routes.js";
import pullrequestRoutes from "./routes/pullrequest-routes.js";
import settingsRoutes from "./routes/settings-routes.js";
import organizationRoutes from "./routes/organization-routes.js";
import actionsRoutes from "./routes/actions-routes.js";
import wikiRoutes from "./routes/wiki-routes.js";
import insightsRoutes from "./routes/insights-routes.js";
import securityRoutes from "./routes/security-routes.js";
import notificationsRoutes from "./routes/notifications-routes.js";
import userSettingsRoutes from "./routes/user-settings-routes.js";
import adminAnalyticsRoutes from "./routes/admin-analytics-routes.js";
import announcementsRoutes from "./routes/announcements-routes.js";
import editorRoutes from "./routes/editor-routes.js";
import paymentMethodRoutes from "./routes/payment-method-routes.js";
import workflowRoutes from "./routes/workflow-routes.js";
import discussionRoutes from "./routes/discussion-routes.js";
import editorTerminalRoutes from "./routes/editor-terminal-routes.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
    assertSingleActiveWebSocketGateway,
    closeWebSocketGateway,
    createWebSocketGateway,
} from "./services/websocket-gateway.js";
import { createDeveloperChat } from "./services/developer-chat.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Create and configure the Express application.
 * Applies security middleware, CORS, compression, rate limiting,
 * and mounts all route groups.
 */
export function createServer(): { app: express.Express; start: () => Server } {
    const config = getConfig();
    const app = express();

    /* ── Security headers ────────────────────────────────────── */
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                },
            },
        }),
    );

    /* ── CORS ────────────────────────────────────────────────── */
    app.use(cors(buildCorsOptions()));

    /* ── Compression ─────────────────────────────────────────── */
    app.use(compression());

    /* ── Body parsers ────────────────────────────────────────── */
    app.use(express.json({ limit: "2mb" }));
    app.use(express.urlencoded({ extended: true, limit: "2mb" }));

    /* ── Cookie parser ───────────────────────────────────────── */
    app.use(cookieParser());

    /* ── Global rate limiting ────────────────────────────────── */
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: "Too many requests, please try again later." },
        }),
    );

    /* ── Request logging ─────────────────────────────────────── */
    app.use(requestLogger);

    /* ── Orchestration Mode (priority over node forwarding) ────── */
    if (process.env.FORWARDING_ORCHESTRER === "true") {
        console.log("[orchestration] Running in ORCHESTRATION mode - forwarding to clusters");
        app.use(orchestrationMiddleware);
    }
    /* ── Node Forwarding (optional) ──────────────────────────── */
    else if (process.env.NODE_FORWARD_URL) {
        const forwardUrl = process.env.NODE_FORWARD_URL;
        console.log(`[forward] Forwarding all requests to: ${forwardUrl}`);
        app.use(createNodeForwardingMiddleware(forwardUrl));
    }

    /* ── Health check (always available) ─────────────────────── */
    app.use("/api/v1/health", healthRoutes);

    /* ── API info endpoint ───────────────────────────────────── */
    app.get("/api/v1", (_req: Request, res: Response) => {
        res.json({
            name: "@platform/backend",
            version: "1.0.0",
            environment: config.nodeEnv,
        });
    });
    /* ── Mount route groups ─────────────────────────────────── */
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/user", userSettingsRoutes);
    app.use("/api/v1/user/payment-methods", paymentMethodRoutes);
    app.use("/api/v1/workflows", workflowRoutes);
    app.use("/api/v1/dashboard", dashboardRoutes);
    app.use("/api/v1/projects", projectRoutes);
    app.use("/api/v1/orgs", orgRoutes);
    app.use("/api/v1/organizations", organizationRoutes);
    app.use("/api/v1/clusters", clusterRoutes);
    app.use("/api/v1/announcements", announcementsRoutes);
    app.use("/api/v1", pipelineRoutes);
    app.use("/api/v1/admin", adminRoutes);
    app.use("/api/v1/admin", adminAnalyticsRoutes);
    app.use("/api/v1/moderation", moderationRoutes);
    app.use("/api/v1/search", searchRoutes);
    app.use("/api/v1/ai", aiRoutes);
    app.use("/api/v1/editor", editorRoutes);
    app.use("/api/v1/notifications", notificationsRoutes);
    app.use("/api/v1/repositories", repositoryRoutes);
    app.use("/api/v1/repositories", issueRoutes);
    app.use("/api/v1/repositories", pullrequestRoutes);
    app.use("/api/v1/repositories", discussionRoutes);
    app.use("/api/v1/repositories", settingsRoutes);
    app.use("/api/v1/repositories", actionsRoutes);
    app.use("/api/v1/repositories", wikiRoutes);
    app.use("/api/v1/repositories", insightsRoutes);
    app.use("/api/v1/repositories", securityRoutes);
    app.use("/api/v1/repositories", editorTerminalRoutes);
    app.use("/", gitRoutes);

    /* ── Serve frontend (React SPA) ─────────────────────────── */
    const frontendDist = resolve(__dirname, "../../frontend/dist");

    if (existsSync(frontendDist)) {
        // Serve static assets (JS bundles, CSS, images, etc.)
        // Hashed filenames get long cache; non-hashed get short cache.
        app.use(
            express.static(frontendDist, {
                index: false,
                maxAge: config.nodeEnv === "production" ? "1d" : 0,
                etag: true,
            }),
        );

        // SPA catch-all: any GET request that does NOT start with /api
        // is served the frontend index.html for client-side routing.
        const indexPath = join(frontendDist, "index.html");
        app.get(/^\/(?!api\/).*$/, (_req: Request, res: Response, next: NextFunction) => {
            res.sendFile(indexPath, (err) => {
                if (err) next(err);
            });
        });
    }

    /* ── 404 handler ─────────────────────────────────────────── */
    app.use(notFoundHandler);

    /* ── Global error handler ────────────────────────────────── */
    app.use(globalErrorHandler);

    /* ── Server start helper ─────────────────────────────────── */
    function start(): Server {
        const server = app.listen(config.port, config.host, () => {
            console.log(`🚀 Server listening on http://${config.host}:${config.port}`);

            // Check if running in orchestration mode
            const isOrchestrator = process.env.FORWARDING_ORCHESTRER === "true";
            if (isOrchestrator) {
                console.log("⚡ Running in ORCHESTRATION mode - requests will be forwarded to clusters");
            }
        });

        // Initialize WebSocket servers
        createWebSocketGateway(server);
        assertSingleActiveWebSocketGateway();
        createDeveloperChat(server);

        // Graceful shutdown
        const shutdown = (signal: string) => {
            console.log(`\n${signal} received – shutting down gracefully…`);
            server.close(() => {
                console.log("HTTP server closed.");
                closeWebSocketGateway();
                closeDb();
                console.log("Database connection closed.");
                process.exit(0);
            });

            // Force-kill after 10 seconds
            setTimeout(() => {
                console.error("Forced shutdown after timeout.");
                process.exit(1);
            }, 10_000).unref();
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        return server;
    }

    return { app, start };
}
