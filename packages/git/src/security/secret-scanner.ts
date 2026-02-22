/** Result of scanning content for leaked secrets. */
export interface SecretScanResult {
  found: boolean;
  matches: SecretMatch[];
  scannedLines: number;
}

/** A single detected secret match with location information. */
export interface SecretMatch {
  type: string;
  pattern: string;
  line: number;
  column: number;
  value: string;
  file: string | undefined;
}

/** A secret detection rule with regex pattern and metadata. */
interface SecretPattern {
  name: string;
  regex: RegExp;
  description: string;
}

/** Built-in patterns for detecting leaked secrets in source code. */
const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: "AWS Access Key ID",
    regex: /(?<![A-Z0-9])(AKIA[0-9A-Z]{16})(?![A-Z0-9])/g,
    description: "AWS access key identifier starting with AKIA",
  },
  {
    name: "AWS Secret Access Key",
    regex: /(?<![A-Za-z0-9/+=])([A-Za-z0-9/+=]{40})(?![A-Za-z0-9/+=])/g,
    description: "Potential AWS secret access key (40 char base64)",
  },
  {
    name: "RSA Private Key",
    regex: /-----BEGIN RSA PRIVATE KEY-----/g,
    description: "RSA private key PEM header",
  },
  {
    name: "SSH Private Key",
    regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
    description: "OpenSSH private key header",
  },
  {
    name: "Generic Private Key",
    regex: /-----BEGIN (?:EC |DSA )?PRIVATE KEY-----/g,
    description: "Generic private key PEM header",
  },
  {
    name: "GitHub Token",
    regex: /(?<![a-zA-Z0-9_])(ghp_[a-zA-Z0-9]{36})(?![a-zA-Z0-9_])/g,
    description: "GitHub personal access token",
  },
  {
    name: "GitHub OAuth Token",
    regex: /(?<![a-zA-Z0-9_])(gho_[a-zA-Z0-9]{36})(?![a-zA-Z0-9_])/g,
    description: "GitHub OAuth access token",
  },
  {
    name: "Slack Token",
    regex: /(?<![a-zA-Z0-9-])(xox[bpors]-[a-zA-Z0-9-]{10,})(?![a-zA-Z0-9-])/g,
    description: "Slack bot, user, or workspace token",
  },
  {
    name: "Generic API Key",
    regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
    description: "Generic API key in configuration",
  },
  {
    name: "Generic Secret",
    regex: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"]([^'"]{8,})['"]?/gi,
    description: "Generic password or secret string",
  },
  {
    name: "JWT Token",
    regex: /(?<![a-zA-Z0-9._-])(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})(?![a-zA-Z0-9._-])/g,
    description: "JSON Web Token",
  },
  {
    name: "Stripe Key",
    regex: /(?<![a-zA-Z0-9_])(sk_live_[a-zA-Z0-9]{24,})(?![a-zA-Z0-9_])/g,
    description: "Stripe live secret key",
  },
];

/**
 * Scan a string of content for leaked secrets using built-in patterns.
 * Returns all matches found with line and column information.
 */
export function scanContent(
  content: string,
  fileName?: string
): SecretScanResult {
  const lines = content.split("\n");
  const matches: SecretMatch[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(line)) !== null) {
        const matchedValue = match[1] || match[0];
        matches.push({
          type: pattern.name,
          pattern: pattern.description,
          line: lineIdx + 1,
          column: match.index + 1,
          value: maskSecret(matchedValue),
          file: fileName,
        });
      }
    }
  }

  return {
    found: matches.length > 0,
    matches,
    scannedLines: lines.length,
  };
}

/**
 * Scan a unified diff output for leaked secrets in added lines.
 * Only checks lines that begin with '+' to avoid false positives.
 */
export function scanDiff(diffContent: string): SecretScanResult {
  const lines = diffContent.split("\n");
  const addedLines: string[] = [];
  let currentFile: string | undefined;
  const allMatches: SecretMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("+++ b/")) {
      currentFile = line.substring(6);
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      addedLines.push(line.substring(1));
      const result = scanContent(line.substring(1), currentFile);
      for (const match of result.matches) {
        match.line = i + 1;
        allMatches.push(match);
      }
    }
  }

  return {
    found: allMatches.length > 0,
    matches: allMatches,
    scannedLines: addedLines.length,
  };
}

/**
 * Mask a secret value for safe logging and reporting.
 * Shows only the first and last 4 characters with asterisks between.
 */
function maskSecret(value: string): string {
  if (value.length <= 8) return "****";
  const prefix = value.substring(0, 4);
  const suffix = value.substring(value.length - 4);
  return `${prefix}${"*".repeat(Math.min(value.length - 8, 20))}${suffix}`;
}

/**
 * Add a custom secret detection pattern to the scanner.
 * Returns the total number of patterns after adding.
 */
export function addCustomPattern(
  name: string,
  regex: RegExp,
  description: string
): number {
  SECRET_PATTERNS.push({ name, regex, description });
  return SECRET_PATTERNS.length;
}

/**
 * Get the list of all registered secret detection pattern names.
 * Useful for auditing which types of secrets are being scanned.
 */
export function listPatternNames(): string[] {
  return SECRET_PATTERNS.map((p) => p.name);
}
