/**
 * Security scanning module.
 *
 * Detects common security vulnerabilities in code including
 * SQL injection, XSS, hardcoded secrets, insecure crypto,
 * and other security anti-patterns.
 *
 * @module analysis/security-scan
 */

/**
 * Severity of a security finding.
 */
export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";

/**
 * Category of a security finding.
 */
export type SecurityCategory =
  | "sql-injection"
  | "xss"
  | "hardcoded-secret"
  | "insecure-crypto"
  | "path-traversal"
  | "command-injection"
  | "insecure-random"
  | "information-disclosure"
  | "insecure-deserialization"
  | "missing-auth";

/**
 * A single security finding.
 */
export interface SecurityFinding {
  /** Category of the vulnerability. */
  readonly category: SecurityCategory;
  /** Severity level. */
  readonly severity: SecuritySeverity;
  /** File path where the issue was found. */
  readonly filePath: string;
  /** Line number of the finding. */
  readonly line: number;
  /** Description of the vulnerability. */
  readonly description: string;
  /** Recommended remediation. */
  readonly remediation: string;
  /** Code snippet exhibiting the issue. */
  readonly snippet: string;
  /** CWE identifier if applicable. */
  readonly cweId?: string;
  /** Confidence in the finding (0-1). */
  readonly confidence: number;
}

/**
 * Result of a security scan.
 */
export interface SecurityScanResult {
  /** All security findings. */
  readonly findings: readonly SecurityFinding[];
  /** Count by severity. */
  readonly countsBySeverity: Record<SecuritySeverity, number>;
  /** Count by category. */
  readonly countsByCategory: Partial<Record<SecurityCategory, number>>;
  /** Overall security score (0-100, higher is better). */
  readonly securityScore: number;
  /** Summary of the scan. */
  readonly summary: string;
  /** Files scanned count. */
  readonly filesScanned: number;
  /** AI prompt for deeper analysis. */
  readonly analysisPrompt: string;
}

/**
 * Pattern definition for security detection.
 */
interface SecurityPattern {
  /** Regex to detect the issue. */
  readonly pattern: RegExp;
  /** Category of the vulnerability. */
  readonly category: SecurityCategory;
  /** Severity level. */
  readonly severity: SecuritySeverity;
  /** Description template. */
  readonly description: string;
  /** Remediation advice. */
  readonly remediation: string;
  /** CWE identifier. */
  readonly cweId: string;
  /** Detection confidence. */
  readonly confidence: number;
}

/**
 * Known security vulnerability patterns.
 */
