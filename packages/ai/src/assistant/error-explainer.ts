/**
 * Error explanation module.
 *
 * Parses stack traces, explains errors in plain language,
 * and suggests fixes for common error types.
 *
 * @module assistant/error-explainer
 */

/**
 * A parsed stack frame from a stack trace.
 */
export interface StackFrame {
  /** Function or method name. */
  readonly functionName: string;
  /** File path. */
  readonly filePath: string;
  /** Line number. */
  readonly line: number;
  /** Column number. */
  readonly column: number;
  /** Whether this frame is from node_modules. */
  readonly isExternal: boolean;
  /** Whether this frame is from the user's code. */
  readonly isUserCode: boolean;
  /** Raw line from the stack trace. */
  readonly raw: string;
}

/**
 * A parsed error with structured information.
 */
export interface ParsedError {
  /** Error type/class name (e.g., TypeError, SyntaxError). */
  readonly errorType: string;
  /** Error message. */
  readonly message: string;
  /** Parsed stack frames. */
  readonly stackFrames: readonly StackFrame[];
  /** The first user-code stack frame. */
  readonly originFrame?: StackFrame;
  /** Error code, if present (e.g., ERR_MODULE_NOT_FOUND). */
  readonly code?: string;
}

/**
 * A plain-language explanation of an error.
 */
export interface ErrorExplanation {
  /** Short summary of what happened. */
  readonly summary: string;
  /** Detailed explanation in plain language. */
  readonly explanation: string;
  /** Possible causes of the error. */
  readonly possibleCauses: readonly string[];
  /** Suggested fixes. */
  readonly suggestedFixes: readonly string[];
  /** Relevant documentation links. */
  readonly relatedDocs: readonly string[];
  /** Difficulty level of the fix. */
  readonly difficulty: "easy" | "moderate" | "complex";
  /** AI prompt for deeper analysis. */
  readonly aiPrompt: string;
}

/**
 * Common error type explanations.
 */
const ERROR_EXPLANATIONS: Record<string, {
  summary: string;
  causes: readonly string[];
  fixes: readonly string[];
  difficulty: "easy" | "moderate" | "complex";
}> = {
  TypeError: {
    summary: "An operation was performed on a value of the wrong type",
    causes: [
      "Calling a method on null or undefined",
      "Using a value as a function when it is not callable",
      "Accessing a property on an undefined variable",
      "Passing wrong argument types to a function",
    ],
    fixes: [
      "Add null/undefined checks before accessing properties",
      "Verify the variable is the expected type before using it",
      "Check function arguments match expected types",
      "Use optional chaining (?.) for potentially undefined values",
    ],
    difficulty: "easy",
  },
  ReferenceError: {
    summary: "A variable was referenced but not defined in the current scope",
    causes: [
      "Typo in variable or function name",
      "Variable used before declaration (temporal dead zone)",
      "Missing import statement",
      "Variable declared in a different scope",
    ],
    fixes: [
      "Check spelling of variable names",
      "Ensure the variable is declared before use",
      "Add the missing import statement",
      "Move the declaration to the correct scope",
    ],
    difficulty: "easy",
  },
  SyntaxError: {
    summary: "The code has invalid syntax that cannot be parsed",
    causes: [
      "Missing closing bracket, parenthesis, or quote",
      "Invalid use of a reserved keyword",
      "Missing comma or semicolon",
      "Incorrect template literal syntax",
    ],
    fixes: [
      "Check for missing or mismatched brackets and parentheses",
      "Verify the correct syntax for the language feature being used",
      "Use a code formatter to identify the problematic location",
      "Check line numbers in the error for the exact location",
    ],
    difficulty: "easy",
  },
  RangeError: {
    summary: "A value is outside the allowable range",
    causes: [
      "Creating an array with an invalid length",
      "Exceeding the maximum call stack (infinite recursion)",
      "Passing an out-of-range number to a function",
    ],
    fixes: [
      "Check for recursive function calls without a base case",
      "Validate numeric values before passing to APIs",
      "Add a maximum depth guard for recursive operations",
    ],
    difficulty: "moderate",
  },
  Error: {
    summary: "A general error occurred during execution",
    causes: [
      "Custom application error thrown",
      "Network or I/O operation failed",
      "Invalid configuration or missing resource",
    ],
    fixes: [
      "Read the error message for specific details",
      "Check logs for additional context",
      "Verify configuration files and environment variables",
    ],
    difficulty: "moderate",
  },
};

/**
 * Parses a stack trace string into structured frames.
 *
 * @param stackTrace - Raw stack trace text.
 * @returns Array of parsed stack frames.
 */
export function parseStackTrace(stackTrace: string): StackFrame[] {
  const frames: StackFrame[] = [];
  const lines = stackTrace.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    const v8Match = /at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/.exec(trimmed);
    if (v8Match) {
      const filePath = v8Match[2]!;
      frames.push({
        functionName: v8Match[1] ?? "<anonymous>",
        filePath,
        line: parseInt(v8Match[3]!, 10),
        column: parseInt(v8Match[4]!, 10),
        isExternal: filePath.includes("node_modules"),
        isUserCode: !filePath.includes("node_modules") && !filePath.startsWith("node:"),
        raw: trimmed,
      });
    }
  }

  return frames;
}

