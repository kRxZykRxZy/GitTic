/**
 * Prompt builder utility module.
 *
 * Provides a template system for composing complex prompts
 * with variable substitution, few-shot examples, and
 * section management.
 *
 * @module utils/prompt-builder
 */

/**
 * A variable to be interpolated into a prompt template.
 */
export interface PromptVariable {
  /** Variable name (without delimiters). */
  readonly name: string;
  /** Variable value. */
  readonly value: string;
  /** Whether the variable is required. */
  readonly required: boolean;
}

/**
 * A few-shot example for inclusion in a prompt.
 */
export interface FewShotExample {
  /** The input part of the example. */
  readonly input: string;
  /** The expected output part of the example. */
  readonly output: string;
  /** Optional label for the example. */
  readonly label?: string;
}

/**
 * A section in a structured prompt.
 */
export interface PromptSection {
  /** Section title/header. */
  readonly title: string;
  /** Section content. */
  readonly content: string;
  /** Section priority (lower = higher priority). */
  readonly priority: number;
  /** Whether this section is required. */
  readonly required: boolean;
  /** Estimated token count of this section. */
  readonly tokenEstimate: number;
}

/**
 * Configuration for the prompt builder.
 */
export interface PromptBuilderConfig {
  /** Maximum total tokens for the prompt. */
  readonly maxTokens: number;
  /** Variable delimiter start (default: "{{"). */
  readonly delimiterStart: string;
  /** Variable delimiter end (default: "}}"). */
  readonly delimiterEnd: string;
  /** Separator between sections. */
  readonly sectionSeparator: string;
  /** Whether to trim whitespace from sections. */
  readonly trimSections: boolean;
}

/**
 * Default prompt builder configuration.
 */
export const DEFAULT_PROMPT_CONFIG: PromptBuilderConfig = {
  maxTokens: 4000,
  delimiterStart: "{{",
  delimiterEnd: "}}",
  sectionSeparator: "\n\n",
  trimSections: true,
} as const;

/**
 * Compiled prompt template with metadata.
 */
export interface CompiledPrompt {
  /** The final prompt text. */
  readonly text: string;
  /** Estimated token count. */
  readonly estimatedTokens: number;
  /** Variables that were substituted. */
  readonly substitutedVariables: readonly string[];
  /** Variables that were missing. */
  readonly missingVariables: readonly string[];
  /** Sections included in the prompt. */
  readonly includedSections: readonly string[];
  /** Sections excluded due to token limits. */
  readonly excludedSections: readonly string[];
}

/**
 * Extracts variable names from a template string.
 *
 * @param template - The template string.
 * @param config - Prompt builder configuration.
 * @returns Array of variable names found in the template.
 */
export function extractVariableNames(
  template: string,
  config: PromptBuilderConfig = DEFAULT_PROMPT_CONFIG
): string[] {
  const escapedStart = escapeRegExp(config.delimiterStart);
  const escapedEnd = escapeRegExp(config.delimiterEnd);
  const pattern = new RegExp(`${escapedStart}\\s*(\\w+)\\s*${escapedEnd}`, "g");

  const names: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(template)) !== null) {
    if (!names.includes(match[1]!)) {
      names.push(match[1]!);
    }
  }

  return names;
}

/**
 * Substitutes variables in a template string.
 *
 * @param template - Template string with variable placeholders.
 * @param variables - Map of variable name to value.
 * @param config - Prompt builder configuration.
 * @returns The template with variables substituted.
 */
export function substituteVariables(
  template: string,
  variables: ReadonlyMap<string, string> | Record<string, string>,
  config: PromptBuilderConfig = DEFAULT_PROMPT_CONFIG
): { text: string; substituted: string[]; missing: string[] } {
  const varMap =
    variables instanceof Map
      ? variables
      : new Map(Object.entries(variables));

  const escapedStart = escapeRegExp(config.delimiterStart);
  const escapedEnd = escapeRegExp(config.delimiterEnd);
  const pattern = new RegExp(`${escapedStart}\\s*(\\w+)\\s*${escapedEnd}`, "g");

  const substituted: string[] = [];
  const missing: string[] = [];

  const text = template.replace(pattern, (_match, name: string) => {
    const value = varMap.get(name);
    if (value !== undefined) {
      substituted.push(name);
      return value;
    }
    missing.push(name);
    return _match;
  });

  return { text, substituted, missing };
}

/**
 * Formats few-shot examples into a prompt section.
 *
 * @param examples - Array of few-shot examples.
 * @param inputLabel - Label for the input section (default: "Input").
 * @param outputLabel - Label for the output section (default: "Output").
 * @returns Formatted examples string.
 */
export function formatFewShotExamples(
  examples: readonly FewShotExample[],
  inputLabel: string = "Input",
  outputLabel: string = "Output"
): string {
  if (examples.length === 0) return "";

  const lines: string[] = ["## Examples", ""];

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i]!;
    const label = example.label ?? `Example ${i + 1}`;
    lines.push(`### ${label}`);
    lines.push("");
    lines.push(`**${inputLabel}:**`);
    lines.push(example.input);
    lines.push("");
    lines.push(`**${outputLabel}:**`);
    lines.push(example.output);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Fluent builder for constructing complex prompts.
 */