const SECURITY_PATTERNS: readonly SecurityPattern[] = [
  {
    pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b/i,
    category: "sql-injection",
    severity: "critical",
    description: "Potential SQL injection via string interpolation in query",
    remediation: "Use parameterized queries or prepared statements instead of string interpolation",
    cweId: "CWE-89",
    confidence: 0.8,
  },
  {
    pattern: /(?:query|execute)\s*\(\s*`[^`]*\$\{/,
    category: "sql-injection",
    severity: "critical",
    description: "Template literal used in database query — possible SQL injection",
    remediation: "Use parameterized queries with placeholder values",
    cweId: "CWE-89",
    confidence: 0.85,
  },
  {
    pattern: /innerHTML\s*=\s*(?!['"]<)/,
    category: "xss",
    severity: "high",
    description: "Direct innerHTML assignment may enable cross-site scripting (XSS)",
    remediation: "Use textContent, or sanitize input before setting innerHTML",
    cweId: "CWE-79",
    confidence: 0.8,
  },
  {
    pattern: /document\.write\s*\(/,
    category: "xss",
    severity: "high",
    description: "document.write() can introduce XSS vulnerabilities",
    remediation: "Use DOM manipulation methods instead of document.write()",
    cweId: "CWE-79",
    confidence: 0.75,
  },
  {
    pattern: /(?:password|secret|api_key|apikey|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    category: "hardcoded-secret",
    severity: "critical",
    description: "Possible hardcoded secret or credential in source code",
    remediation: "Use environment variables or a secrets manager instead of hardcoding credentials",
    cweId: "CWE-798",
    confidence: 0.7,
  },
  {
    pattern: /(?:AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
    category: "hardcoded-secret",
    severity: "critical",
    description: "Possible AWS access key ID detected in source code",
    remediation: "Remove the key immediately, rotate credentials, and use environment variables",
    cweId: "CWE-798",
    confidence: 0.95,
  },
  {
    pattern: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/,
    category: "insecure-crypto",
    severity: "medium",
    description: "Weak hash algorithm (MD5 or SHA1) used for cryptographic purposes",
    remediation: "Use SHA-256 or stronger hash algorithms for security-sensitive operations",
    cweId: "CWE-328",
    confidence: 0.8,
  },
  {
    pattern: /Math\.random\s*\(\)/,
    category: "insecure-random",
    severity: "medium",
    description: "Math.random() is not cryptographically secure",
    remediation: "Use crypto.randomBytes() or crypto.getRandomValues() for security-sensitive randomness",
    cweId: "CWE-338",
    confidence: 0.6,
  },
  {
    pattern: /exec\s*\(\s*(?:`[^`]*\$\{|[^'"][^)]*\+)/,
    category: "command-injection",
    severity: "critical",
    description: "Potential command injection via string concatenation or interpolation in exec()",
    remediation: "Use execFile() with argument arrays or sanitize all inputs",
    cweId: "CWE-78",
    confidence: 0.75,
  },
  {
    pattern: /\.\.\/|\.\.\\|path\.join\s*\([^)]*(?:req\.|params\.|query\.)/,
    category: "path-traversal",
    severity: "high",
    description: "Potential path traversal vulnerability with user-controlled input",
    remediation: "Validate and sanitize file paths, use path.resolve() and check against a base directory",
    cweId: "CWE-22",
    confidence: 0.6,
  },
  {
    pattern: /eval\s*\(/,
    category: "command-injection",
    severity: "high",
    description: "Use of eval() can execute arbitrary code",
    remediation: "Avoid eval() entirely; use safer alternatives like JSON.parse() for data",
    cweId: "CWE-95",
    confidence: 0.85,
  },
  {
    pattern: /new\s+Function\s*\(/,
    category: "command-injection",
    severity: "high",
    description: "new Function() constructor can execute arbitrary code like eval()",
    remediation: "Avoid dynamic code generation; use static function definitions",
    cweId: "CWE-95",
    confidence: 0.8,
  },
  {
    pattern: /console\.log\s*\([^)]*(?:password|secret|token|key|credential)/i,
    category: "information-disclosure",
    severity: "medium",
    description: "Sensitive data may be logged to console output",
    remediation: "Remove or redact sensitive information from log statements",
    cweId: "CWE-532",
    confidence: 0.65,
  },
] as const;

/**
 * Scans a single line of code for security issues.
 *
 * @param line - Source code line.
 * @param lineNum - Line number in the file.
 * @param filePath - Path of the file being scanned.
 * @returns Array of security findings for this line.
 */
export function scanLine(
  line: string,
  lineNum: number,
  filePath: string
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.pattern.test(line)) {
      findings.push({
        category: pattern.category,
        severity: pattern.severity,
        filePath,
        line: lineNum,
        description: pattern.description,
        remediation: pattern.remediation,
        snippet: line.trim().slice(0, 120),
        cweId: pattern.cweId,
        confidence: pattern.confidence,
      });
    }
  }

  return findings;
}

/**
 * Scans a complete source file for security vulnerabilities.
 *
 * @param content - File content to scan.
 * @param filePath - Path of the file.
 * @returns Array of security findings.
 */
export function scanFile(
  content: string,
  filePath: string
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) {
      continue;
    }
    findings.push(...scanLine(line, i + 1, filePath));
  }

  return findings;
}

/**
 * Calculates a security score based on findings.
 *
 * @param findings - All security findings.
 * @returns Score from 0 (very insecure) to 100 (no issues).
 */
export function calculateSecurityScore(
  findings: readonly SecurityFinding[]
): number {
  let deductions = 0;

  for (const finding of findings) {
    switch (finding.severity) {
      case "critical":
        deductions += 25;
        break;
      case "high":
        deductions += 15;
        break;
      case "medium":
        deductions += 8;
        break;
      case "low":
        deductions += 3;
        break;
      case "info":
        deductions += 1;
        break;
    }
  }

  return Math.max(0, 100 - deductions);
}

/**
 * Counts findings by severity.
 *
 * @param findings - Security findings to count.
 * @returns Record of severity to count.
 */
export function countBySeverity(
  findings: readonly SecurityFinding[]
): Record<SecuritySeverity, number> {
  const counts: Record<SecuritySeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of findings) {
    counts[finding.severity]++;
  }

  return counts;
}

/**
 * Scans multiple files and produces a comprehensive security report.
 *
 * @param files - Map of file path to content.
 * @returns Complete security scan result.
 */
export function scanForVulnerabilities(
  files: ReadonlyMap<string, string>
): SecurityScanResult {
  const allFindings: SecurityFinding[] = [];

  for (const [filePath, content] of files) {
    allFindings.push(...scanFile(content, filePath));
  }

  allFindings.sort((a, b) => {
    const severityOrder: Record<SecuritySeverity, number> = {
      critical: 0, high: 1, medium: 2, low: 3, info: 4,
    };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const countsByCategory: Partial<Record<SecurityCategory, number>> = {};
  for (const finding of allFindings) {
    countsByCategory[finding.category] =
      (countsByCategory[finding.category] ?? 0) + 1;
  }

  const securityScore = calculateSecurityScore(allFindings);
  const severityCounts = countBySeverity(allFindings);

  const summary =
    allFindings.length === 0
      ? "No security vulnerabilities detected."
      : `Found ${allFindings.length} security issue(s): ` +
        `${severityCounts.critical} critical, ${severityCounts.high} high, ` +
        `${severityCounts.medium} medium. Security score: ${securityScore}/100.`;

  const analysisPrompt = [
    "Perform a thorough security review of the codebase.",
    "",
    `Static analysis found ${allFindings.length} issues (score: ${securityScore}/100).`,
    "",
    "Look for vulnerabilities not caught by pattern matching:",
    "- Business logic flaws",
    "- Authentication/authorization bypass",
    "- Race conditions",
    "- Insecure data handling",
    "- Missing input validation",
  ].join("\n");

  return {
    findings: allFindings,
    countsBySeverity: severityCounts,
    countsByCategory,
    securityScore,
    summary,
    filesScanned: files.size,
    analysisPrompt,
  };
}
