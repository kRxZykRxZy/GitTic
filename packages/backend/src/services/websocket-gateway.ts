import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";
import { verifyToken } from "@platform/auth";
import type { UserRole } from "@platform/shared";
import { getConfig } from "../config/app-config.js";

/**
 * WebSocket gateway.
 *
 * Provides real-time communication channels for:
 * - Per-file collaborative editing (cursor updates)
 * - Terminal streaming
 * - Build log streaming
 * - System notifications
 *
 * Clients authenticate by sending a token in their first message.
 * After authentication, clients can join rooms and exchange messages.
 */

/** Authenticated client metadata. */
interface ClientInfo {
  userId: string;
  username: string;
  role: UserRole;
  rooms: Set<string>;
  authenticated: boolean;
}

/** In-memory client registry. */
const _clients = new Map<WebSocket, ClientInfo>();

/** Room membership: room name → set of WebSocket connections. */
const _rooms = new Map<string, Set<WebSocket>>();

/** Singleton WSS instance. */
let _wss: WebSocketServer | null = null;

/**
 * Message types understood by the gateway.
 */
interface WsMessage {
  type: string;
  room?: string;
  data?: unknown;
  token?: string;
}

/**
 * Broadcast a message to all clients in a room, optionally
 * excluding the sender.
 *
 * @param room - The room name to broadcast to.
 * @param message - The message payload to send.
 * @param exclude - Optional WebSocket to exclude from broadcast.
 */
