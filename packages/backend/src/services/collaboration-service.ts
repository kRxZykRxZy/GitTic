import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";

/**
 * Live collaboration service using WebSockets
 * Enables real-time code editing, cursor sharing, and presence
 */

interface CollaborationClient {
    id: string;
    userId: string;
    username: string;
    ws: WebSocket;
    room: string; // format: "owner/repo/branch/path"
    cursor?: { line: number; column: number };
    selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

interface EditData {
    content?: string;
    changes?: unknown[];
    position?: { line: number; column: number };
}

interface CursorData {
    line: number;
    column: number;
}

interface SelectionData {
    start: { line: number; column: number };
    end: { line: number; column: number };
}

interface ChatData {
    message: string;
}

type CollaborationData = EditData | CursorData | SelectionData | ChatData | { [key: string]: unknown };

interface CollaborationMessage {
    type: "join" | "leave" | "edit" | "cursor" | "selection" | "presence" | "chat";
    userId: string;
    username: string;
    room: string;
    data?: CollaborationData;
    timestamp: string;
}

const clients = new Map<string, CollaborationClient>();
const rooms = new Map<string, Set<string>>(); // room -> Set of client IDs

/**
 * Initialize WebSocket server for live collaboration
 */
export function setupCollaboration(server: HttpServer): void {
    const wss = new WebSocketServer({
        server,
        path: "/api/v1/collab",
        verifyClient: (info: { req: IncomingMessage }, callback) => {
            // In production: verify JWT token from query string or header
            callback(true);
        }
    });

    wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
        const clientId = generateId();
        console.log(`[Collab] New connection: ${clientId}`);

        ws.on("message", (data: Buffer) => {
            try {
                const message: CollaborationMessage = JSON.parse(data.toString());
                handleMessage(clientId, ws, message);
            } catch (err) {
                console.error("[Collab] Error parsing message:", err);
            }
        });

        ws.on("close", () => {
            handleDisconnect(clientId);
        });

        ws.on("error", (err) => {
            console.error(`[Collab] WebSocket error for ${clientId}:`, err);
        });
    });

    console.log("[Collab] WebSocket server initialized");
}

/**
 * Handle incoming collaboration message
 */
function handleMessage(clientId: string, ws: WebSocket, message: CollaborationMessage): void {
    const { type, userId, username, room, data } = message;

    switch (type) {
        case "join":
            handleJoin(clientId, ws, userId, username, room);
            break;

        case "leave":
            handleLeave(clientId);
            break;

        case "edit":
            handleEdit(clientId, room, data);
            break;

        case "cursor":
            if (data) handleCursor(clientId, room, data as CursorData);
            break;

        case "selection":
            if (data) handleSelection(clientId, room, data as SelectionData);
            break;

        case "chat":
            if (data) handleChat(clientId, room, data as ChatData);
            break;

        default:
            console.warn(`[Collab] Unknown message type: ${type}`);
    }
}

/**
 * Handle user joining a collaboration room
 */
function handleJoin(
    clientId: string,
    ws: WebSocket,
    userId: string,
    username: string,
    room: string
): void {
    const client: CollaborationClient = {
        id: clientId,
        userId,
        username,
        ws,
        room
    };

    clients.set(clientId, client);

    if (!rooms.has(room)) {
        rooms.set(room, new Set());
    }
    rooms.get(room)!.add(clientId);

    // Notify others in the room
    broadcastToRoom(room, {
        type: "presence",
        userId,
        username,
        room,
        data: { action: "joined", clientId },
        timestamp: new Date().toISOString()
    }, clientId);

    // Send current room state to new user
    const roomClients = getRoomClients(room);
    const presence = roomClients.map(c => ({
        userId: c.userId,
        username: c.username,
        cursor: c.cursor,
        selection: c.selection
    }));

    send(ws, {
        type: "presence",
        userId,
        username,
        room,
        data: { clients: presence },
        timestamp: new Date().toISOString()
    });

    console.log(`[Collab] ${username} joined ${room}`);
}

/**
 * Handle user leaving a room
 */
function handleLeave(clientId: string): void {
    const client = clients.get(clientId);
    if (!client) return;

    const { room, username, userId } = client;

    // Remove from room
    rooms.get(room)?.delete(clientId);
    if (rooms.get(room)?.size === 0) {
        rooms.delete(room);
    }

    // Remove client
    clients.delete(clientId);

    // Notify others
    broadcastToRoom(room, {
        type: "presence",
        userId,
        username,
        room,
        data: { action: "left", clientId },
        timestamp: new Date().toISOString()
    });

    console.log(`[Collab] ${username} left ${room}`);
}

/**
 * Handle disconnect
 */
function handleDisconnect(clientId: string): void {
    handleLeave(clientId);
    console.log(`[Collab] Client disconnected: ${clientId}`);
}

/**
 * Handle edit event (code changes)
 */
function handleEdit(clientId: string, room: string, data: any): void {
    const client = clients.get(clientId);
    if (!client) return;

    // Broadcast edit to all clients in room except sender
    broadcastToRoom(room, {
        type: "edit",
        userId: client.userId,
        username: client.username,
        room,
        data,
        timestamp: new Date().toISOString()
    }, clientId);
}

/**
 * Handle cursor position update
 */
function handleCursor(clientId: string, room: string, data: { line: number; column: number }): void {
    const client = clients.get(clientId);
    if (!client) return;

    client.cursor = data;

    // Broadcast cursor position
    broadcastToRoom(room, {
        type: "cursor",
        userId: client.userId,
        username: client.username,
        room,
        data,
        timestamp: new Date().toISOString()
    }, clientId);
}

/**
 * Handle selection update
 */
function handleSelection(clientId: string, room: string, data: any): void {
    const client = clients.get(clientId);
    if (!client) return;

    client.selection = data;

    // Broadcast selection
    broadcastToRoom(room, {
        type: "selection",
        userId: client.userId,
        username: client.username,
        room,
        data,
        timestamp: new Date().toISOString()
    }, clientId);
}

/**
 * Handle chat message
 */
function handleChat(clientId: string, room: string, data: { message: string }): void {
    const client = clients.get(clientId);
    if (!client) return;

    // Broadcast chat message
    broadcastToRoom(room, {
        type: "chat",
        userId: client.userId,
        username: client.username,
        room,
        data,
        timestamp: new Date().toISOString()
    });
}

/**
 * Broadcast message to all clients in a room
 */
function broadcastToRoom(room: string, message: CollaborationMessage, excludeClientId?: string): void {
    const roomClientIds = rooms.get(room);
    if (!roomClientIds) return;

    const messageStr = JSON.stringify(message);

    roomClientIds.forEach(clientId => {
        if (clientId === excludeClientId) return;

        const client = clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(messageStr);
        }
    });
}

/**
 * Send message to specific client
 */
function send(ws: WebSocket, message: CollaborationMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

/**
 * Get all clients in a room
 */
function getRoomClients(room: string): CollaborationClient[] {
    const roomClientIds = rooms.get(room);
    if (!roomClientIds) return [];

    return Array.from(roomClientIds)
        .map(id => clients.get(id))
        .filter((c): c is CollaborationClient => c !== undefined);
}

/**
 * Generate unique client ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get collaboration statistics
 */
export function getCollaborationStats() {
    return {
        totalClients: clients.size,
        totalRooms: rooms.size,
        rooms: Array.from(rooms.entries()).map(([room, clientIds]) => ({
            room,
            clients: clientIds.size
        }))
    };
}
