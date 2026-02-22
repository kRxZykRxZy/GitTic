/**
 * Topic classification module.
 *
 * Classifies repositories into topic categories such as
 * web, machine learning, CLI, library, etc. using
 * dependency analysis and content heuristics.
 *
 * @module tagging/topic-classifier
 */

/**
 * Topic category for a repository.
 */
export type TopicCategory =
  | "web-frontend"
  | "web-backend"
  | "web-fullstack"
  | "mobile"
  | "cli"
  | "library"
  | "framework"
  | "machine-learning"
  | "data-science"
  | "devops"
  | "database"
  | "testing"
  | "documentation"
  | "game"
  | "api"
  | "other";

/**
 * A classified topic with confidence score.
 */
export interface ClassifiedTopic {
  /** Topic category. */
  readonly category: TopicCategory;
  /** Confidence score (0-1). */
  readonly confidence: number;
  /** Evidence that supports this classification. */
  readonly evidence: readonly string[];
}

/**
 * Input for topic classification.
 */
export interface ClassificationInput {
  /** Repository name. */
  readonly name: string;
  /** Repository description. */
  readonly description: string;
  /** File paths in the repository. */
  readonly filePaths: readonly string[];
  /** Dependency names. */
  readonly dependencies: readonly string[];
  /** README content. */
  readonly readmeContent?: string;
  /** Existing topics/tags. */
  readonly existingTopics?: readonly string[];
}

/**
 * Complete classification result.
 */
export interface ClassificationResult {
  /** Primary topic. */
  readonly primaryTopic: ClassifiedTopic;
  /** All detected topics sorted by confidence. */
  readonly topics: readonly ClassifiedTopic[];
  /** Suggested tags for the repository. */
  readonly suggestedTags: readonly string[];
  /** Summary of classification. */
  readonly summary: string;
  /** AI prompt for enhanced classification. */
  readonly aiPrompt: string;
}

/**
 * Topic detection rule.
 */
interface TopicRule {
  /** Topic category. */
  readonly category: TopicCategory;
  /** Dependency names that indicate this topic. */
  readonly dependencies: readonly string[];
  /** File path patterns that indicate this topic. */
  readonly filePatterns: readonly string[];
  /** Description keywords that indicate this topic. */
  readonly descriptionKeywords: readonly string[];
  /** Base weight for matches. */
  readonly weight: number;
}

/**
 * Topic detection rules registry.
 */
