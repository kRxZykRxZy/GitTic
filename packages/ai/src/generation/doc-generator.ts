/**
 * Documentation generator module.
 *
 * Generates JSDoc comments, README sections, and API documentation
 * from TypeScript/JavaScript source code.
 *
 * @module generation/doc-generator
 */

/**
 * A parsed function signature for documentation generation.
 */
export interface FunctionSignature {
  /** Function name. */
  readonly name: string;
  /** Parameters with name and type. */
  readonly params: readonly ParamInfo[];
  /** Return type string. */
  readonly returnType: string;
  /** Whether the function is async. */
  readonly isAsync: boolean;
  /** Whether it's exported. */
  readonly isExported: boolean;
  /** Line number in the source file. */
  readonly line: number;
  /** Whether it already has JSDoc. */
  readonly hasJsDoc: boolean;
}

/**
 * Parameter information for a function.
 */
export interface ParamInfo {
  /** Parameter name. */
  readonly name: string;
  /** TypeScript type annotation, if present. */
  readonly type: string;
  /** Whether the parameter is optional. */
  readonly isOptional: boolean;
  /** Default value, if specified. */
  readonly defaultValue?: string;
}

/**
 * A parsed interface for documentation.
 */
export interface InterfaceInfo {
  /** Interface name. */
  readonly name: string;
  /** Interface properties. */
  readonly properties: readonly PropertyInfo[];
  /** Whether it's exported. */
  readonly isExported: boolean;
  /** Line number in the source file. */
  readonly line: number;
  /** Whether it already has JSDoc. */
  readonly hasJsDoc: boolean;
}

/**
 * Property information for an interface.
 */
export interface PropertyInfo {
  /** Property name. */
  readonly name: string;
  /** Property type. */
  readonly type: string;
  /** Whether the property is optional. */
  readonly isOptional: boolean;
  /** Whether it's readonly. */
  readonly isReadonly: boolean;
}

/**
 * Generated documentation output.
 */
export interface GeneratedDoc {
  /** The generated JSDoc comment string. */
  readonly jsDoc: string;
  /** Target identifier name. */
  readonly targetName: string;
  /** Line number where the doc should be inserted. */
  readonly insertBeforeLine: number;
  /** Confidence level (0-1). */
  readonly confidence: number;
}

/**
 * Options for documentation generation.
 */
export interface DocGenerationOptions {
  /** Whether to generate for unexported members. */
  readonly includePrivate: boolean;
  /** Whether to add @example tags. */
  readonly includeExamples: boolean;
  /** Whether to skip already-documented members. */
  readonly skipDocumented: boolean;
  /** Maximum description length. */
  readonly maxDescriptionLength: number;
}

/**
 * Default documentation generation options.
 */
export const DEFAULT_DOC_OPTIONS: DocGenerationOptions = {
  includePrivate: false,
  includeExamples: false,
  skipDocumented: true,
  maxDescriptionLength: 200,
} as const;

/**
 * Extracts function signatures from source code.
 *
 * @param content - Source file content.
 * @returns Array of parsed function signatures.
 */
export function extractFunctions(content: string): FunctionSignature[] {
  const functions: FunctionSignature[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const funcMatch = /^(export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?/.exec(line);
    if (funcMatch) {
      const hasJsDoc = i > 0 && /\*\/\s*$/.test(lines[i - 1]?.trim() ?? "");
      functions.push({
        name: funcMatch[2]!,
        params: parseParams(funcMatch[3] ?? ""),
        returnType: funcMatch[4] ?? "void",
        isAsync: /async\s+function/.test(line),
        isExported: !!funcMatch[1],
        line: i + 1,
        hasJsDoc,
      });
      continue;
    }

    const arrowMatch = /^(export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^\s=]+))?\s*=>/.exec(line);
    if (arrowMatch) {
      const hasJsDoc = i > 0 && /\*\/\s*$/.test(lines[i - 1]?.trim() ?? "");
      functions.push({
        name: arrowMatch[2]!,
        params: parseParams(arrowMatch[3] ?? ""),
        returnType: arrowMatch[4] ?? "void",
        isAsync: /async\s/.test(line),
        isExported: !!arrowMatch[1],
        line: i + 1,
        hasJsDoc,
      });
    }
  }

  return functions;
}

/**
 * Parses a parameter list string into structured param info.
 *
 * @param paramString - Raw parameter string from a function signature.
 * @returns Array of parsed parameter information.
 */
export function parseParams(paramString: string): ParamInfo[] {
  if (!paramString.trim()) return [];

  const params: ParamInfo[] = [];
  const parts = splitParams(paramString);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const defaultMatch = /^(.+?)\s*=\s*(.+)$/.exec(trimmed);
    const paramBody = defaultMatch ? defaultMatch[1]!.trim() : trimmed;
    const defaultValue = defaultMatch ? defaultMatch[2]!.trim() : undefined;

    const isOptional = paramBody.includes("?") || defaultValue !== undefined;
    const typeMatch = /^(\w+)\??\s*:\s*(.+)$/.exec(paramBody);

    params.push({
      name: typeMatch ? typeMatch[1]! : paramBody.replace("?", ""),
      type: typeMatch ? typeMatch[2]! : "unknown",
      isOptional,
      defaultValue,
    });
  }

  return params;
}

