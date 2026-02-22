/**
 * Streaming response handler module.
 *
 * Parses Server-Sent Events (SSE) streams, emits chunks,
 * handles backpressure, and provides timeout management
 * for streaming AI responses.
 *
 * @module streaming
 */

/**
 * A single chunk from a streaming response.
 */
export interface StreamChunk {
  /** The text content of this chunk. */
  readonly content: string;
  /** Sequential index of this chunk in the stream. */
  readonly index: number;
  /** Whether this is the final chunk in the stream. */
  readonly done: boolean;
  /** Timestamp when this chunk was received. */
  readonly receivedAt: number;
}

/**
 * Configuration for stream processing.
 */
export interface StreamConfig {
  /** Timeout in ms for receiving the first chunk. */
  readonly firstChunkTimeoutMs: number;
  /** Timeout in ms between consecutive chunks. */
  readonly interChunkTimeoutMs: number;
  /** Maximum total duration of the stream in ms. */
  readonly maxDurationMs: number;
  /** Maximum number of chunks to process. */
  readonly maxChunks: number;
  /** Buffer size for backpressure management (in chunks). */
  readonly bufferSize: number;
}

/**
 * Handler callbacks for stream events.
 */
export interface StreamHandlers {
  /** Called for each received chunk. */
  readonly onChunk: (chunk: StreamChunk) => void;
  /** Called when the stream completes successfully. */
  readonly onComplete: (result: StreamResult) => void;
  /** Called when a stream error occurs. */
  readonly onError: (error: StreamError) => void;
}

/**
 * Result of a completed stream.
 */
export interface StreamResult {
  /** Complete concatenated content from all chunks. */
  readonly content: string;
  /** Total number of chunks received. */
  readonly chunkCount: number;
  /** Total duration in milliseconds. */
  readonly durationMs: number;
  /** Average time between chunks in milliseconds. */
  readonly avgChunkIntervalMs: number;
}

/**
 * Error from stream processing.
 */
export interface StreamError {
  /** Error code identifier. */
  readonly code: string;
  /** Human-readable error message. */
  readonly message: string;
  /** Partial content received before the error. */
  readonly partialContent: string;
  /** Number of chunks received before the error. */
  readonly chunksReceived: number;
}

/**
 * Default streaming configuration.
 */
export const DEFAULT_STREAM_CONFIG: StreamConfig = {
  firstChunkTimeoutMs: 15_000,
  interChunkTimeoutMs: 10_000,
  maxDurationMs: 120_000,
  maxChunks: 10_000,
  bufferSize: 100,
} as const;

/**
 * Parses a raw SSE data line into its content.
 *
 * SSE lines follow the format: `data: <content>` or `data: [DONE]`.
 *
 * @param line - Raw SSE line from the stream.
 * @returns The extracted content, or null if the line is a terminator or empty.
 */
export function parseSSELine(line: string): string | null {
  const trimmed = line.trim();

  if (trimmed === "" || trimmed.startsWith(":")) {
    return null;
  }

  if (!trimmed.startsWith("data:")) {
    return null;
  }

  const data = trimmed.slice(5).trim();

  if (data === "[DONE]") {
    return null;
  }

  return data;
}

/**
 * Parses SSE data that may contain JSON with a content field.
 *
 * @param data - Raw data string from SSE.
 * @returns Extracted text content, or the raw data if not JSON.
 */
export function extractContentFromSSE(data: string): string {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    if (typeof parsed === "object" && parsed !== null) {
      const choices = parsed["choices"] as
        | Array<{ delta?: { content?: string } }>
        | undefined;
      if (choices && choices.length > 0) {
        const delta = choices[0]?.delta;
        if (delta && typeof delta.content === "string") {
          return delta.content;
        }
      }
      if (typeof parsed["content"] === "string") {
        return parsed["content"] as string;
      }
    }
  } catch {
    // Not JSON, return raw data
  }
  return data;
}

/**
 * Buffer for managing backpressure on incoming stream chunks.
 */
export class ChunkBuffer {
  private readonly chunks: StreamChunk[] = [];
  private readonly maxSize: number;
  private droppedCount = 0;

