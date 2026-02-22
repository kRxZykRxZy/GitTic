/**
 * AI tutor module.
 *
 * Provides step-by-step error explanation, concept teaching,
 * and progressive hints for learning programming concepts.
 *
 * @module assistant/tutor
 */

/**
 * Skill level of the learner.
 */
export type SkillLevel = "beginner" | "intermediate" | "advanced";

/**
 * A teaching topic that the tutor can explain.
 */
export interface TeachingTopic {
  /** Topic identifier. */
  readonly id: string;
  /** Topic display name. */
  readonly name: string;
  /** Topic category. */
  readonly category: TopicCategory;
  /** Difficulty level. */
  readonly difficulty: SkillLevel;
  /** Short description. */
  readonly description: string;
  /** Prerequisites (topic IDs). */
  readonly prerequisites: readonly string[];
  /** Related topics (topic IDs). */
  readonly relatedTopics: readonly string[];
}

/**
 * Categories for teaching topics.
 */
export type TopicCategory =
  | "language-basics"
  | "data-structures"
  | "algorithms"
  | "design-patterns"
  | "testing"
  | "architecture"
  | "tools"
  | "best-practices";

/**
 * A progressive hint for solving a problem.
 */
export interface ProgressiveHint {
  /** Hint level (1 = most subtle, higher = more direct). */
  readonly level: number;
  /** The hint text. */
  readonly text: string;
  /** Category of hint. */
  readonly category: "direction" | "concept" | "approach" | "solution";
}

/**
 * A step in a step-by-step explanation.
 */
export interface ExplanationStep {
  /** Step number. */
  readonly step: number;
  /** Step title. */
  readonly title: string;
  /** Detailed explanation. */
  readonly explanation: string;
  /** Code example for this step. */
  readonly codeExample?: string;
  /** Key takeaway from this step. */
  readonly keyTakeaway: string;
}

/**
 * A learning exercise for practice.
 */
export interface Exercise {
  /** Exercise description. */
  readonly description: string;
  /** Difficulty level. */
  readonly difficulty: SkillLevel;
  /** Starting code template. */
  readonly starterCode: string;
  /** Expected behavior description. */
  readonly expectedBehavior: string;
  /** Hints for solving. */
  readonly hints: readonly ProgressiveHint[];
}

/**
 * Complete tutoring session response.
 */
export interface TutoringResponse {
  /** The topic being taught. */
  readonly topic: string;
  /** Adapted skill level. */
  readonly skillLevel: SkillLevel;
  /** Step-by-step explanation. */
  readonly steps: readonly ExplanationStep[];
  /** Practice exercises. */
  readonly exercises: readonly Exercise[];
  /** Summary of key concepts. */
  readonly summary: string;
  /** Next topics to explore. */
  readonly nextTopics: readonly string[];
  /** AI prompt for personalized tutoring. */
  readonly aiPrompt: string;
}

/**
 * Registry of teaching topics with prerequisites and relationships.
 */
export const TOPIC_REGISTRY: readonly TeachingTopic[] = [
  {
    id: "variables",
    name: "Variables and Types",
    category: "language-basics",
    difficulty: "beginner",
    description: "Understanding variable declarations, types, and scope in TypeScript",
    prerequisites: [],
    relatedTopics: ["functions", "type-system"],
  },
  {
    id: "functions",
    name: "Functions",
    category: "language-basics",
    difficulty: "beginner",
    description: "Function declarations, arrow functions, parameters, and return types",
    prerequisites: ["variables"],
    relatedTopics: ["async-await", "closures"],
  },
  {
    id: "async-await",
    name: "Async/Await",
    category: "language-basics",
    difficulty: "intermediate",
    description: "Asynchronous programming with Promises, async/await, and error handling",
    prerequisites: ["functions"],
    relatedTopics: ["error-handling", "event-loop"],
  },
  {
    id: "type-system",
    name: "TypeScript Type System",
    category: "language-basics",
    difficulty: "intermediate",
    description: "Interfaces, generics, union types, and type inference",
    prerequisites: ["variables", "functions"],
    relatedTopics: ["generics", "type-guards"],
  },
  {
    id: "design-patterns",
    name: "Design Patterns",
    category: "design-patterns",
    difficulty: "advanced",
    description: "Common design patterns: factory, observer, strategy, decorator",
    prerequisites: ["functions", "type-system"],
    relatedTopics: ["solid-principles", "architecture"],
  },
  {
    id: "testing-fundamentals",
    name: "Testing Fundamentals",
    category: "testing",
    difficulty: "intermediate",
    description: "Unit testing, test-driven development, mocking, and assertions",
    prerequisites: ["functions"],
    relatedTopics: ["design-patterns"],
  },
] as const;

/**
 * Generates progressive hints for a problem, from subtle to explicit.
 *
 * @param problem - Description of the problem.
 * @param solution - The solution approach.
 * @param maxHints - Maximum number of hints to generate.
 * @returns Array of progressive hints.
 */
export function generateProgressiveHints(
  problem: string,
  solution: string,
  maxHints: number = 5
): ProgressiveHint[] {
  const hints: ProgressiveHint[] = [];

  hints.push({
    level: 1,
    text: `Think about what the error message is telling you. What part of your code does it reference?`,
    category: "direction",
  });

  hints.push({
    level: 2,
    text: `Consider the types involved. What type does the operation expect vs. what it received?`,
    category: "concept",
  });

  hints.push({
    level: 3,
    text: `Look at the line mentioned in the error. What could be null or undefined there?`,
    category: "approach",
  });

  if (solution) {
    const words = solution.split(/\s+/).slice(0, 10);
    hints.push({
      level: 4,
      text: `The fix involves: ${words.join(" ")}...`,
      category: "approach",
    });

    hints.push({
      level: 5,
      text: `Solution: ${solution}`,
      category: "solution",
    });
  }

  return hints.slice(0, maxHints);
}

