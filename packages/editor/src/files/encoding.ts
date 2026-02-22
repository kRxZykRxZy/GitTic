/**
 * File encoding detection and conversion utilities.
 * Handles UTF-8, UTF-16 (LE/BE), ASCII, and BOM (Byte Order Mark) processing.
 */

/**
 * Supported file encodings.
 */
export type FileEncoding = "utf-8" | "utf-16le" | "utf-16be" | "ascii" | "latin1";

/**
 * Result of an encoding detection operation.
 */
export interface EncodingDetectionResult {
  /** Detected encoding. */
  encoding: FileEncoding;
  /** Confidence level from 0.0 to 1.0. */
  confidence: number;
  /** Whether a BOM was found. */
  hasBom: boolean;
  /** Length of the BOM in bytes (0 if none). */
  bomLength: number;
}

/**
 * BOM (Byte Order Mark) signatures for encoding detection.
 */
const BOM_SIGNATURES: Array<{ encoding: FileEncoding; bom: number[]; length: number }> = [
  { encoding: "utf-8", bom: [0xef, 0xbb, 0xbf], length: 3 },
  { encoding: "utf-16be", bom: [0xfe, 0xff], length: 2 },
  { encoding: "utf-16le", bom: [0xff, 0xfe], length: 2 },
];

/**
 * Detect the encoding of a file from its raw bytes.
 * Checks for BOM first, then uses heuristic analysis.
 */
export function detectEncoding(buffer: Uint8Array): EncodingDetectionResult {
  const bomResult = detectBom(buffer);
  if (bomResult) {
    return bomResult;
  }

  return detectByHeuristic(buffer);
}

/**
 * Check for a BOM at the start of the buffer.
 */
function detectBom(buffer: Uint8Array): EncodingDetectionResult | null {
  for (const sig of BOM_SIGNATURES) {
    if (buffer.length >= sig.length) {
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig.bom[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        return {
          encoding: sig.encoding,
          confidence: 1.0,
          hasBom: true,
          bomLength: sig.length,
        };
      }
    }
  }
  return null;
}

/**
 * Detect encoding using heuristic byte pattern analysis.
 */
function detectByHeuristic(buffer: Uint8Array): EncodingDetectionResult {
  if (buffer.length === 0) {
    return { encoding: "utf-8", confidence: 0.5, hasBom: false, bomLength: 0 };
  }

  if (isValidUtf8(buffer)) {
    const hasHighBytes = buffer.some((b) => b > 127);
    return {
      encoding: "utf-8",
      confidence: hasHighBytes ? 0.9 : 0.8,
      hasBom: false,
      bomLength: 0,
    };
  }

  const nullByteRatio = countNullBytes(buffer) / buffer.length;
  if (nullByteRatio > 0.1) {
    const isLE = buffer.length >= 2 && buffer[1] === 0;
    return {
      encoding: isLE ? "utf-16le" : "utf-16be",
      confidence: 0.7,
      hasBom: false,
      bomLength: 0,
    };
  }

  const isAscii = buffer.every((b) => b < 128);
  if (isAscii) {
    return { encoding: "ascii", confidence: 0.95, hasBom: false, bomLength: 0 };
  }

  return { encoding: "latin1", confidence: 0.5, hasBom: false, bomLength: 0 };
}

/**
 * Validate that a buffer contains valid UTF-8 byte sequences.
 */
export function isValidUtf8(buffer: Uint8Array): boolean {
  let i = 0;
  while (i < buffer.length) {
    const byte = buffer[i];

    if (byte <= 0x7f) {
      i++;
    } else if ((byte & 0xe0) === 0xc0) {
      if (i + 1 >= buffer.length || (buffer[i + 1] & 0xc0) !== 0x80) return false;
      if (byte < 0xc2) return false; // overlong
      i += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      if (i + 2 >= buffer.length) return false;
      if ((buffer[i + 1] & 0xc0) !== 0x80 || (buffer[i + 2] & 0xc0) !== 0x80) return false;
      i += 3;
    } else if ((byte & 0xf8) === 0xf0) {
      if (i + 3 >= buffer.length) return false;
      if (
        (buffer[i + 1] & 0xc0) !== 0x80 ||
        (buffer[i + 2] & 0xc0) !== 0x80 ||
        (buffer[i + 3] & 0xc0) !== 0x80
      ) {
        return false;
      }
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}

/**
 * Count null bytes (0x00) in a buffer for encoding heuristics.
 */
function countNullBytes(buffer: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0) count++;
  }
  return count;
}

/**
 * Strip the BOM from the beginning of a string if present.
 */
export function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Add a UTF-8 BOM to the beginning of a string.
 */
export function addUtf8Bom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text;
  }
  return "\uFEFF" + text;
}

/**
 * Convert a buffer to a string using the specified encoding.
 */
export function decodeBuffer(buffer: Uint8Array, encoding: FileEncoding): string {
  const decoder = new TextDecoder(encodingToWebName(encoding));
  return decoder.decode(buffer);
}

/**
 * Encode a string to a buffer using the specified encoding.
 */
export function encodeString(text: string, encoding: FileEncoding): Uint8Array {
  const encoder = new TextEncoder();
  if (encoding === "utf-8" || encoding === "ascii") {
    return encoder.encode(text);
  }

  // For UTF-16 variants, use Buffer which supports encoding names
  const nodeEncoding = encoding === "utf-16le" ? "utf16le" : "utf16le";
  return new Uint8Array(Buffer.from(text, nodeEncoding));
}

/**
 * Map our encoding names to Web API TextDecoder-compatible names.
 */
function encodingToWebName(encoding: FileEncoding): string {
  switch (encoding) {
    case "utf-8":
      return "utf-8";
    case "utf-16le":
      return "utf-16le";
    case "utf-16be":
      return "utf-16be";
    case "ascii":
      return "ascii";
    case "latin1":
      return "iso-8859-1";
  }
}

/**
 * Detect the line ending style used in a text string.
 */
export function detectLineEnding(text: string): "lf" | "crlf" | "cr" | "mixed" {
  const crlfCount = (text.match(/\r\n/g) || []).length;
  const lfCount = (text.match(/(?<!\r)\n/g) || []).length;
  const crCount = (text.match(/\r(?!\n)/g) || []).length;

  const total = crlfCount + lfCount + crCount;
  if (total === 0) return "lf";

  if (crlfCount > 0 && lfCount === 0 && crCount === 0) return "crlf";
  if (lfCount > 0 && crlfCount === 0 && crCount === 0) return "lf";
  if (crCount > 0 && crlfCount === 0 && lfCount === 0) return "cr";
  return "mixed";
}

/**
 * Normalize line endings in a text to the specified style.
 */
export function normalizeLineEndings(text: string, ending: "lf" | "crlf"): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (ending === "crlf") {
    return normalized.replace(/\n/g, "\r\n");
  }
  return normalized;
}
