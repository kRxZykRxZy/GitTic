/**
 * Conversation manager module.
 *
 * Maintains chat history per user/session with configurable max turns,
 * context window management, and serialization/deserialization support.
 *
 * @module conversation
 */

import { estimateTokenCount } from "./utils/token-counter.js";

/**
 * Role of a participant in a conversation.
 */
export type MessageRole = "system" | "user" | "assistant";

/**
 * A single message in a conversation.
 */
export interface ConversationMessage {
  /** Role of the message sender. */
  readonly role: MessageRole;
  /** Content of the message. */
  readonly content: string;
  /** ISO timestamp of when the message was created. */
  readonly timestamp: string;
  /** Estimated token count of this message. */
  readonly tokenCount: number;
  /** Optional metadata attached to the message. */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Configuration for a conversation session.
 */
export interface ConversationConfig {
  /** Maximum number of turns (message pairs) to retain. */
  readonly maxTurns: number;
  /** Maximum total token count for the conversation. */
  readonly maxTokens: number;
  /** System prompt to prepend to every request. */
  readonly systemPrompt: string;
  /** Whether to include timestamps in serialized output. */
  readonly includeTimestamps: boolean;
}

/**
 * Serialized conversation state for persistence.
 */
export interface SerializedConversation {
  /** Unique session identifier. */
  readonly sessionId: string;
  /** User identifier. */
  readonly userId: string;
  /** ISO timestamp of conversation creation. */
  readonly createdAt: string;
  /** ISO timestamp of last update. */
  readonly updatedAt: string;
  /** All messages in the conversation. */
  readonly messages: readonly ConversationMessage[];
  /** Configuration used for this conversation. */
  readonly config: ConversationConfig;
  /** Total token count of the conversation. */
  readonly totalTokens: number;
}

/**
 * Default conversation configuration.
 */
export const DEFAULT_CONVERSATION_CONFIG: ConversationConfig = {
  maxTurns: 20,
  maxTokens: 16_000,
  systemPrompt:
    "You are an AI coding assistant embedded in a development platform. Help users with coding questions, debugging, and development tasks.",
  includeTimestamps: true,
} as const;

/**
 * Creates a new conversation message with computed token count.
 *
 * @param role - The role of the message sender.
 * @param content - The message content.
 * @param metadata - Optional metadata.
 * @returns A fully constructed ConversationMessage.
 */
export function createMessage(
  role: MessageRole,
  content: string,
  metadata?: Record<string, unknown>
): ConversationMessage {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
    tokenCount: estimateTokenCount(content),
    metadata,
  };
}

/**
 * Manages a conversation session with history, token limits, and serialization.
 */
export class ConversationManager {
  private readonly sessionId: string;
  private readonly userId: string;
  private readonly config: ConversationConfig;
  private messages: ConversationMessage[];
  private readonly createdAt: string;
  private updatedAt: string;

  /**
   * Creates a new ConversationManager.
   *
   * @param sessionId - Unique session identifier.
   * @param userId - User identifier for this session.
   * @param config - Optional conversation configuration overrides.
   */
  constructor(
    sessionId: string,
    userId: string,
    config: Partial<ConversationConfig> = {}
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.config = { ...DEFAULT_CONVERSATION_CONFIG, ...config };
    this.messages = [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
  }

  /**
   * Adds a message to the conversation history.
   * Automatically trims older messages if limits are exceeded.
   *
   * @param role - The role of the message sender.
   * @param content - The message content.
   * @param metadata - Optional metadata to attach.
   * @returns The created message.
   */
  addMessage(
    role: MessageRole,
    content: string,
    metadata?: Record<string, unknown>
  ): ConversationMessage {
    const message = createMessage(role, content, metadata);
    this.messages.push(message);
    this.updatedAt = new Date().toISOString();
    this.trimToLimits();
    return message;
  }

  /**
   * Returns the current messages formatted for API submission.
   * Includes the system prompt as the first message.
   *
   * @returns Array of messages suitable for API request.
   */
  getMessagesForApi(): Array<{ role: MessageRole; content: string }> {
    const apiMessages: Array<{ role: MessageRole; content: string }> = [
      { role: "system", content: this.config.systemPrompt },
    ];

    for (const msg of this.messages) {
      apiMessages.push({ role: msg.role, content: msg.content });
    }

    return apiMessages;
  }

  /**
   * Returns the total estimated token count for the conversation.
   *
   * @returns Total token count including system prompt.
   */
  getTotalTokenCount(): number {
    const systemTokens = estimateTokenCount(this.config.systemPrompt);
    const messageTokens = this.messages.reduce(
      (sum, msg) => sum + msg.tokenCount,
      0
    );
    return systemTokens + messageTokens;
  }

  /**
   * Returns the number of conversation turns (user-assistant pairs).
   *
   * @returns Number of complete turns.
   */
  getTurnCount(): number {
    let turns = 0;
    for (const msg of this.messages) {
      if (msg.role === "user") {
        turns++;
      }
    }
    return turns;
  }

  /**
   * Returns all messages in the conversation.
   *
   * @returns Readonly array of conversation messages.
   */
  getMessages(): readonly ConversationMessage[] {
    return [...this.messages];
  }

  /**
   * Returns the most recent message, or undefined if empty.
   *
   * @returns The last message in the conversation.
   */
  getLastMessage(): ConversationMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  /**
   * Clears the entire conversation history.
   */
  clear(): void {
    this.messages = [];
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Serializes the conversation state for persistence.
   *
   * @returns A JSON-serializable conversation snapshot.
   */
  serialize(): SerializedConversation {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      messages: [...this.messages],
      config: { ...this.config },
      totalTokens: this.getTotalTokenCount(),
    };
  }

  /**
   * Restores a conversation from a serialized state.
   *
   * @param data - The serialized conversation to restore.
   * @returns A new ConversationManager with the restored state.
   */
  static deserialize(data: SerializedConversation): ConversationManager {
    const manager = new ConversationManager(
      data.sessionId,
      data.userId,
      data.config
    );
    for (const msg of data.messages) {
      manager.messages.push({ ...msg });
    }
    return manager;
  }

  /**
   * Trims conversation history to stay within configured limits.
   * Removes oldest non-system messages first.
   */
  private trimToLimits(): void {
    while (
      this.getTurnCount() > this.config.maxTurns &&
      this.messages.length > 0
    ) {
      this.messages.shift();
    }

    while (
      this.getTotalTokenCount() > this.config.maxTokens &&
      this.messages.length > 0
    ) {
      this.messages.shift();
    }
  }

  /**
   * Returns a summary of the conversation state.
   *
   * @returns Object with conversation statistics.
   */
  getStats(): {
    sessionId: string;
    userId: string;
    messageCount: number;
    turnCount: number;
    totalTokens: number;
    remainingTokens: number;
  } {
    const totalTokens = this.getTotalTokenCount();
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      messageCount: this.messages.length,
      turnCount: this.getTurnCount(),
      totalTokens,
      remainingTokens: Math.max(0, this.config.maxTokens - totalTokens),
    };
  }
}