  /**
   * Creates a new chunk buffer.
   *
   * @param maxSize - Maximum number of chunks to buffer.
   */
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Adds a chunk to the buffer. Drops oldest if at capacity.
   *
   * @param chunk - The chunk to buffer.
   * @returns True if the chunk was added, false if dropped.
   */
  push(chunk: StreamChunk): boolean {
    if (this.chunks.length >= this.maxSize) {
      this.chunks.shift();
      this.droppedCount++;
      return false;
    }
    this.chunks.push(chunk);
    return true;
  }

  /**
   * Removes and returns the oldest chunk from the buffer.
   *
   * @returns The oldest buffered chunk, or undefined if empty.
   */
  shift(): StreamChunk | undefined {
    return this.chunks.shift();
  }

  /**
   * Returns the current number of buffered chunks.
   */
  get size(): number {
    return this.chunks.length;
  }

  /**
   * Returns the total number of dropped chunks due to backpressure.
   */
  get dropped(): number {
    return this.droppedCount;
  }

  /**
   * Drains all chunks from the buffer.
   *
   * @returns Array of all buffered chunks.
   */
  drain(): StreamChunk[] {
    const result = [...this.chunks];
    this.chunks.length = 0;
    return result;
  }

  /**
   * Returns true if the buffer is full.
   */
  get isFull(): boolean {
    return this.chunks.length >= this.maxSize;
  }
}

/**
 * Processes a raw text stream and splits it into SSE lines.
 *
 * Handles partial lines that span multiple stream reads by
 * buffering incomplete lines until the next read.
 *
 * @param rawText - Raw text from a stream read.
 * @param partialLine - Any incomplete line from the previous read.
 * @returns An object with parsed lines and any remaining partial line.
 */
export function splitSSELines(
  rawText: string,
  partialLine: string = ""
): { lines: string[]; remaining: string } {
  const combined = partialLine + rawText;
  const parts = combined.split("\n");
  const remaining = parts.pop() ?? "";
  return { lines: parts, remaining };
}

/**
 * Accumulates stream chunks into a final result.
 */
export class StreamAccumulator {
  private readonly parts: string[] = [];
  private readonly startTime: number;
  private chunkTimes: number[] = [];
  private chunkCount = 0;

  /**
   * Creates a new stream accumulator.
   */
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Adds a chunk's content to the accumulator.
   *
   * @param content - Text content to accumulate.
   */
  addChunk(content: string): void {
    this.parts.push(content);
    this.chunkTimes.push(Date.now());
    this.chunkCount++;
  }

  /**
   * Returns the concatenated content of all chunks.
   */
  getContent(): string {
    return this.parts.join("");
  }

  /**
   * Builds the final stream result.
   *
   * @returns A StreamResult with timing and content statistics.
   */
  getResult(): StreamResult {
    const endTime = Date.now();
    const durationMs = endTime - this.startTime;

    let avgChunkIntervalMs = 0;
    if (this.chunkTimes.length > 1) {
      let totalInterval = 0;
      for (let i = 1; i < this.chunkTimes.length; i++) {
        totalInterval += this.chunkTimes[i]! - this.chunkTimes[i - 1]!;
      }
      avgChunkIntervalMs = totalInterval / (this.chunkTimes.length - 1);
    }

    return {
      content: this.getContent(),
      chunkCount: this.chunkCount,
      durationMs,
      avgChunkIntervalMs,
    };
  }

  /**
   * Returns the current accumulated chunk count.
   */
  getChunkCount(): number {
    return this.chunkCount;
  }
}

/**
 * Creates a StreamError object from an error condition.
 *
 * @param code - Error code identifier.
 * @param message - Human-readable message.
 * @param accumulator - Current stream accumulator for partial content.
 * @returns A StreamError instance.
 */
export function createStreamError(
  code: string,
  message: string,
  accumulator: StreamAccumulator
): StreamError {
  return {
    code,
    message,
    partialContent: accumulator.getContent(),
    chunksReceived: accumulator.getChunkCount(),
  };
}
