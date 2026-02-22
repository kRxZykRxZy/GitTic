/**
 * Model registry module.
 *
 * Maintains a registry of supported AI models with their capabilities,
 * context window sizes, cost tiers, and selection logic.
 *
 * @module models
 */

/**
 * Capability flags for AI models.
 */
export interface ModelCapabilities {
  /** Supports code generation and completion. */
  readonly codeGeneration: boolean;
  /** Supports natural language chat. */
  readonly chat: boolean;
  /** Supports code analysis and review. */
  readonly codeAnalysis: boolean;
  /** Supports function/tool calling. */
  readonly functionCalling: boolean;
  /** Supports streaming responses. */
  readonly streaming: boolean;
  /** Supports structured JSON output. */
  readonly jsonMode: boolean;
  /** Supports image/vision input. */
  readonly vision: boolean;
}

/**
 * Cost tier classification for models.
 */
export type CostTier = "free" | "low" | "medium" | "high" | "premium";

/**
 * Complete model definition in the registry.
 */
export interface ModelDefinition {
  /** Unique model identifier. */
  readonly id: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /** Model provider (e.g., "openai", "anthropic"). */
  readonly provider: string;
  /** Maximum context window size in tokens. */
  readonly contextWindow: number;
  /** Maximum output tokens. */
  readonly maxOutputTokens: number;
  /** Capability flags. */
  readonly capabilities: ModelCapabilities;
  /** Cost classification. */
  readonly costTier: CostTier;
  /** Whether this model is currently available. */
  readonly available: boolean;
  /** Optional description of the model. */
  readonly description: string;
  /** Supported task types for this model. */
  readonly recommendedTasks: readonly string[];
}

/**
 * Criteria for selecting a model.
 */
export interface ModelSelectionCriteria {
  /** Required task type (e.g., "codeGeneration", "chat"). */
  readonly task?: string;
  /** Minimum context window size needed. */
  readonly minContextWindow?: number;
  /** Maximum acceptable cost tier. */
  readonly maxCostTier?: CostTier;
  /** Required capabilities. */
  readonly requiredCapabilities?: readonly (keyof ModelCapabilities)[];
  /** Preferred provider. */
  readonly preferredProvider?: string;
}

/**
 * Cost tier ordering for comparison.
 */
const COST_TIER_ORDER: Record<CostTier, number> = {
  free: 0,
  low: 1,
  medium: 2,
  high: 3,
  premium: 4,
};

/**
 * Registry of supported AI models with their specifications.
 */
export const MODEL_REGISTRY: readonly ModelDefinition[] = [
  {
    id: "openai",
    displayName: "GPT-4o",
    provider: "openai",
    contextWindow: 128_000,
    maxOutputTokens: 4096,
    capabilities: {
      codeGeneration: true,
      chat: true,
      codeAnalysis: true,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      vision: true,
    },
    costTier: "high",
    available: true,
    description: "OpenAI GPT-4o multimodal model with strong coding abilities",
    recommendedTasks: ["codeGeneration", "codeReview", "chat", "documentation"],
  },
  {
    id: "openai-large",
    displayName: "GPT-4o Large",
    provider: "openai",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    capabilities: {
      codeGeneration: true,
      chat: true,
      codeAnalysis: true,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      vision: true,
    },
    costTier: "premium",
    available: true,
    description: "GPT-4o with extended output for complex tasks",
    recommendedTasks: ["codeGeneration", "documentation", "refactoring"],
  },
  {
    id: "mistral",
    displayName: "Mistral Large",
    provider: "mistral",
    contextWindow: 32_000,
    maxOutputTokens: 4096,
    capabilities: {
      codeGeneration: true,
      chat: true,
      codeAnalysis: true,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
      vision: false,
    },
    costTier: "medium",
    available: true,
    description: "Mistral AI's large model with good code understanding",
    recommendedTasks: ["codeGeneration", "chat", "classification"],
  },
  {
    id: "mistral-small",
    displayName: "Mistral Small",
    provider: "mistral",
    contextWindow: 32_000,
    maxOutputTokens: 2048,
    capabilities: {
      codeGeneration: true,
      chat: true,
      codeAnalysis: false,
      functionCalling: false,
      streaming: true,
      jsonMode: false,
      vision: false,
    },
    costTier: "low",
    available: true,
    description: "Lightweight Mistral model for simple tasks",
    recommendedTasks: ["chat", "commitMessage", "classification"],
  },
  {
    id: "llama",
    displayName: "Llama 3.1 70B",
    provider: "meta",
    contextWindow: 128_000,
    maxOutputTokens: 4096,
    capabilities: {
      codeGeneration: true,
      chat: true,
      codeAnalysis: true,
      functionCalling: false,
      streaming: true,
      jsonMode: false,
      vision: false,
    },
    costTier: "free",
    available: true,
    description: "Meta's open-source Llama model with large context",
    recommendedTasks: ["chat", "codeGeneration", "documentation"],
  },
  {
    id: "deepseek",
    displayName: "DeepSeek Coder V2",
    provider: "deepseek",
    contextWindow: 64_000,
    maxOutputTokens: 4096,
    capabilities: {
      codeGeneration: true,
      chat: true,
      codeAnalysis: true,
      functionCalling: false,
      streaming: true,
      jsonMode: true,
      vision: false,
    },
    costTier: "low",
    available: true,
    description: "DeepSeek's specialized coding model",
    recommendedTasks: ["codeGeneration", "codeReview", "refactoring"],
  },
] as const;

