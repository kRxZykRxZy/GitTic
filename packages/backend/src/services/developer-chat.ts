import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import { verifyToken } from "@platform/auth";
import type { UserRole } from "@platform/shared";
import { getConfig } from "../config/app-config.js";

/**
 * Developer Chat WebSocket Service
 * 
 * Provides real-time Discord-like chat for:
 * - Organization channels (org:orgname)
 * - Repository channels (repo:owner/name)
 * - Team collaboration
 */

interface ChatClientInfo {
    userId: string;
    username: string;
    role: UserRole;
    rooms: Set<string>;
    authenticated: boolean;
}

interface ChatMessage {
    type: string;
    room?: string;
    data?: unknown;
    token?: string;
}

/** Active chat clients */
const _chatClients = new Map<WebSocket, ChatClientInfo>();

/** Chat rooms: room name → set of WebSocket connections */
const _chatRooms = new Map<string, Set<WebSocket>>();

/** Singleton WebSocket server for chat */
let _chatWss: WebSocketServer | null = null;

/**
 * Broadcast message to all users in a chat room
 */
function broadcastToRoom(room: string, message: unknown, exclude?: WebSocket): void {
    const members = _chatRooms.get(room);
    if (!members) return;

    const payload = typeof message === "string" ? message : JSON.stringify(message);

    for (const ws of members) {
        if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    }
}

/**
 * Authenticate a chat client
 */
function authenticateClient(ws: WebSocket, msg: ChatMessage): boolean {
    if (!msg.token) {
        ws.send(JSON.stringify({ type: "error", error: "Token required" }));
        return false;
    }

    try {
        const payload = verifyToken(msg.token, getConfig().jwt.secret);
        const info: ChatClientInfo = {
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
            rooms: new Set(),
            authenticated: true,
        };
        _chatClients.set(ws, info);

        ws.send(JSON.stringify({
            type: "auth:success",
            userId: info.userId,
            username: info.username,
        }));

        return true;
    } catch {
        ws.send(JSON.stringify({ type: "error", error: "Invalid token" }));
        return false;
    }
}

/**
 * Join a chat room
 */
function joinRoom(ws: WebSocket, info: ChatClientInfo, room: string): void {
    if (!_chatRooms.has(room)) {
        _chatRooms.set(room, new Set());
    }
    _chatRooms.get(room)!.add(ws);
    info.rooms.add(room);

    ws.send(JSON.stringify({ type: "room:joined", room }));

    // Notify others
    broadcastToRoom(room, {
        type: "room:user_joined",
        room,
        userId: info.userId,
        username: info.username,
    }, ws);
}

/**
 * Leave a chat room
 */
function leaveRoom(ws: WebSocket, info: ChatClientInfo, room: string): void {
    const members = _chatRooms.get(room);
    if (members) {
        members.delete(ws);
        if (members.size === 0) {
            _chatRooms.delete(room);
        }
    }
    info.rooms.delete(room);

    ws.send(JSON.stringify({ type: "room:left", room }));

    broadcastToRoom(room, {
        type: "room:user_left",
        room,
        userId: info.userId,
        username: info.username,
    });
}

/**
 * Handle chat message
 */
function handleChatMessage(ws: WebSocket, info: ChatClientInfo, msg: ChatMessage): void {
    if (!msg.room || !msg.data) return;

    const messageData = msg.data as { text: string; timestamp?: string };

    broadcastToRoom(msg.room, {
        type: "chat:message",
        room: msg.room,
        userId: info.userId,
        username: info.username,
        data: {
            text: messageData.text,
            timestamp: messageData.timestamp || new Date().toISOString(),
        },
    });
}

/**
 * Handle typing indicator
 */
function handleTyping(ws: WebSocket, info: ChatClientInfo, msg: ChatMessage): void {
    if (!msg.room) return;

    broadcastToRoom(msg.room, {
        type: "chat:typing",
        room: msg.room,
        userId: info.userId,
        username: info.username,
    }, ws);
}

/**
 * Clean up disconnected client
 */
function cleanupChatClient(ws: WebSocket): void {
    const info = _chatClients.get(ws);
    if (info) {
        for (const room of info.rooms) {
            const members = _chatRooms.get(room);
            if (members) {
                members.delete(ws);
                if (members.size === 0) {
                    _chatRooms.delete(room);
                } else {
                    broadcastToRoom(room, {
                        type: "room:user_left",
                        room,
                        userId: info.userId,
                        username: info.username,
                    });
                }
            }
        }
    }
    _chatClients.delete(ws);
}

/**
 * Create developer chat WebSocket server
 */
export function createDeveloperChat(server: Server): WebSocketServer {
    if (_chatWss) return _chatWss;

    _chatWss = new WebSocketServer({
        server,
        path: "/api/v1/developer/chat"
    });

    console.log("[DevChat] Developer chat WebSocket initialized on /api/v1/developer/chat");

    _chatWss.on("connection", (ws: WebSocket) => {
        _chatClients.set(ws, {
            userId: "",
            username: "",
            role: "user" as UserRole,
            rooms: new Set(),
            authenticated: false,
        });

        ws.on("message", (raw: Buffer | string) => {
            try {
                const msg: ChatMessage = JSON.parse(
                    typeof raw === "string" ? raw : raw.toString("utf-8")
                );

                const info = _chatClients.get(ws);
                if (!info) return;

                // First message must be auth
                if (!info.authenticated) {
                    if (msg.type === "auth") {
                        authenticateClient(ws, msg);
                    } else {
                        ws.send(JSON.stringify({ type: "error", error: "Authenticate first" }));
                    }
                    return;
                }

                // Handle authenticated messages
                switch (msg.type) {
                    case "join":
                        if (msg.room) joinRoom(ws, info, msg.room);
                        break;
                    case "leave":
                        if (msg.room) leaveRoom(ws, info, msg.room);
                        break;
                    case "chat:message":
                        handleChatMessage(ws, info, msg);
                        break;
                    case "chat:typing":
                        handleTyping(ws, info, msg);
                        break;
                    case "ping":
                        ws.send(JSON.stringify({ type: "pong" }));
                        break;
                    default:
                        ws.send(JSON.stringify({ type: "error", error: `Unknown type: ${msg.type}` }));
                }
            } catch {
                ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
            }
        });

        ws.on("close", () => {
            cleanupChatClient(ws);
        });

        ws.on("error", (err) => {
            console.error("[DevChat] Client error:", err.message);
            cleanupChatClient(ws);
        });
    });

    return _chatWss;
}

/**
 * Get active chat connections count
 */
export function getChatConnectionCount(): number {
    if (!_chatWss) return 0;
    return _chatWss.clients.size;
}

/**
 * Close developer chat server
 */
export function closeDeveloperChat(): void {
    if (_chatWss) {
        for (const ws of _chatWss.clients) {
            ws.close(1001, "Server shutting down");
        }
        _chatWss.close();
        _chatWss = null;
        _chatClients.clear();
        _chatRooms.clear();
        console.log("[DevChat] Developer chat closed");
    }
}
