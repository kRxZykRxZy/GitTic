/**
 * Sentiment analysis module.
 *
 * Analyzes text from issue comments and discussions for
 * sentiment (positive, negative, neutral) and urgency
 * detection.
 *
 * @module tagging/sentiment-analyzer
 */

/**
 * Sentiment classification.
 */
export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

/**
 * Urgency level detected in text.
 */
export type UrgencyLevel = "critical" | "high" | "normal" | "low";

/**
 * Result of sentiment analysis on a single text.
 */
export interface SentimentResult {
  /** Overall sentiment. */
  readonly sentiment: Sentiment;
  /** Sentiment score (-1 to 1, negative to positive). */
  readonly score: number;
  /** Urgency level. */
  readonly urgency: UrgencyLevel;
  /** Urgency score (0-1). */
  readonly urgencyScore: number;
  /** Emotional indicators found. */
  readonly emotions: readonly EmotionIndicator[];
  /** Whether the text contains frustrated language. */
  readonly isFrustrated: boolean;
  /** Whether the text expresses gratitude. */
  readonly isGrateful: boolean;
}

/**
 * An emotional indicator found in text.
 */
export interface EmotionIndicator {
  /** Type of emotion detected. */
  readonly emotion: EmotionType;
  /** Intensity (0-1). */
  readonly intensity: number;
  /** The keyword or phrase that triggered detection. */
  readonly trigger: string;
}

/**
 * Types of emotions that can be detected.
 */
export type EmotionType =
  | "frustration"
  | "gratitude"
  | "confusion"
  | "excitement"
  | "concern"
  | "satisfaction"
  | "disappointment"
  | "urgency";

/**
 * Batch sentiment analysis result.
 */
export interface BatchSentimentResult {
  /** Individual results for each text. */
  readonly results: readonly SentimentResult[];
  /** Average sentiment score. */
  readonly averageScore: number;
  /** Overall trend. */
  readonly trend: Sentiment;
  /** Most common urgency level. */
  readonly dominantUrgency: UrgencyLevel;
  /** Summary of the analysis. */
  readonly summary: string;
}

/**
 * Positive sentiment keywords with weights.
 */
const POSITIVE_KEYWORDS: ReadonlyArray<{ word: string; weight: number }> = [
  { word: "thank", weight: 1.5 },
  { word: "thanks", weight: 1.5 },
  { word: "great", weight: 1.0 },
  { word: "awesome", weight: 1.2 },
  { word: "excellent", weight: 1.2 },
  { word: "amazing", weight: 1.2 },
  { word: "perfect", weight: 1.0 },
  { word: "love", weight: 1.0 },
  { word: "helpful", weight: 0.8 },
  { word: "appreciate", weight: 1.0 },
  { word: "nice", weight: 0.6 },
  { word: "good", weight: 0.5 },
  { word: "well done", weight: 1.0 },
  { word: "fantastic", weight: 1.2 },
  { word: "works", weight: 0.4 },
  { word: "solved", weight: 0.8 },
  { word: "fixed", weight: 0.6 },
  { word: "resolved", weight: 0.7 },
] as const;

/**
 * Negative sentiment keywords with weights.
 */
const NEGATIVE_KEYWORDS: ReadonlyArray<{ word: string; weight: number }> = [
  { word: "broken", weight: 1.2 },
  { word: "bug", weight: 0.8 },
  { word: "crash", weight: 1.0 },
  { word: "error", weight: 0.6 },
  { word: "fail", weight: 0.8 },
  { word: "terrible", weight: 1.5 },
  { word: "awful", weight: 1.5 },
  { word: "worst", weight: 1.5 },
  { word: "frustrat", weight: 1.3 },
  { word: "annoying", weight: 1.0 },
  { word: "disappointing", weight: 1.0 },
  { word: "useless", weight: 1.3 },
  { word: "hate", weight: 1.2 },
  { word: "horrible", weight: 1.5 },
  { word: "stuck", weight: 0.7 },
  { word: "waste", weight: 1.0 },
  { word: "impossible", weight: 0.9 },
  { word: "ridiculous", weight: 1.2 },
] as const;

/**
 * Urgency keywords with weights.
 */
const URGENCY_KEYWORDS: ReadonlyArray<{ word: string; weight: number; level: UrgencyLevel }> = [
  { word: "urgent", weight: 2.0, level: "critical" },
  { word: "critical", weight: 2.0, level: "critical" },
  { word: "immediately", weight: 1.8, level: "critical" },
  { word: "asap", weight: 1.8, level: "critical" },
  { word: "production", weight: 1.5, level: "critical" },
  { word: "blocking", weight: 1.5, level: "high" },
  { word: "blocker", weight: 1.5, level: "high" },
  { word: "important", weight: 1.0, level: "high" },
  { word: "need", weight: 0.5, level: "normal" },
  { word: "please", weight: 0.3, level: "normal" },
  { word: "when possible", weight: 0.2, level: "low" },
  { word: "nice to have", weight: 0.2, level: "low" },
  { word: "eventually", weight: 0.2, level: "low" },
] as const;

/**
 * Emotion detection patterns.
 */