/**
 * Parses a complete error string into structured data.
 *
 * @param errorString - Full error output including type, message, and stack.
 * @returns Parsed error information.
 */
export function parseError(errorString: string): ParsedError {
  const lines = errorString.split("\n");
  const firstLine = lines[0] ?? "";

  const errorMatch = /^(\w+Error):\s*(.+)$/.exec(firstLine);
  const errorType = errorMatch ? errorMatch[1]! : "Error";
  const message = errorMatch ? errorMatch[2]! : firstLine;

  const codeMatch = /\[([A-Z_]+)\]/.exec(errorString);
  const code = codeMatch ? codeMatch[1] : undefined;

  const stackFrames = parseStackTrace(errorString);
  const originFrame = stackFrames.find((f) => f.isUserCode);

  return {
    errorType,
    message,
    stackFrames,
    originFrame,
    code,
  };
}

/**
 * Generates a plain-language explanation of an error.
 *
 * @param parsed - The parsed error to explain.
 * @returns A human-friendly error explanation.
 */
export function explainError(parsed: ParsedError): ErrorExplanation {
  const known = ERROR_EXPLANATIONS[parsed.errorType] ?? ERROR_EXPLANATIONS["Error"]!;

  const summary = `${known.summary}: ${parsed.message}`;

  const explanationParts: string[] = [
    `A ${parsed.errorType} occurred: "${parsed.message}".`,
    known.summary + ".",
  ];

  if (parsed.originFrame) {
    explanationParts.push(
      `The error originated in ${parsed.originFrame.filePath} at line ${parsed.originFrame.line}, ` +
      `in the function "${parsed.originFrame.functionName}".`
    );
  }

  if (parsed.code) {
    explanationParts.push(`Error code: ${parsed.code}.`);
  }

  const relatedDocs: string[] = [];
  if (parsed.errorType === "TypeError") {
    relatedDocs.push("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError");
  } else if (parsed.errorType === "ReferenceError") {
    relatedDocs.push("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError");
  }

  const contextualFixes = generateContextualFixes(parsed);

  const aiPrompt = [
    `Explain this error in detail and suggest how to fix it:`,
    "",
    `Error: ${parsed.errorType}: ${parsed.message}`,
    parsed.code ? `Code: ${parsed.code}` : "",
    parsed.originFrame
      ? `Location: ${parsed.originFrame.filePath}:${parsed.originFrame.line}`
      : "",
    "",
    "Provide:",
    "1. A clear explanation of what went wrong",
    "2. The most likely cause in this context",
    "3. Step-by-step instructions to fix it",
    "4. How to prevent similar errors in the future",
  ].join("\n");

  return {
    summary,
    explanation: explanationParts.join(" "),
    possibleCauses: known.causes,
    suggestedFixes: [...contextualFixes, ...known.fixes],
    relatedDocs,
    difficulty: known.difficulty,
    aiPrompt,
  };
}

/**
 * Generates context-specific fix suggestions based on the error message.
 *
 * @param parsed - The parsed error.
 * @returns Array of contextual fix suggestions.
 */
function generateContextualFixes(parsed: ParsedError): string[] {
  const fixes: string[] = [];
  const msg = parsed.message.toLowerCase();

  if (msg.includes("cannot read properties of undefined") || msg.includes("cannot read properties of null")) {
    const propMatch = /reading '(\w+)'/.exec(parsed.message);
    if (propMatch) {
      fixes.push(`Add a null check before accessing the '${propMatch[1]}' property`);
      fixes.push(`Use optional chaining: obj?.${propMatch[1]}`);
    }
  }

  if (msg.includes("is not a function")) {
    const fnMatch = /(\w+) is not a function/.exec(parsed.message);
    if (fnMatch) {
      fixes.push(`Verify that '${fnMatch[1]}' is properly imported and is a function`);
    }
  }

  if (msg.includes("module not found") || msg.includes("cannot find module")) {
    fixes.push("Run 'npm install' to install missing dependencies");
    fixes.push("Check the import path for typos");
  }

  return fixes;
}

/**
 * Formats an error explanation as a readable string.
 *
 * @param explanation - The error explanation.
 * @returns Formatted multi-line string.
 */
export function formatExplanation(explanation: ErrorExplanation): string {
  const lines: string[] = [
    `## Error Explanation`,
    "",
    `**Summary:** ${explanation.summary}`,
    "",
    explanation.explanation,
    "",
    "### Possible Causes",
    ...explanation.possibleCauses.map((c) => `- ${c}`),
    "",
    "### Suggested Fixes",
    ...explanation.suggestedFixes.map((f) => `- ${f}`),
  ];

  if (explanation.relatedDocs.length > 0) {
    lines.push("", "### Related Documentation");
    for (const doc of explanation.relatedDocs) {
      lines.push(`- ${doc}`);
    }
  }

  lines.push("", `**Difficulty:** ${explanation.difficulty}`);

  return lines.join("\n");
}