/**
 * Splits a parameter string respecting nested generics.
 *
 * @param paramString - Raw parameter string.
 * @returns Array of individual parameter strings.
 */
function splitParams(paramString: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of paramString) {
    if (char === "<" || char === "(" || char === "{") {
      depth++;
      current += char;
    } else if (char === ">" || char === ")" || char === "}") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current);
  }

  return result;
}

/**
 * Extracts interface definitions from source code.
 *
 * @param content - Source file content.
 * @returns Array of parsed interface information.
 */
export function extractInterfaces(content: string): InterfaceInfo[] {
  const interfaces: InterfaceInfo[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const ifaceMatch = /^(export\s+)?interface\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/.exec(line);

    if (ifaceMatch) {
      const hasJsDoc = i > 0 && /\*\/\s*$/.test(lines[i - 1]?.trim() ?? "");
      const properties: PropertyInfo[] = [];
      let j = i + 1;

      while (j < lines.length && !lines[j]!.trim().startsWith("}")) {
        const propLine = lines[j]!.trim();
        const propMatch = /^(readonly\s+)?(\w+)(\?)?:\s*(.+);/.exec(propLine);
        if (propMatch) {
          properties.push({
            name: propMatch[2]!,
            type: propMatch[4]!,
            isOptional: !!propMatch[3],
            isReadonly: !!propMatch[1],
          });
        }
        j++;
      }

      interfaces.push({
        name: ifaceMatch[2]!,
        properties,
        isExported: !!ifaceMatch[1],
        line: i + 1,
        hasJsDoc,
      });
    }
  }

  return interfaces;
}

/**
 * Generates a JSDoc comment for a function signature.
 *
 * @param func - The function signature to document.
 * @returns Generated JSDoc string.
 */
export function generateFunctionJsDoc(func: FunctionSignature): string {
  const lines: string[] = ["/**"];

  const description = generateFunctionDescription(func);
  lines.push(` * ${description}`);

  if (func.params.length > 0) {
    lines.push(" *");
    for (const param of func.params) {
      const optTag = param.isOptional ? " (optional)" : "";
      lines.push(
        ` * @param ${param.name} - ${describeParam(param)}${optTag}`
      );
    }
  }

  if (func.returnType !== "void") {
    lines.push(` * @returns ${describeReturnType(func.returnType)}`);
  }

  lines.push(" */");
  return lines.join("\n");
}

/**
 * Generates a JSDoc comment for an interface.
 *
 * @param iface - The interface to document.
 * @returns Generated JSDoc string.
 */
export function generateInterfaceJsDoc(iface: InterfaceInfo): string {
  const lines: string[] = ["/**"];
  lines.push(` * ${generateInterfaceDescription(iface)}`);
  lines.push(" */");
  return lines.join("\n");
}

/**
 * Generates a human-readable description for a function.
 */
function generateFunctionDescription(func: FunctionSignature): string {
  const words = func.name
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim()
    .split(/\s+/);

  const verb = words[0] ?? "process";
  const rest = words.slice(1).join(" ");

  return rest
    ? `${capitalize(verb)}s ${rest}.`
    : `${capitalize(verb)}s the given input.`;
}

/**
 * Generates a description for an interface.
 */
function generateInterfaceDescription(iface: InterfaceInfo): string {
  const words = iface.name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(/\s+/);
  return `Represents a ${words.join(" ").toLowerCase()}.`;
}

/**
 * Describes a parameter based on its type and name.
 */
function describeParam(param: ParamInfo): string {
  const typeDesc = param.type !== "unknown" ? `The ${param.name}` : param.name;
  if (param.defaultValue) {
    return `${typeDesc} (defaults to ${param.defaultValue})`;
  }
  return typeDesc;
}

/**
 * Describes a return type in human-readable form.
 */
function describeReturnType(returnType: string): string {
  if (returnType.startsWith("Promise<")) {
    const inner = returnType.slice(8, -1);
    return `A promise resolving to ${inner}`;
  }
  return `The resulting ${returnType}`;
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates documentation for all undocumented exports in a file.
 *
 * @param content - Source file content.
 * @param options - Documentation generation options.
 * @returns Array of generated documentation entries.
 */
export function generateDocsForFile(
  content: string,
  options: DocGenerationOptions = DEFAULT_DOC_OPTIONS
): GeneratedDoc[] {
  const docs: GeneratedDoc[] = [];

  const functions = extractFunctions(content);
  for (const func of functions) {
    if (!options.includePrivate && !func.isExported) continue;
    if (options.skipDocumented && func.hasJsDoc) continue;

    docs.push({
      jsDoc: generateFunctionJsDoc(func),
      targetName: func.name,
      insertBeforeLine: func.line,
      confidence: func.params.length > 0 ? 0.7 : 0.5,
    });
  }

  const interfaces = extractInterfaces(content);
  for (const iface of interfaces) {
    if (!options.includePrivate && !iface.isExported) continue;
    if (options.skipDocumented && iface.hasJsDoc) continue;

    docs.push({
      jsDoc: generateInterfaceJsDoc(iface),
      targetName: iface.name,
      insertBeforeLine: iface.line,
      confidence: 0.6,
    });
  }

  return docs;
}