const TOPIC_RULES: readonly TopicRule[] = [
  {
    category: "web-frontend",
    dependencies: ["react", "vue", "svelte", "angular", "@angular/core", "next", "nuxt", "gatsby", "preact", "solid-js", "lit"],
    filePatterns: ["components/", ".tsx", ".jsx", ".vue", ".svelte", "styles/", ".css", ".scss"],
    descriptionKeywords: ["frontend", "web app", "ui", "user interface", "dashboard", "single page"],
    weight: 1.0,
  },
  {
    category: "web-backend",
    dependencies: ["express", "fastify", "koa", "hapi", "nestjs", "@nestjs/core", "hono", "restify", "polka"],
    filePatterns: ["routes/", "controllers/", "middleware/", "server.", "api/"],
    descriptionKeywords: ["backend", "server", "rest api", "graphql", "microservice"],
    weight: 1.0,
  },
  {
    category: "cli",
    dependencies: ["commander", "yargs", "meow", "clipanion", "oclif", "inquirer", "prompts", "chalk", "ora"],
    filePatterns: ["bin/", "cli.", "commands/"],
    descriptionKeywords: ["cli", "command line", "terminal", "shell", "console tool"],
    weight: 1.2,
  },
  {
    category: "library",
    dependencies: [],
    filePatterns: ["src/index.", "lib/", "dist/"],
    descriptionKeywords: ["library", "package", "module", "utility", "helper", "toolkit", "sdk"],
    weight: 0.8,
  },
  {
    category: "framework",
    dependencies: [],
    filePatterns: ["plugin", "middleware", "core/", "packages/"],
    descriptionKeywords: ["framework", "platform", "engine", "runtime"],
    weight: 0.9,
  },
  {
    category: "machine-learning",
    dependencies: ["tensorflow", "@tensorflow/tfjs", "onnx", "ml5", "brain.js", "transformers"],
    filePatterns: ["model/", "training/", ".pkl", ".h5", "notebook", ".ipynb"],
    descriptionKeywords: ["machine learning", "ml", "ai", "neural network", "deep learning", "model", "training"],
    weight: 1.5,
  },
  {
    category: "data-science",
    dependencies: ["d3", "chart.js", "plotly", "apache-arrow", "csv-parser"],
    filePatterns: ["data/", "analysis/", "notebooks/", ".csv"],
    descriptionKeywords: ["data science", "analytics", "visualization", "dataset", "etl", "pipeline"],
    weight: 1.2,
  },
  {
    category: "devops",
    dependencies: ["aws-sdk", "@aws-sdk/client-s3", "docker", "kubernetes", "terraform"],
    filePatterns: ["Dockerfile", "docker-compose", ".github/workflows", "terraform/", "k8s/", "helm/", "ansible/"],
    descriptionKeywords: ["devops", "infrastructure", "deployment", "ci/cd", "container", "cloud"],
    weight: 1.0,
  },
  {
    category: "testing",
    dependencies: ["jest", "vitest", "mocha", "cypress", "playwright", "puppeteer", "testing-library"],
    filePatterns: ["test/", "tests/", "__tests__/", "e2e/", "spec/"],
    descriptionKeywords: ["testing", "test framework", "e2e", "integration test", "unit test"],
    weight: 1.0,
  },
  {
    category: "mobile",
    dependencies: ["react-native", "expo", "ionic", "capacitor", "nativescript"],
    filePatterns: ["android/", "ios/", "App.tsx", "app.json"],
    descriptionKeywords: ["mobile", "ios", "android", "react native", "cross-platform"],
    weight: 1.3,
  },
  {
    category: "api",
    dependencies: ["graphql", "apollo-server", "trpc", "@trpc/server", "swagger", "openapi"],
    filePatterns: ["schema.graphql", "resolvers/", "openapi.", "swagger."],
    descriptionKeywords: ["api", "graphql", "rest", "endpoint", "openapi"],
    weight: 1.0,
  },
  {
    category: "game",
    dependencies: ["phaser", "pixi.js", "three", "babylon.js", "excalibur"],
    filePatterns: ["game/", "assets/sprites", "scenes/"],
    descriptionKeywords: ["game", "2d", "3d", "engine", "sprite", "physics"],
    weight: 1.2,
  },
] as const;

/**
 * Scores a topic rule against the input.
 *
 * @param rule - Topic rule to evaluate.
 * @param input - Classification input.
 * @returns Score and evidence array.
 */
export function scoreTopicRule(
  rule: TopicRule,
  input: ClassificationInput
): { score: number; evidence: string[] } {
  let score = 0;
  const evidence: string[] = [];
  const depsLower = new Set(input.dependencies.map((d) => d.toLowerCase()));

  for (const dep of rule.dependencies) {
    if (depsLower.has(dep.toLowerCase())) {
      score += rule.weight * 2;
      evidence.push(`dependency: ${dep}`);
    }
  }

  for (const pattern of rule.filePatterns) {
    const matches = input.filePaths.filter((fp) =>
      fp.toLowerCase().includes(pattern.toLowerCase())
    );
    if (matches.length > 0) {
      score += rule.weight * Math.min(matches.length * 0.5, 3);
      evidence.push(`file pattern: ${pattern} (${matches.length} matches)`);
    }
  }

  const combined = `${input.name} ${input.description} ${input.readmeContent ?? ""}`.toLowerCase();
  for (const keyword of rule.descriptionKeywords) {
    if (combined.includes(keyword.toLowerCase())) {
      score += rule.weight;
      evidence.push(`keyword: "${keyword}"`);
    }
  }

  return { score, evidence };
}

