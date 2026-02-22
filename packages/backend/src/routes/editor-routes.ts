import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";

/**
 * Code editor routes for web-based editing
 * Integrates with packages/editor for VSCode-like experience
 */
const router = Router();

/**
 * GET /api/editor/file/:owner/:repo/:branch/*path
 * Get file for editing
 */
router.get(
    /^\/file\/([^\/]+)\/([^\/]+)\/([^\/]+)(?:\/(.*))?$/,
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = req.params[0];
            const repo = req.params[1];
            const branch = req.params[2];
            const path = req.params[3] || "";

            const file = {
                path,
                content: "// File content here\nconsole.log('Hello, World!');",
                encoding: "utf-8",
                size: 100,
                sha: "abc123",
                language: "javascript"
            };

            res.json(file);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * PUT /api/editor/file/:owner/:repo/:branch/*path
 * Save file changes
 */
router.put(
    /^\/file\/([^\/]+)\/([^\/]+)\/([^\/]+)(?:\/(.*))?$/,
    requireAuth,
    validate([
        { field: "content", location: "body", required: true, type: "string" },
        { field: "message", location: "body", required: true, type: "string", min: 1, max: 500 },
        { field: "sha", location: "body", type: "string" }
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = req.params[0];
            const repo = req.params[1];
            const branch = req.params[2];
            const path = req.params[3] || "";
            const { content, message, sha } = req.body;

            const commit = {
                sha: Date.now().toString(36),
                message,
                author: {
                    name: req.user?.username,
                    email: "user@example.com"
                },
                content: {
                    path,
                    sha: Date.now().toString(36)
                },
                createdAt: new Date().toISOString()
            };

            res.json(commit);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/editor/file/:owner/:repo/:branch/*path
 * Create new file
 */
router.post(
    /^\/file\/([^\/]+)\/([^\/]+)\/([^\/]+)(?:\/(.*))?$/,
    requireAuth,
    validate([
        { field: "content", location: "body", required: true, type: "string" },
        { field: "message", location: "body", required: true, type: "string", min: 1, max: 500 }
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = req.params[0];
            const repo = req.params[1];
            const branch = req.params[2];
            const path = req.params[3] || "";
            const { content, message } = req.body;

            const commit = {
                sha: Date.now().toString(36),
                message,
                author: {
                    name: req.user?.username,
                    email: "user@example.com"
                },
                content: {
                    path,
                    sha: Date.now().toString(36)
                },
                createdAt: new Date().toISOString()
            };

            res.status(201).json(commit);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * DELETE /api/editor/file/:owner/:repo/:branch/*path
 * Delete file
 */
router.delete(
    /^\/file\/([^\/]+)\/([^\/]+)\/([^\/]+)(?:\/(.*))?$/,
    requireAuth,
    validate([
        { field: "message", location: "body", required: true, type: "string", min: 1, max: 500 },
        { field: "sha", location: "body", required: true, type: "string" }
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = req.params[0];
            const repo = req.params[1];
            const branch = req.params[2];
            const path = req.params[3] || "";
            const { message, sha } = req.body;

            const commit = {
                sha: Date.now().toString(36),
                message,
                author: {
                    name: req.user?.username,
                    email: "user@example.com"
                },
                createdAt: new Date().toISOString()
            };

            res.json(commit);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/editor/upload/:owner/:repo/:branch/*path
 * Upload file(s)
 */
router.post(
    /^\/upload\/([^\/]+)\/([^\/]+)\/([^\/]+)(?:\/(.*))?$/,
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = req.params[0];
            const repo = req.params[1];
            const branch = req.params[2];
            const path = req.params[3] || "";

            // In production: handle multipart file upload
            res.json({
                message: "Files uploaded",
                path,
                count: 1
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/editor/languages
 * Get list of supported languages for syntax highlighting
 */
router.get(
    "/languages",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const languages = [
                { id: "javascript", name: "JavaScript", extensions: [".js", ".jsx"] },
                { id: "typescript", name: "TypeScript", extensions: [".ts", ".tsx"] },
                { id: "python", name: "Python", extensions: [".py"] },
                { id: "go", name: "Go", extensions: [".go"] },
                { id: "rust", name: "Rust", extensions: [".rs"] },
                { id: "java", name: "Java", extensions: [".java"] },
                { id: "cpp", name: "C++", extensions: [".cpp", ".cc", ".h"] },
                { id: "json", name: "JSON", extensions: [".json"] },
                { id: "yaml", name: "YAML", extensions: [".yml", ".yaml"] },
                { id: "markdown", name: "Markdown", extensions: [".md"] }
            ];

            res.json(languages);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/editor/themes
 * Get list of editor themes
 */
router.get(
    "/themes",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const themes = [
                { id: "vs-dark", name: "Dark+ (default dark)" },
                { id: "vs-light", name: "Light+ (default light)" },
                { id: "github-dark", name: "GitHub Dark" },
                { id: "github-light", name: "GitHub Light" },
                { id: "monokai", name: "Monokai" },
                { id: "dracula", name: "Dracula" }
            ];

            res.json(themes);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/editor/snippets/:language
 * Get code snippets for a language
 */
router.get(
    "/snippets/:language",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { language } = req.params;

            const snippets = [
                {
                    name: "Function",
                    prefix: "func",
                    body: "function ${1:name}(${2:params}) {\n\t${3:// body}\n}"
                },
                {
                    name: "Arrow Function",
                    prefix: "arrf",
                    body: "const ${1:name} = (${2:params}) => {\n\t${3:// body}\n};"
                }
            ];

            res.json(snippets);
        } catch (err) {
            next(err);
        }
    }
);

export default router;