/**
 * Creates a step-by-step explanation for a concept.
 *
 * @param concept - The concept to explain.
 * @param skillLevel - Target audience skill level.
 * @returns Array of explanation steps.
 */
export function createStepByStepExplanation(
  concept: string,
  skillLevel: SkillLevel
): ExplanationStep[] {
  const steps: ExplanationStep[] = [];
  const depth = skillLevel === "beginner" ? 5 : skillLevel === "intermediate" ? 4 : 3;

  steps.push({
    step: 1,
    title: "What is it?",
    explanation: `${concept} is a fundamental concept in programming. Let's understand what it means and why it's important.`,
    keyTakeaway: `Understanding ${concept} is essential for writing robust code.`,
  });

  steps.push({
    step: 2,
    title: "Why does it matter?",
    explanation: `${concept} helps you write more maintainable, readable, and correct code. Without it, you may encounter subtle bugs.`,
    keyTakeaway: `${concept} prevents common mistakes and improves code quality.`,
  });

  if (depth >= 3) {
    steps.push({
      step: 3,
      title: "Basic example",
      explanation: `Here's a simple example showing ${concept} in action.`,
      codeExample: `// Example of ${concept}\n// (See AI-generated examples for real code)`,
      keyTakeaway: `Start simple and build up to more complex uses of ${concept}.`,
    });
  }

  if (depth >= 4) {
    steps.push({
      step: 4,
      title: "Common pitfalls",
      explanation: `When using ${concept}, watch out for these common mistakes that developers frequently make.`,
      keyTakeaway: "Awareness of pitfalls helps you avoid them from the start.",
    });
  }

  if (depth >= 5) {
    steps.push({
      step: 5,
      title: "Practice exercise",
      explanation: `Try applying ${concept} yourself with a hands-on exercise.`,
      keyTakeaway: "Practice solidifies understanding.",
    });
  }

  return steps;
}

/**
 * Looks up a topic by its identifier.
 *
 * @param topicId - The topic ID to look up.
 * @returns The teaching topic, or undefined if not found.
 */
export function lookupTopic(topicId: string): TeachingTopic | undefined {
  return TOPIC_REGISTRY.find((t) => t.id === topicId);
}

/**
 * Gets recommended next topics based on completed topics.
 *
 * @param completedTopicIds - IDs of topics already learned.
 * @returns Array of recommended next topic IDs.
 */
export function getRecommendedTopics(
  completedTopicIds: readonly string[]
): string[] {
  const completed = new Set(completedTopicIds);
  const recommended: string[] = [];

  for (const topic of TOPIC_REGISTRY) {
    if (completed.has(topic.id)) continue;

    const prereqsMet = topic.prerequisites.every((p) => completed.has(p));
    if (prereqsMet) {
      recommended.push(topic.id);
    }
  }

  return recommended;
}

/**
 * Adapts the skill level based on user responses.
 *
 * @param correctAnswers - Number of correct answers.
 * @param totalQuestions - Total questions attempted.
 * @param currentLevel - Current skill level.
 * @returns Adapted skill level.
 */
export function adaptSkillLevel(
  correctAnswers: number,
  totalQuestions: number,
  currentLevel: SkillLevel
): SkillLevel {
  if (totalQuestions === 0) return currentLevel;

  const accuracy = correctAnswers / totalQuestions;

  if (accuracy >= 0.85 && currentLevel === "beginner") return "intermediate";
  if (accuracy >= 0.85 && currentLevel === "intermediate") return "advanced";
  if (accuracy < 0.4 && currentLevel === "advanced") return "intermediate";
  if (accuracy < 0.4 && currentLevel === "intermediate") return "beginner";

  return currentLevel;
}

/**
 * Generates a complete tutoring response for a topic.
 *
 * @param topicId - Topic to teach.
 * @param skillLevel - Learner's current skill level.
 * @returns Complete tutoring response.
 */
export function generateTutoringResponse(
  topicId: string,
  skillLevel: SkillLevel
): TutoringResponse {
  const topic = lookupTopic(topicId);
  const topicName = topic?.name ?? topicId;
  const steps = createStepByStepExplanation(topicName, skillLevel);
  const nextTopics = getRecommendedTopics([topicId]);

  const exercises: Exercise[] = [
    {
      description: `Practice ${topicName} with this exercise.`,
      difficulty: skillLevel,
      starterCode: `// TODO: Implement using ${topicName}`,
      expectedBehavior: `Correctly demonstrates ${topicName}`,
      hints: generateProgressiveHints(
        `How to use ${topicName}`,
        `Apply ${topicName} to solve the problem`
      ),
    },
  ];

  const summary = `You learned about ${topicName}. Key concepts covered: ${steps.map((s) => s.title).join(", ")}.`;

  const aiPrompt = [
    `Teach the concept of "${topicName}" to a ${skillLevel} developer.`,
    "",
    "Provide:",
    "1. Clear explanation with analogies",
    "2. Progressive code examples",
    "3. Common mistakes to avoid",
    "4. Practice exercises",
    "",
    `Adapt the complexity for a ${skillLevel} audience.`,
  ].join("\n");

  return {
    topic: topicName,
    skillLevel,
    steps,
    exercises,
    summary,
    nextTopics,
    aiPrompt,
  };
}