export class PromptBuilder {
  private readonly config: PromptBuilderConfig;
  private sections: PromptSection[] = [];
  private variables: Map<string, string> = new Map();
  private examples: FewShotExample[] = [];
  private systemContext: string = "";

  /**
   * Creates a new PromptBuilder.
   *
   * @param config - Optional configuration overrides.
   */
  constructor(config: Partial<PromptBuilderConfig> = {}) {
    this.config = { ...DEFAULT_PROMPT_CONFIG, ...config };
  }

  /**
   * Sets the system context/instruction for the prompt.
   *
   * @param context - System context text.
   * @returns This builder for chaining.
   */
  setSystemContext(context: string): this {
    this.systemContext = context;
    return this;
  }

  /**
   * Adds a section to the prompt.
   *
   * @param title - Section title.
   * @param content - Section content.
   * @param priority - Priority (lower = higher priority). Default: 50.
   * @param required - Whether this section must be included. Default: false.
   * @returns This builder for chaining.
   */
  addSection(
    title: string,
    content: string,
    priority: number = 50,
    required: boolean = false
  ): this {
    const tokenEstimate = Math.ceil(content.length / 4);
    this.sections.push({
      title,
      content: this.config.trimSections ? content.trim() : content,
      priority,
      required,
      tokenEstimate,
    });
    return this;
  }

  /**
   * Sets a variable value for template substitution.
   *
   * @param name - Variable name.
   * @param value - Variable value.
   * @returns This builder for chaining.
   */
  setVariable(name: string, value: string): this {
    this.variables.set(name, value);
    return this;
  }

  /**
   * Sets multiple variables from a record.
   *
   * @param vars - Record of variable name to value.
   * @returns This builder for chaining.
   */
  setVariables(vars: Record<string, string>): this {
    for (const [name, value] of Object.entries(vars)) {
      this.variables.set(name, value);
    }
    return this;
  }

  /**
   * Adds a few-shot example.
   *
   * @param input - Example input.
   * @param output - Expected output.
   * @param label - Optional label.
   * @returns This builder for chaining.
   */
  addExample(input: string, output: string, label?: string): this {
    this.examples.push({ input, output, label });
    return this;
  }

  /**
   * Builds and compiles the final prompt.
   *
   * Sorts sections by priority, includes required sections first,
   * then adds optional sections until the token limit is reached.
   *
   * @returns The compiled prompt with metadata.
   */
  build(): CompiledPrompt {
    const sortedSections = [...this.sections].sort(
      (a, b) => a.priority - b.priority
    );

    const includedSections: PromptSection[] = [];
    const excludedSections: string[] = [];
    let totalTokens = Math.ceil(this.systemContext.length / 4);

    if (this.examples.length > 0) {
      const examplesText = formatFewShotExamples(this.examples);
      totalTokens += Math.ceil(examplesText.length / 4);
    }

    for (const section of sortedSections) {
      if (section.required) {
        includedSections.push(section);
        totalTokens += section.tokenEstimate;
      }
    }

    for (const section of sortedSections) {
      if (section.required) continue;
      if (totalTokens + section.tokenEstimate <= this.config.maxTokens) {
        includedSections.push(section);
        totalTokens += section.tokenEstimate;
      } else {
        excludedSections.push(section.title);
      }
    }

    const parts: string[] = [];
    if (this.systemContext) {
      parts.push(this.systemContext);
    }

    if (this.examples.length > 0) {
      parts.push(formatFewShotExamples(this.examples));
    }

    for (const section of includedSections) {
      parts.push(`## ${section.title}\n${section.content}`);
    }

    let text = parts.join(this.config.sectionSeparator);

    const {
      text: substitutedText,
      substituted: substitutedVariables,
      missing: missingVariables,
    } = substituteVariables(text, this.variables, this.config);

    text = substitutedText;

    return {
      text,
      estimatedTokens: Math.ceil(text.length / 4),
      substitutedVariables,
      missingVariables,
      includedSections: includedSections.map((s) => s.title),
      excludedSections,
    };
  }

  /**
   * Resets the builder to its initial state.
   *
   * @returns This builder for chaining.
   */
  reset(): this {
    this.sections = [];
    this.variables = new Map();
    this.examples = [];
    this.systemContext = "";
    return this;
  }
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Creates a PromptBuilder with common coding assistant setup.
 *
 * @param task - Description of the task.
 * @param language - Programming language context.
 * @returns A pre-configured PromptBuilder.
 */
export function createCodingPrompt(
  task: string,
  language: string
): PromptBuilder {
  return new PromptBuilder()
    .setSystemContext(
      `You are an expert ${language} developer. Help with the following task. ` +
      "Be concise, accurate, and provide working code examples."
    )
    .addSection("Task", task, 0, true)
    .setVariable("language", language);
}
