/** WebSocket message types */
export type WsMessageType =
  | "auth"
  | "join_room"
  | "leave_room"
  | "crdt_update"
  | "cursor_update"
  | "snapshot"
  | "terminal_data"
  | "terminal_resize"
  | "build_log"
  | "toast"
  | "heartbeat"
  | "error";

/** Base WebSocket message */
export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
  timestamp: number;
}

/** Cursor position for collaborative editing */
export interface CursorPosition {
  userId: string;
  username: string;
  file: string;
  line: number;
  column: number;
  color: string;
}

/** Room (one per file for collaboration) */
export interface CollabRoom {
  roomId: string;
  projectId: string;
  filePath: string;
  participants: string[];
  createdAt: string;
}

/** Plugin/extension metadata */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  entryPoint: string;
  hooks: PluginHook[];
  permissions: string[];
}

export type PluginHook =
  | "editor:load"
  | "editor:save"
  | "pipeline:pre-stage"
  | "pipeline:post-stage"
  | "git:pre-push"
  | "git:post-push";

/** AI chat message */
export interface AiChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  repoContext?: string;
}