function broadcastToRoom(room: string, message: unknown, exclude?: WebSocket): void {
  const members = _rooms.get(room);
  if (!members) return;

  const payload = typeof message === "string" ? message : JSON.stringify(message);

  for (const ws of members) {
    if (ws !== exclude && ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

/**
 * Handle the authentication message from a newly connected client.
 * Verifies the JWT token and attaches user info to the connection.
 */
function handleAuth(ws: WebSocket, msg: WsMessage): boolean {
  if (!msg.token) {
    ws.send(JSON.stringify({ type: "error", error: "Token required" }));
    return false;
  }

  try {
    const payload = verifyToken(msg.token, getConfig().jwt.secret);
    const info: ClientInfo = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      rooms: new Set(),
      authenticated: true,
    };
    _clients.set(ws, info);

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
 * Handle a room join request.
 */
function handleJoin(ws: WebSocket, info: ClientInfo, room: string): void {
  // Add to room
  if (!_rooms.has(room)) {
    _rooms.set(room, new Set());
  }
  _rooms.get(room)!.add(ws);
  info.rooms.add(room);

  ws.send(JSON.stringify({ type: "room:joined", room }));

  // Notify others in the room
  broadcastToRoom(room, {
    type: "room:user_joined",
    room,
    userId: info.userId,
    username: info.username,
  }, ws);
}

/**
 * Handle a room leave request.
 */
function handleLeave(ws: WebSocket, info: ClientInfo, room: string): void {
  const members = _rooms.get(room);
  if (members) {
    members.delete(ws);
    if (members.size === 0) {
      _rooms.delete(room);
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
 * Handle cursor position updates for collaborative editing.
 */
function handleCursorUpdate(ws: WebSocket, info: ClientInfo, msg: WsMessage): void {
  if (!msg.room) return;

  broadcastToRoom(msg.room, {
    type: "cursor:update",
    room: msg.room,
    userId: info.userId,
    username: info.username,
    data: msg.data,
  }, ws);
}

/**
 * Handle terminal streaming data.
 */
function handleTerminalData(ws: WebSocket, info: ClientInfo, msg: WsMessage): void {
  if (!msg.room) return;

  broadcastToRoom(msg.room, {
    type: "terminal:data",
    room: msg.room,
    userId: info.userId,
    data: msg.data,
  }, ws);
}

/**
 * Handle build log streaming.
 */
function handleBuildLog(ws: WebSocket, _info: ClientInfo, msg: WsMessage): void {
  if (!msg.room) return;

  broadcastToRoom(msg.room, {
    type: "build:log",
    room: msg.room,
    data: msg.data,
  });
}

/**
 * Handle chat message broadcasting.
 */
function handleChatMessage(ws: WebSocket, info: ClientInfo, msg: WsMessage): void {
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
  }, ws);
  
  // Echo back to sender with confirmation
  ws.send(JSON.stringify({
    type: "chat:sent",
    room: msg.room,
    data: messageData,
  }));
}

/**
 * Handle typing indicator.
 */
function handleTyping(ws: WebSocket, info: ClientInfo, msg: WsMessage): void {
  if (!msg.room) return;

  broadcastToRoom(msg.room, {
    type: "chat:typing",
    room: msg.room,
    userId: info.userId,
    username: info.username,
  }, ws);
}

/**
 * Clean up a disconnected client.
 */
function cleanupClient(ws: WebSocket): void {
  const info = _clients.get(ws);
  if (info) {
    // Leave all rooms
    for (const room of info.rooms) {
      const members = _rooms.get(room);
      if (members) {
        members.delete(ws);
        if (members.size === 0) {
          _rooms.delete(room);
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
  _clients.delete(ws);
}

/**
 * Create and attach the WebSocket server to an existing HTTP server.
 *
 * @param server - The Node.js HTTP server to attach to.
 * @returns The WebSocket server instance.
 */
export function createWebSocketGateway(server: Server): WebSocketServer {
  if (_wss) {
    throw new Error("WebSocket gateway has already been initialized");
  }

  _wss = new WebSocketServer({ server, path: "/ws" });

  console.log("[ws] WebSocket gateway initialized on /ws");

  _wss.on("connection", (ws: WebSocket) => {
    // Client starts as unauthenticated
    _clients.set(ws, {
      userId: "",
      username: "",
      role: "user" as UserRole,
      rooms: new Set(),
      authenticated: false,
    });

    ws.on("message", (raw: Buffer | string) => {
      try {
        const msg: WsMessage = JSON.parse(
          typeof raw === "string" ? raw : raw.toString("utf-8"),
        );

        const info = _clients.get(ws);
        if (!info) return;

        // First message must be auth
        if (!info.authenticated) {
          if (msg.type === "auth") {
            handleAuth(ws, msg);
          } else {
            ws.send(JSON.stringify({ type: "error", error: "Authenticate first" }));
          }
          return;
        }

        // Route by message type
        switch (msg.type) {
          case "join":
            if (msg.room) handleJoin(ws, info, msg.room);
            break;
          case "leave":
            if (msg.room) handleLeave(ws, info, msg.room);
            break;
          case "cursor:update":
            handleCursorUpdate(ws, info, msg);
            break;
          case "terminal:data":
            handleTerminalData(ws, info, msg);
            break;
          case "build:log":
            handleBuildLog(ws, info, msg);
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
      cleanupClient(ws);
    });

    ws.on("error", (err) => {
      console.error("[ws] Client error:", err.message);
      cleanupClient(ws);
    });
  });

  return _wss;
}

/**
 * Return how many WebSocket gateway instances are currently active.
 * This should only ever be 0 (before startup/after shutdown) or 1.
 */
export function getWebSocketGatewayInstanceCount(): number {
  return _wss ? 1 : 0;
}

/**
 * Assert that there is exactly one active WebSocket gateway instance.
 */
export function assertSingleActiveWebSocketGateway(): void {
  const instanceCount = getWebSocketGatewayInstanceCount();
  if (instanceCount !== 1) {
    throw new Error(`Expected exactly 1 active WebSocket gateway instance, found ${instanceCount}`);
  }
}

/**
 * Get the total number of active WebSocket connections.
 * Used by admin dashboard and metrics endpoints.
 */
export function getActiveConnectionCount(): number {
  if (!_wss) return 0;
  return _wss.clients.size;
}

/**
 * Send a message to all authenticated clients.
 * Useful for system-wide announcements and notifications.
 *
 * @param message - The message payload to broadcast.
 */
export function broadcastAll(message: unknown): void {
  if (!_wss) return;

  const payload = typeof message === "string" ? message : JSON.stringify(message);

  for (const ws of _wss.clients) {
    const info = _clients.get(ws);
    if (info?.authenticated && ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

/**
 * Close the WebSocket server and clean up all connections.
 */
export function closeWebSocketGateway(): void {
  if (_wss) {
    for (const ws of _wss.clients) {
      ws.close(1001, "Server shutting down");
    }
    _wss.close();
    _wss = null;
    _clients.clear();
    _rooms.clear();
    console.log("[ws] WebSocket gateway closed");
  }
}
