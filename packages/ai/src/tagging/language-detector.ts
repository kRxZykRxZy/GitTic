/**
 * Language detection module.
 *
 * Detects programming languages from file content using
 * shebang lines, syntax patterns, and keyword frequency.
 * Supports polyglot scoring for multi-language files.
 *
 * @module tagging/language-detector
 */

/**
 * A detected language with confidence score.
 */
export interface DetectedLanguage {
  /** Language identifier. */
  readonly language: string;
  /** Confidence score (0-1). */
  readonly confidence: number;
  /** Detection method used. */
  readonly detectionMethod: DetectionMethod;
}

/**
 * Method used for language detection.
 */
export type DetectionMethod =
  | "extension"
  | "shebang"
  | "syntax"
  | "keywords"
  | "heuristic";

/**
 * Polyglot analysis result for a file or codebase.
 */
export interface PolyglotResult {
  /** Primary language. */
  readonly primaryLanguage: DetectedLanguage;
  /** All detected languages with scores. */
  readonly languages: readonly DetectedLanguage[];
  /** Polyglot score (0-1, higher = more languages). */
  readonly polyglotScore: number;
  /** Number of distinct languages detected. */
  readonly languageCount: number;
}

/**
 * Language profile with detection patterns.
 */
interface LanguageProfile {
  /** Language name. */
  readonly name: string;
  /** File extensions. */
  readonly extensions: readonly string[];
  /** Shebang patterns. */
  readonly shebangs: readonly string[];
  /** Syntax patterns (unique to this language). */
  readonly syntaxPatterns: readonly RegExp[];
  /** Keywords unique or characteristic to the language. */
  readonly keywords: readonly string[];
  /** Weight for keyword matching. */
  readonly keywordWeight: number;
}

/**
 * Language profiles for detection.
 */