/**
 * Retrieves a model definition by its identifier.
 *
 * @param modelId - The unique model identifier.
 * @returns The model definition, or undefined if not found.
 */
export function getModel(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find((m) => m.id === modelId);
}

/**
 * Returns all available models in the registry.
 *
 * @returns Array of available model definitions.
 */
export function getAvailableModels(): ModelDefinition[] {
  return MODEL_REGISTRY.filter((m) => m.available);
}

/**
 * Selects the best model matching the given criteria.
 *
 * Filters models by availability, required capabilities, context window,
 * and cost tier, then ranks by provider preference and cost efficiency.
 *
 * @param criteria - Selection criteria for finding the best model.
 * @returns The best matching model, or undefined if none match.
 */
export function selectModel(
  criteria: ModelSelectionCriteria
): ModelDefinition | undefined {
  let candidates = MODEL_REGISTRY.filter((m) => m.available);

  if (criteria.task) {
    const task = criteria.task;
    candidates = candidates.filter((m) => m.recommendedTasks.includes(task));
  }

  if (criteria.minContextWindow !== undefined) {
    const minCtx = criteria.minContextWindow;
    candidates = candidates.filter((m) => m.contextWindow >= minCtx);
  }

  if (criteria.maxCostTier !== undefined) {
    const maxOrder = COST_TIER_ORDER[criteria.maxCostTier];
    candidates = candidates.filter(
      (m) => COST_TIER_ORDER[m.costTier] <= maxOrder
    );
  }

  if (criteria.requiredCapabilities) {
    for (const cap of criteria.requiredCapabilities) {
      candidates = candidates.filter((m) => m.capabilities[cap]);
    }
  }

  if (candidates.length === 0) {
    return undefined;
  }

  candidates.sort((a, b) => {
    if (criteria.preferredProvider) {
      const aMatch = a.provider === criteria.preferredProvider ? 0 : 1;
      const bMatch = b.provider === criteria.preferredProvider ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    return COST_TIER_ORDER[a.costTier] - COST_TIER_ORDER[b.costTier];
  });

  return candidates[0];
}

/**
 * Compares cost tiers, returning a negative number if a < b, positive if a > b.
 *
 * @param a - First cost tier.
 * @param b - Second cost tier.
 * @returns Numeric comparison result.
 */
export function compareCostTiers(a: CostTier, b: CostTier): number {
  return COST_TIER_ORDER[a] - COST_TIER_ORDER[b];
}

/**
 * Groups models by their provider.
 *
 * @returns A map of provider name to model definitions.
 */
export function getModelsByProvider(): Map<string, ModelDefinition[]> {
  const grouped = new Map<string, ModelDefinition[]>();
  for (const model of MODEL_REGISTRY) {
    const existing = grouped.get(model.provider) ?? [];
    existing.push(model);
    grouped.set(model.provider, existing);
  }
  return grouped;
}