const EMOTION_PATTERNS: ReadonlyArray<{
  emotion: EmotionType;
  patterns: readonly string[];
  intensity: number;
}> = [
  { emotion: "frustration", patterns: ["frustrat", "annoying", "why isn't", "still broken", "not working", "tried everything"], intensity: 0.8 },
  { emotion: "gratitude", patterns: ["thank", "appreciate", "grateful", "thanks so much", "really helped"], intensity: 0.9 },
  { emotion: "confusion", patterns: ["confused", "don't understand", "unclear", "how do i", "what does", "makes no sense"], intensity: 0.7 },
  { emotion: "excitement", patterns: ["excited", "amazing", "can't wait", "love this", "awesome", "incredible"], intensity: 0.8 },
  { emotion: "concern", patterns: ["worried", "concern", "risk", "afraid", "might break", "careful"], intensity: 0.6 },
  { emotion: "satisfaction", patterns: ["works great", "exactly what", "perfect", "well done", "happy with"], intensity: 0.8 },
  { emotion: "disappointment", patterns: ["expected", "should have", "wish", "unfortunately", "disappointing", "let down"], intensity: 0.7 },
  { emotion: "urgency", patterns: ["urgent", "asap", "immediately", "blocking", "critical", "need this now"], intensity: 0.9 },
] as const;

/**
 * Calculates a sentiment score from text using keyword matching.
 *
 * @param text - Text to analyze.
 * @returns Sentiment score from -1 (very negative) to 1 (very positive).
 */
export function calculateSentimentScore(text: string): number {
  const lower = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const { word, weight } of POSITIVE_KEYWORDS) {
    if (lower.includes(word)) {
      positiveScore += weight;
    }
  }

  for (const { word, weight } of NEGATIVE_KEYWORDS) {
    if (lower.includes(word)) {
      negativeScore += weight;
    }
  }

  const total = positiveScore + negativeScore;
  if (total === 0) return 0;

  return (positiveScore - negativeScore) / total;
}

/**
 * Classifies sentiment from a numeric score.
 *
 * @param score - Sentiment score (-1 to 1).
 * @returns Sentiment classification.
 */
export function classifySentiment(score: number): Sentiment {
  if (score > 0.2) return "positive";
  if (score < -0.2) return "negative";
  if (Math.abs(score) <= 0.2 && score !== 0) return "mixed";
  return "neutral";
}

/**
 * Calculates urgency score and level from text.
 *
 * @param text - Text to analyze.
 * @returns Urgency level and score.
 */
export function calculateUrgency(text: string): { level: UrgencyLevel; score: number } {
  const lower = text.toLowerCase();
  let maxLevel: UrgencyLevel = "normal";
  let totalScore = 0;

  const levelOrder: Record<UrgencyLevel, number> = {
    critical: 3,
    high: 2,
    normal: 1,
    low: 0,
  };

  for (const { word, weight, level } of URGENCY_KEYWORDS) {
    if (lower.includes(word)) {
      totalScore += weight;
      if (levelOrder[level] > levelOrder[maxLevel]) {
        maxLevel = level;
      }
    }
  }

  const normalizedScore = Math.min(1, totalScore / 5);

  return { level: maxLevel, score: normalizedScore };
}

/**
 * Detects emotions in text.
 *
 * @param text - Text to analyze.
 * @returns Array of detected emotion indicators.
 */
export function detectEmotions(text: string): EmotionIndicator[] {
  const lower = text.toLowerCase();
  const emotions: EmotionIndicator[] = [];

  for (const { emotion, patterns, intensity } of EMOTION_PATTERNS) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        emotions.push({
          emotion,
          intensity,
          trigger: pattern,
        });
        break;
      }
    }
  }

  return emotions;
}

/**
 * Analyzes sentiment of a single text.
 *
 * @param text - Text to analyze.
 * @returns Complete sentiment analysis result.
 */
export function analyzeSentiment(text: string): SentimentResult {
  const score = calculateSentimentScore(text);
  const sentiment = classifySentiment(score);
  const { level: urgency, score: urgencyScore } = calculateUrgency(text);
  const emotions = detectEmotions(text);

  const isFrustrated = emotions.some((e) => e.emotion === "frustration");
  const isGrateful = emotions.some((e) => e.emotion === "gratitude");

  return {
    sentiment,
    score,
    urgency,
    urgencyScore,
    emotions,
    isFrustrated,
    isGrateful,
  };
}

/**
 * Analyzes sentiment across multiple texts (batch analysis).
 *
 * @param texts - Array of text strings to analyze.
 * @returns Batch sentiment analysis result.
 */
export function analyzeBatchSentiment(texts: readonly string[]): BatchSentimentResult {
  const results = texts.map((t) => analyzeSentiment(t));

  const averageScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;

  const trend = classifySentiment(averageScore);

  const urgencyCounts = new Map<UrgencyLevel, number>();
  for (const result of results) {
    urgencyCounts.set(result.urgency, (urgencyCounts.get(result.urgency) ?? 0) + 1);
  }

  let dominantUrgency: UrgencyLevel = "normal";
  let maxCount = 0;
  for (const [level, count] of urgencyCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominantUrgency = level;
    }
  }

  const positiveCount = results.filter((r) => r.sentiment === "positive").length;
  const negativeCount = results.filter((r) => r.sentiment === "negative").length;

  const summary = `Analyzed ${texts.length} text(s): ` +
    `${positiveCount} positive, ${negativeCount} negative. ` +
    `Overall trend: ${trend}. Average score: ${averageScore.toFixed(2)}.`;

  return {
    results,
    averageScore,
    trend,
    dominantUrgency,
    summary,
  };
}
