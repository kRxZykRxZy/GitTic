import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** GPG signature verification status codes. */
export type SignatureStatus =
  | "good"
  | "bad"
  | "untrusted"
  | "expired"
  | "expired_key"
  | "revoked"
  | "error"
  | "none";

/** Detailed information about a commit's GPG signature. */
export interface SignatureInfo {
  status: SignatureStatus;
  signed: boolean;
  signer: string | undefined;
  signerEmail: string | undefined;
  keyId: string | undefined;
  keyFingerprint: string | undefined;
  trustLevel: string | undefined;
  signatureDate: Date | undefined;
  rawOutput: string;
}

/**
 * Verify the GPG signature on a specific commit.
 * Returns structured information about the signature status.
 */
export async function verifySignature(
  repoPath: string,
  sha: string
): Promise<SignatureInfo> {
  try {
    const { stdout, stderr } = await execFileAsync("git", [
      "-C", repoPath, "verify-commit", "--raw", sha,
    ]).catch((error) => ({
      stdout: (error as { stdout?: string }).stdout ?? "",
      stderr: (error as { stderr?: string }).stderr ?? "",
    }));

    const combined = `${stdout}\n${stderr}`;
    return parseGpgOutput(combined);
  } catch {
    return createNoSignatureInfo();
  }
}

/**
 * Check whether a commit is signed, regardless of validity.
 * Returns true if any signature is present on the commit.
 */
export async function isSignedCommit(
  repoPath: string,
  sha: string
): Promise<boolean> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", "-1", "--format=%G?", sha,
  ]);

  const indicator = stdout.trim();
  return indicator !== "N" && indicator !== "";
}

/**
 * Get signature information for a commit using log format codes.
 * Lighter weight than full verification when only metadata is needed.
 */
export async function getSignatureInfo(
  repoPath: string,
  sha: string
): Promise<SignatureInfo> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", "-1",
    "--format=%G?%x00%GS%x00%GK%x00%GF%x00%GT%x00%GG", sha,
  ]);

  const parts = stdout.split("\0");
  const statusCode = parts[0]?.trim() ?? "N";
  const signer = parts[1]?.trim() || undefined;
  const keyId = parts[2]?.trim() || undefined;
  const keyFingerprint = parts[3]?.trim() || undefined;
  const trustLevel = parts[4]?.trim() || undefined;
  const rawOutput = parts[5]?.trim() ?? "";

  return {
    status: mapStatusCode(statusCode),
    signed: statusCode !== "N" && statusCode !== "",
    signer,
    signerEmail: extractEmailFromSigner(signer),
    keyId,
    keyFingerprint,
    trustLevel,
    signatureDate: extractDateFromGpgOutput(rawOutput),
    rawOutput,
  };
}

/**
 * Verify signatures on multiple commits and return results.
 * Useful for bulk verification of commit ranges.
 */
export async function verifyCommitRange(
  repoPath: string,
  from: string,
  to: string
): Promise<Array<{ sha: string; info: SignatureInfo }>> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "rev-list", `${from}..${to}`,
  ]);

  const shas = stdout.trim().split("\n").filter(Boolean);
  const results: Array<{ sha: string; info: SignatureInfo }> = [];

  for (const sha of shas) {
    const info = await getSignatureInfo(repoPath, sha);
    results.push({ sha, info });
  }

  return results;
}

/**
 * Parse raw GPG verification output into a SignatureInfo object.
 * Handles various GPG status message formats.
 */
function parseGpgOutput(output: string): SignatureInfo {
  const info: SignatureInfo = createNoSignatureInfo();
  info.rawOutput = output;

  if (output.includes("GOODSIG")) {
    info.status = "good";
    info.signed = true;
  } else if (output.includes("BADSIG")) {
    info.status = "bad";
    info.signed = true;
  } else if (output.includes("ERRSIG")) {
    info.status = "error";
    info.signed = true;
  } else if (output.includes("EXPSIG")) {
    info.status = "expired";
    info.signed = true;
  } else if (output.includes("EXPKEYSIG")) {
    info.status = "expired_key";
    info.signed = true;
  } else if (output.includes("REVKEYSIG")) {
    info.status = "revoked";
    info.signed = true;
  }

  const signerMatch = /(?:GOODSIG|BADSIG|ERRSIG|EXPSIG|EXPKEYSIG|REVKEYSIG)\s+([A-F0-9]+)\s+(.+)/
    .exec(output);
  if (signerMatch) {
    info.keyId = signerMatch[1];
    info.signer = signerMatch[2];
    info.signerEmail = extractEmailFromSigner(signerMatch[2]);
  }

  const fingerprintMatch = /VALIDSIG\s+([A-F0-9]{40})/.exec(output);
  if (fingerprintMatch) {
    info.keyFingerprint = fingerprintMatch[1];
  }

  const trustMatch = /TRUST_(\w+)/.exec(output);
  if (trustMatch) {
    info.trustLevel = trustMatch[1].toLowerCase();
    if (info.status === "good" && info.trustLevel === "undefined") {
      info.status = "untrusted";
    }
  }

  return info;
}

/**
 * Map a single-character Git signature status code to a named status.
 * Covers all documented %G? format codes.
 */
function mapStatusCode(code: string): SignatureStatus {
  const statusMap: Record<string, SignatureStatus> = {
    G: "good",
    B: "bad",
    U: "untrusted",
    X: "expired",
    Y: "expired_key",
    R: "revoked",
    E: "error",
    N: "none",
  };
  return statusMap[code] ?? "none";
}

/** Create a default SignatureInfo for unsigned commits. */
function createNoSignatureInfo(): SignatureInfo {
  return {
    status: "none",
    signed: false,
    signer: undefined,
    signerEmail: undefined,
    keyId: undefined,
    keyFingerprint: undefined,
    trustLevel: undefined,
    signatureDate: undefined,
    rawOutput: "",
  };
}

/** Extract an email address from a GPG signer string. */
function extractEmailFromSigner(signer: string | undefined): string | undefined {
  if (!signer) return undefined;
  const match = /<([^>]+)>/.exec(signer);
  return match ? match[1] : undefined;
}

/** Extract a date from raw GPG output SIG_ID line. */
function extractDateFromGpgOutput(output: string): Date | undefined {
  const dateMatch = /SIG_ID\s+\S+\s+(\d{4}-\d{2}-\d{2})/.exec(output);
  if (dateMatch) return new Date(dateMatch[1]);

  const tsMatch = /SIG_ID\s+\S+\s+(\d{10,})/.exec(output);
  if (tsMatch) return new Date(parseInt(tsMatch[1], 10) * 1000);

  return undefined;
}