/**
 * Detects if a project is full-stack (both frontend and backend).
 *
 * @param topics - Detected topics.
 * @returns True if both frontend and backend are detected.
 */
export function detectFullStack(
  topics: readonly ClassifiedTopic[]
): boolean {
  const hasFrontend = topics.some(
    (t) => t.category === "web-frontend" && t.confidence > 0.3
  );
  const hasBackend = topics.some(
    (t) => t.category === "web-backend" && t.confidence > 0.3
  );
  return hasFrontend && hasBackend;
}

/**
 * Generates suggested tags from classification results.
 *
 * @param topics - Classified topics.
 * @param input - Classification input.
 * @returns Array of suggested tag strings.
 */
export function generateTags(
  topics: readonly ClassifiedTopic[],
  input: ClassificationInput
): string[] {
  const tags = new Set<string>();

  for (const topic of topics.filter((t) => t.confidence > 0.3)) {
    tags.add(topic.category);
  }

  const langPatterns: ReadonlyArray<{ ext: string; lang: string }> = [
    { ext: ".ts", lang: "typescript" },
    { ext: ".js", lang: "javascript" },
    { ext: ".py", lang: "python" },
    { ext: ".go", lang: "go" },
    { ext: ".rs", lang: "rust" },
  ];

  for (const { ext, lang } of langPatterns) {
    if (input.filePaths.some((f) => f.endsWith(ext))) {
      tags.add(lang);
    }
  }

  return [...tags].slice(0, 10);
}

/**
 * Classifies a repository into topic categories.
 *
 * @param input - Classification input with repo metadata.
 * @returns Complete classification result.
 */
export function classifyTopics(input: ClassificationInput): ClassificationResult {
  const scoredTopics: ClassifiedTopic[] = [];
  let maxScore = 0;

  for (const rule of TOPIC_RULES) {
    const { score, evidence } = scoreTopicRule(rule, input);
    if (score > 0) {
      scoredTopics.push({
        category: rule.category,
        confidence: score,
        evidence,
      });
      if (score > maxScore) maxScore = score;
    }
  }

  const normalized: ClassifiedTopic[] = scoredTopics.map((t) => ({
    ...t,
    confidence: maxScore > 0 ? Math.min(0.95, t.confidence / maxScore) : 0,
  }));

  normalized.sort((a, b) => b.confidence - a.confidence);

  if (detectFullStack(normalized)) {
    normalized.unshift({
      category: "web-fullstack",
      confidence: 0.85,
      evidence: ["Detected both frontend and backend components"],
    });
  }

  const primaryTopic = normalized[0] ?? {
    category: "other" as TopicCategory,
    confidence: 0,
    evidence: ["No strong topic signals detected"],
  };

  const suggestedTags = generateTags(normalized, input);

  const summary = `${input.name} is classified as ${primaryTopic.category} ` +
    `(${Math.round(primaryTopic.confidence * 100)}% confidence). ` +
    `${normalized.length} topic(s) detected.`;

  const aiPrompt = [
    "Classify this repository into topic categories.",
    "",
    `Name: ${input.name}`,
    `Description: ${input.description}`,
    `Dependencies: ${input.dependencies.slice(0, 20).join(", ")}`,
    `File count: ${input.filePaths.length}`,
    "",
    `Initial classification: ${primaryTopic.category} (${Math.round(primaryTopic.confidence * 100)}%)`,
    "",
    "Provide a refined classification with confidence scores.",
  ].join("\n");

  return {
    primaryTopic,
    topics: normalized,
    suggestedTags,
    summary,
    aiPrompt,
  };
}
