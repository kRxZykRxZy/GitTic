"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPathSafe = isPathSafe;
exports.safeResolvePath = safeResolvePath;
const node_path_1 = __importDefault(require("node:path"));
/**
 * Validates that a resolved path stays within an allowed base directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 */
function isPathSafe(basePath, userPath) {
    const resolved = node_path_1.default.resolve(basePath, userPath);
    const normalizedBase = node_path_1.default.resolve(basePath) + node_path_1.default.sep;
    return resolved.startsWith(normalizedBase) || resolved === node_path_1.default.resolve(basePath);
}
/**
 * Resolve a user path safely within a base directory.
 * Returns null if the path escapes the base.
 */
function safeResolvePath(basePath, userPath) {
    if (!isPathSafe(basePath, userPath))
        return null;
    return node_path_1.default.resolve(basePath, userPath);
}
//# sourceMappingURL=path-safety.js.map