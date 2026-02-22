import { createHash } from "node:crypto";
import { readFile, writeFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { resolveObjectPath } from "./lfs-manager.js";

/** An LFS object descriptor used in the batch API. */
export interface LfsObject {
  oid: string;
  size: number;
}

/** A batch API request payload. */
export interface LfsBatchRequest {
  operation: "upload" | "download";
  transfers: string[];
  objects: LfsObject[];
}

/** A single object response in the batch API result. */
export interface LfsBatchObjectResponse {
  oid: string;
  size: number;
  authenticated: boolean;
  actions: LfsActions | undefined;
  error: LfsObjectError | undefined;
}

/** Transfer action URLs for an LFS object. */
export interface LfsActions {
  upload?: LfsTransferAction;
  download?: LfsTransferAction;
  verify?: LfsTransferAction;
}

/** A single transfer action with URL, headers, and expiry. */
export interface LfsTransferAction {
  href: string;
  header: Record<string, string>;
  expiresIn: number;
}

/** Error details for a failed LFS object operation. */
export interface LfsObjectError {
  code: number;
  message: string;
}

/**
 * Process a batch API request and return responses for each object.
 * Checks object existence for downloads, creates upload targets for uploads.
 */
export async function processBatchRequest(
  storagePath: string,
  request: LfsBatchRequest,
  baseUrl: string
): Promise<LfsBatchObjectResponse[]> {
  const responses: LfsBatchObjectResponse[] = [];

  for (const obj of request.objects) {
    const objectPath = resolveObjectPath(storagePath, obj.oid);

    if (request.operation === "download") {
      const response = await buildDownloadResponse(objectPath, obj, baseUrl);
      responses.push(response);
    } else {
      const response = await buildUploadResponse(objectPath, obj, baseUrl);
      responses.push(response);
    }
  }

  return responses;
}

/**
 * Build a download response for an LFS object.
 * Returns a download action URL if the object exists, error otherwise.
 */
async function buildDownloadResponse(
  objectPath: string,
  obj: LfsObject,
  baseUrl: string
): Promise<LfsBatchObjectResponse> {
  try {
    const fileStat = await stat(objectPath);

    if (fileStat.size !== obj.size) {
      return {
        oid: obj.oid,
        size: obj.size,
        authenticated: true,
        actions: undefined,
        error: { code: 422, message: "Size mismatch" },
      };
    }

    return {
      oid: obj.oid,
      size: obj.size,
      authenticated: true,
      actions: {
        download: {
          href: `${baseUrl}/objects/${obj.oid}`,
          header: {},
          expiresIn: 3600,
        },
      },
      error: undefined,
    };
  } catch {
    return {
      oid: obj.oid,
      size: obj.size,
      authenticated: true,
      actions: undefined,
      error: { code: 404, message: "Object not found" },
    };
  }
}

/**
 * Build an upload response for an LFS object.
 * Skips upload action if the object already exists with correct size.
 */
async function buildUploadResponse(
  objectPath: string,
  obj: LfsObject,
  baseUrl: string
): Promise<LfsBatchObjectResponse> {
  try {
    const fileStat = await stat(objectPath);

    if (fileStat.size === obj.size) {
      return {
        oid: obj.oid,
        size: obj.size,
        authenticated: true,
        actions: undefined,
        error: undefined,
      };
    }
  } catch {
    // Object doesn't exist, needs upload
  }

  return {
    oid: obj.oid,
    size: obj.size,
    authenticated: true,
    actions: {
      upload: {
        href: `${baseUrl}/objects/${obj.oid}`,
        header: {},
        expiresIn: 3600,
      },
      verify: {
        href: `${baseUrl}/objects/${obj.oid}/verify`,
        header: {},
        expiresIn: 3600,
      },
    },
    error: undefined,
  };
}

/**
 * Verify the content hash of an uploaded LFS object.
 * Reads the stored file and compares its SHA-256 hash to the expected OID.
 */
export async function verifyObject(
  storagePath: string,
  oid: string,
  expectedSize: number
): Promise<{ valid: boolean; reason: string }> {
  const objectPath = resolveObjectPath(storagePath, oid);

  try {
    const fileStat = await stat(objectPath);

    if (fileStat.size !== expectedSize) {
      return {
        valid: false,
        reason: `Size mismatch: expected ${expectedSize}, got ${fileStat.size}`,
      };
    }

    const content = await readFile(objectPath);
    const computedHash = createHash("sha256").update(content).digest("hex");

    if (computedHash !== oid) {
      await unlink(objectPath).catch(() => {});
      return {
        valid: false,
        reason: `Hash mismatch: expected ${oid}, computed ${computedHash}`,
      };
    }

    return { valid: true, reason: "Object verified successfully" };
  } catch {
    return { valid: false, reason: "Object not found" };
  }
}

/**
 * Store an LFS object from raw content, verifying the hash matches.
 * Returns the path where the object was stored.
 */
export async function storeObject(
  storagePath: string,
  oid: string,
  content: Buffer
): Promise<string> {
  const computedHash = createHash("sha256").update(content).digest("hex");

  if (computedHash !== oid) {
    throw new Error(`Content hash mismatch: expected ${oid}, got ${computedHash}`);
  }

  const objectPath = resolveObjectPath(storagePath, oid);
  const dir = path.dirname(objectPath);
  const { mkdir } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });
  await writeFile(objectPath, content);

  return objectPath;
}
