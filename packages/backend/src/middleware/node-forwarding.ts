import { type Request, type Response, type NextFunction } from "express";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

/**
 * Node forwarding middleware.
 * If NODE_FORWARD_URL is set, forwards all requests to the specified node
 * and returns the response transparently.
 */
export function createNodeForwardingMiddleware(forwardUrl?: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip if forwarding is not configured
        if (!forwardUrl) {
            next();
            return;
        }

        // Skip health checks and critical paths (optional)
        if (req.path === "/api/v1/health" || req.path.startsWith("/healthz")) {
            next();
            return;
        }

        try {
            const targetUrl = new URL(forwardUrl);
            const protocol = targetUrl.protocol === "https:" ? https : http;

            // Build the target request URL
            const pathWithQuery = req.originalUrl.replace(/^[^?]+/, targetUrl.pathname.replace(/\/$/, "")) + (req.originalUrl.includes("?") ? req.originalUrl.substring(req.originalUrl.indexOf("?")) : "");

            const options = {
                method: req.method,
                headers: {
                    ...req.headers,
                    "x-forwarded-for": req.ip || req.connection.remoteAddress,
                    "x-forwarded-proto": req.protocol,
                    "x-forwarded-host": req.hostname,
                },
            };

            // Remove host header to avoid conflicts
            delete (options.headers as any).host;

            const proxyReq = protocol.request(
                {
                    hostname: targetUrl.hostname,
                    port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
                    path: pathWithQuery,
                    ...options,
                },
                (proxyRes) => {
                    // Copy response status and headers
                    res.status(proxyRes.statusCode || 200);

                    Object.entries(proxyRes.headers).forEach(([key, value]) => {
                        // Skip certain headers
                        if (!["transfer-encoding", "content-encoding"].includes(key.toLowerCase()) && value !== undefined) {
                            res.setHeader(key, value as string | string[]);
                        }
                    });

                    // Pipe response body
                    proxyRes.pipe(res);
                },
            );

            // Handle proxy request errors
            proxyReq.on("error", (err) => {
                console.error("[forward] Proxy request error:", err.message);
                res.status(502).json({
                    error: "Bad Gateway",
                    message: "Unable to reach forwarded node",
                    code: "BAD_GATEWAY",
                });
            });

            // Pipe request body
            if (req.method !== "GET" && req.method !== "HEAD") {
                req.pipe(proxyReq);
            } else {
                proxyReq.end();
            }
        } catch (err) {
            console.error("[forward] Forwarding middleware error:", err);
            next();
        }
    };
}