const LANGUAGE_PROFILES: readonly LanguageProfile[] = [
  {
    name: "TypeScript",
    extensions: [".ts", ".tsx", ".mts", ".cts"],
    shebangs: ["ts-node", "tsx"],
    syntaxPatterns: [
      /:\s*(?:string|number|boolean|void|never|unknown|any)\b/,
      /interface\s+\w+\s*\{/,
      /type\s+\w+\s*=/,
      /as\s+(?:const|string|number|unknown)/,
      /import\s+type\s/,
    ],
    keywords: ["interface", "type", "readonly", "declare", "namespace", "enum", "keyof", "typeof"],
    keywordWeight: 1.5,
  },
  {
    name: "JavaScript",
    extensions: [".js", ".jsx", ".mjs", ".cjs"],
    shebangs: ["node", "deno", "bun"],
    syntaxPatterns: [
      /require\s*\(/,
      /module\.exports/,
      /=>\s*\{/,
      /const\s+\w+\s*=\s*(?:require|import)/,
    ],
    keywords: ["const", "let", "var", "function", "class", "async", "await", "import", "export"],
    keywordWeight: 1.0,
  },
  {
    name: "Python",
    extensions: [".py", ".pyw", ".pyi"],
    shebangs: ["python", "python3"],
    syntaxPatterns: [
      /def\s+\w+\s*\(/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /if\s+__name__\s*==\s*['"]__main__['"]/,
      /class\s+\w+(?:\([\w.]+\))?:/,
    ],
    keywords: ["def", "class", "import", "from", "elif", "except", "finally", "lambda", "yield", "self", "None", "True", "False"],
    keywordWeight: 1.2,
  },
  {
    name: "Go",
    extensions: [".go"],
    shebangs: [],
    syntaxPatterns: [
      /^package\s+\w+/m,
      /func\s+(?:\(\w+\s+\*?\w+\)\s+)?\w+\s*\(/,
      /import\s+\(/,
      /:=\s/,
      /go\s+func\s*\(/,
    ],
    keywords: ["package", "func", "defer", "goroutine", "chan", "select", "go", "make", "range", "struct"],
    keywordWeight: 1.5,
  },
  {
    name: "Rust",
    extensions: [".rs"],
    shebangs: [],
    syntaxPatterns: [
      /fn\s+\w+\s*\(/,
      /let\s+mut\s/,
      /impl\s+\w+/,
      /pub\s+(?:fn|struct|enum|mod)/,
      /use\s+(?:std|crate)::/,
    ],
    keywords: ["fn", "let", "mut", "impl", "pub", "mod", "use", "crate", "match", "enum", "struct", "trait", "unsafe", "lifetime"],
    keywordWeight: 1.5,
  },
  {
    name: "Ruby",
    extensions: [".rb", ".rake"],
    shebangs: ["ruby"],
    syntaxPatterns: [
      /def\s+\w+/,
      /end\s*$/m,
      /puts\s/,
      /require\s+['"][\w/]+['"]/,
      /class\s+\w+\s*<\s*\w+/,
    ],
    keywords: ["def", "end", "puts", "require", "attr_accessor", "module", "include", "extend", "nil", "unless"],
    keywordWeight: 1.2,
  },
  {
    name: "Java",
    extensions: [".java"],
    shebangs: [],
    syntaxPatterns: [
      /public\s+(?:static\s+)?(?:void|class|interface)\s/,
      /System\.out\.println/,
      /import\s+java\./,
      /@Override/,
    ],
    keywords: ["public", "private", "protected", "static", "final", "abstract", "implements", "extends", "throws", "synchronized"],
    keywordWeight: 1.3,
  },
  {
    name: "HTML",
    extensions: [".html", ".htm"],
    shebangs: [],
    syntaxPatterns: [/<!DOCTYPE\s+html/i, /<html\b/i, /<head\b/i, /<body\b/i],
    keywords: ["<!DOCTYPE", "<html", "<head", "<body", "<div", "<script"],
    keywordWeight: 1.0,
  },
  {
    name: "CSS",
    extensions: [".css"],
    shebangs: [],
    syntaxPatterns: [/\{[^}]*:\s*[^;]+;/,  /\.\w+\s*\{/, /#\w+\s*\{/],
    keywords: ["display", "position", "margin", "padding", "color", "background", "font-size", "@media"],
    keywordWeight: 0.8,
  },
] as const;

/**
 * Detects language from a file extension.
 *
 * @param filePath - Path of the file.
 * @returns Detected language or null.
 */
export function detectByExtension(filePath: string): DetectedLanguage | null {
  const ext = "." + (filePath.split(".").pop()?.toLowerCase() ?? "");

  for (const profile of LANGUAGE_PROFILES) {
    if (profile.extensions.includes(ext)) {
      return {
        language: profile.name,
        confidence: 0.9,
        detectionMethod: "extension",
      };
    }
  }

  return null;
}

/**
 * Detects language from a shebang line.
 *
 * @param content - File content (first line examined).
 * @returns Detected language or null.
 */
export function detectByShebang(content: string): DetectedLanguage | null {
  const firstLine = content.split("\n")[0] ?? "";
  if (!firstLine.startsWith("#!")) return null;

  const shebang = firstLine.toLowerCase();

  for (const profile of LANGUAGE_PROFILES) {
    for (const sb of profile.shebangs) {
      if (shebang.includes(sb)) {
        return {
          language: profile.name,
          confidence: 0.95,
          detectionMethod: "shebang",
        };
      }
    }
  }

  return null;
}

/**
 * Detects language by analyzing syntax patterns in content.
 *
 * @param content - File content to analyze.
 * @returns Array of detected languages with confidence scores.
 */
export function detectBySyntax(content: string): DetectedLanguage[] {
  const results: DetectedLanguage[] = [];

  for (const profile of LANGUAGE_PROFILES) {
    let matchCount = 0;
    const totalPatterns = profile.syntaxPatterns.length;

    for (const pattern of profile.syntaxPatterns) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(0.9, (matchCount / totalPatterns) * 0.9);
      results.push({
        language: profile.name,
        confidence,
        detectionMethod: "syntax",
      });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/**
 * Detects language by keyword frequency analysis.
 *
 * @param content - File content to analyze.
 * @returns Array of detected languages with confidence scores.
 */
export function detectByKeywords(content: string): DetectedLanguage[] {
  const results: DetectedLanguage[] = [];
  const words = content.split(/\s+/);
  const totalWords = words.length;

  if (totalWords === 0) return results;

  for (const profile of LANGUAGE_PROFILES) {
    let keywordHits = 0;

    for (const keyword of profile.keywords) {
      const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "g");
      const matches = content.match(regex);
      if (matches) {
        keywordHits += matches.length;
      }
    }

    if (keywordHits > 0) {
      const density = keywordHits / totalWords;
      const confidence = Math.min(
        0.85,
        density * profile.keywordWeight * 50
      );
      results.push({
        language: profile.name,
        confidence,
        detectionMethod: "keywords",
      });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/**
 * Performs comprehensive language detection on file content.
 *
 * Combines extension, shebang, syntax, and keyword analysis
 * for the most accurate detection.
 *
 * @param content - File content.
 * @param filePath - Optional file path for extension-based detection.
 * @returns Polyglot analysis result.
 */
export function detectLanguage(
  content: string,
  filePath?: string
): PolyglotResult {
  const detections = new Map<string, { confidence: number; method: DetectionMethod }>();

  if (filePath) {
    const extResult = detectByExtension(filePath);
    if (extResult) {
      detections.set(extResult.language, {
        confidence: extResult.confidence,
        method: extResult.detectionMethod,
      });
    }
  }

  const shebangResult = detectByShebang(content);
  if (shebangResult) {
    const existing = detections.get(shebangResult.language);
    if (!existing || existing.confidence < shebangResult.confidence) {
      detections.set(shebangResult.language, {
        confidence: shebangResult.confidence,
        method: shebangResult.detectionMethod,
      });
    }
  }

  const syntaxResults = detectBySyntax(content);
  for (const result of syntaxResults) {
    const existing = detections.get(result.language);
    if (!existing) {
      detections.set(result.language, {
        confidence: result.confidence,
        method: result.detectionMethod,
      });
    } else {
      detections.set(result.language, {
        confidence: Math.min(0.99, existing.confidence + result.confidence * 0.3),
        method: existing.method,
      });
    }
  }

  const languages: DetectedLanguage[] = [];
  for (const [lang, data] of detections) {
    languages.push({
      language: lang,
      confidence: data.confidence,
      detectionMethod: data.method,
    });
  }

  languages.sort((a, b) => b.confidence - a.confidence);

  const primaryLanguage = languages[0] ?? {
    language: "Unknown",
    confidence: 0,
    detectionMethod: "heuristic" as DetectionMethod,
  };

  const significantLangs = languages.filter((l) => l.confidence > 0.2);
  const polyglotScore = Math.min(
    1,
    (significantLangs.length - 1) / 4
  );

  return {
    primaryLanguage,
    languages,
    polyglotScore: Math.max(0, polyglotScore),
    languageCount: significantLangs.length,
  };
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
