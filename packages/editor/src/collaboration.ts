import type { CursorPosition } from "@platform/shared";

/**
 * CRDT collaboration manager using Yjs protocol.
 * Manages rooms (one per file), cursor awareness, and snapshot persistence.
 */

export interface YjsRoomState {
  roomId: string;
  projectId: string;
  filePath: string;
  participants: Set<string>;
  cursors: Map<string, CursorPosition>;
  lastSnapshot?: Uint8Array;
  createdAt: number;
}

export class CollaborationManager {
  private rooms = new Map<string, YjsRoomState>();

  /**
   * Create or join a room for a file.
   */
  joinRoom(
    projectId: string,
    filePath: string,
    userId: string
  ): YjsRoomState {
    const roomId = `${projectId}:${filePath}`;
    let room = this.rooms.get(roomId);

    if (!room) {
      room = {
        roomId,
        projectId,
        filePath,
        participants: new Set(),
        cursors: new Map(),
        createdAt: Date.now(),
      };
      this.rooms.set(roomId, room);
    }

    room.participants.add(userId);
    return room;
  }

  /**
   * Leave a room.
   */
  leaveRoom(projectId: string, filePath: string, userId: string): void {
    const roomId = `${projectId}:${filePath}`;
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants.delete(userId);
    room.cursors.delete(userId);

    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  /**
   * Update cursor position for a user.
   */
  updateCursor(
    projectId: string,
    filePath: string,
    cursor: CursorPosition
  ): void {
    const roomId = `${projectId}:${filePath}`;
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.cursors.set(cursor.userId, cursor);
  }

  /**
   * Get all cursor positions in a room.
   */
  getCursors(projectId: string, filePath: string): CursorPosition[] {
    const roomId = `${projectId}:${filePath}`;
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.cursors.values());
  }

  /**
   * Save a CRDT snapshot for persistence/recovery.
   */
  saveSnapshot(projectId: string, filePath: string, data: Uint8Array): void {
    const roomId = `${projectId}:${filePath}`;
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.lastSnapshot = data;
  }

  /**
   * Load a snapshot for reconnect recovery.
   */
  getSnapshot(projectId: string, filePath: string): Uint8Array | null {
    const roomId = `${projectId}:${filePath}`;
    const room = this.rooms.get(roomId);
    return room?.lastSnapshot || null;
  }

  /**
   * Get room info.
   */
  getRoom(projectId: string, filePath: string): YjsRoomState | null {
    const roomId = `${projectId}:${filePath}`;
    return this.rooms.get(roomId) || null;
  }

  /**
   * Get all active rooms.
   */
  getActiveRooms(): YjsRoomState[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get rooms for a specific project.
   */
  getProjectRooms(projectId: string): YjsRoomState[] {
    return Array.from(this.rooms.values()).filter(
      (r) => r.projectId === projectId
    );
  }
}
