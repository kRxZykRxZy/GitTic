// Existing exports
export { PollinationsClient } from "./client.js";
export type { AiRequestOptions, AiResponse } from "./client.js";
export { PROMPTS } from "./prompts.js";

// Core
export {
  DEFAULT_AI_CONFIG,
  DEFAULT_TEMPERATURE_PRESETS,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  getTemperatureForTask,
  createAiConfig,
  calculateRetryDelay,
  validateAiConfig,
} from "./config.js";
export type {
  AiConfig,
  TemperaturePresets,
  RetryConfig,
  RateLimitConfig,
} from "./config.js";

export {
  MODEL_REGISTRY,
  getModel,
  getAvailableModels,
  selectModel,
  compareCostTiers,
  getModelsByProvider,
} from "./models.js";
export type {
  ModelDefinition,
  ModelCapabilities,
  CostTier,
  ModelSelectionCriteria,
} from "./models.js";

export {
  DEFAULT_CONTEXT_OPTIONS,
  matchesPattern,
  prioritizeFiles,
  formatPackageSection,
  formatCommitsSection,
  formatFilesSection,
  buildRepoContext,
  parsePackageJson,
} from "./context.js";
export type {
  ContextFile,
  ContextCommit,
  PackageMetadata,
  ContextBuildOptions,
  RepoContext,
} from "./context.js";

export {
  DEFAULT_CONVERSATION_CONFIG,
  createMessage,
  ConversationManager,
} from "./conversation.js";
export type {
  MessageRole,
  ConversationMessage,
  ConversationConfig,
  SerializedConversation,
} from "./conversation.js";

export {
  DEFAULT_STREAM_CONFIG,
  parseSSELine,
  extractContentFromSSE,
  ChunkBuffer,
  splitSSELines,
  StreamAccumulator,
  createStreamError,
} from "./streaming.js";
export type {
  StreamChunk,
  StreamConfig,
  StreamHandlers,
  StreamResult,
  StreamError,
} from "./streaming.js";

export {
  DEFAULT_CACHE_CONFIG,
  generateCacheKey,
  ResponseCache,
} from "./cache.js";
export type { CacheEntry, CacheConfig, CacheStats } from "./cache.js";

// Analysis
export {
  parseLogLine,
  detectBuildTool,
  generateFixSuggestions,
  analyzeBuildFailure,
} from "./analysis/build-failure.js";
export type {
  BuildErrorSeverity,
  BuildError,
  BuildFix,
  BuildAnalysisResult,
} from "./analysis/build-failure.js";

export {
  DEFAULT_REVIEW_OPTIONS,
  parseDiff,
  matchesFilePattern,
  assessRiskLevel,
  countBySeverity as countReviewBySeverity,
  countByCategory,
  filterComments,
  buildReviewPrompt,
  generateReviewSummary,
} from "./analysis/code-review.js";
export type {
  ReviewSeverity,
  ReviewCategory,
  ReviewComment,
  DiffHunk as ReviewDiffHunk,
  ReviewOptions,
  ReviewResult,
} from "./analysis/code-review.js";

export {
  estimateCyclomaticComplexity,
  estimateNestingDepth,
  countFunctions,
  assessChangeImpact,
  identifyRiskFactors,
  classifyRiskLevel,
  generateRecommendations,
  assessRisk,
} from "./analysis/risk-assessment.js";
export type {
  RiskLevel,
  RiskFactor,
  RiskCategory,
  ComplexityMetrics,
  ChangeImpact,
  RiskAssessmentResult,
} from "./analysis/risk-assessment.js";

export {
  extractExports,
  extractImports,
  detectUnusedImports,
  detectUnreachableCode,
  detectEmptyBlocks,
  analyzeDeadCode,
} from "./analysis/dead-code.js";
export type {
  DeadCodeType,
  DeadCodeFinding,
  DeadCodeAnalysisResult,
  ExportInfo,
  ImportInfo,
} from "./analysis/dead-code.js";

export {
  analyzeLine,
  analyzeFilePerformance,
  calculateHealthScore,
  analyzePerformance,
} from "./analysis/performance.js";
export type {
  PerformanceSeverity,
  PerformanceCategory,
  PerformanceFinding,
  PerformanceAnalysisResult,
} from "./analysis/performance.js";

export {
  scanLine,
  scanFile,
  calculateSecurityScore,
  countBySeverity as countSecurityBySeverity,
  scanForVulnerabilities,
} from "./analysis/security-scan.js";
export type {
  SecuritySeverity,
  SecurityCategory,
  SecurityFinding,
  SecurityScanResult,
} from "./analysis/security-scan.js";

// Generation
export {
  parseDiffHunks,
  detectCommitType,
  detectScope,
  detectBreakingChange,
  summarizeDiff,
  generateCommitMessage,
  buildCommitMessagePrompt,
  DEFAULT_COMMIT_CONFIG,
} from "./generation/commit-message.js";
export type {
  CommitType,
  DiffHunk as CommitDiffHunk,
  DiffSummary,
  GeneratedCommitMessage,
  CommitMessageConfig,
} from "./generation/commit-message.js";

export {
  categorizeFile,
  detectChangeType,
  groupIntoAreas,
  detectBreakingChanges,
  assessTestCoverage,
  generatePrSummary,
} from "./generation/pr-summary.js";
export type {
  AffectedArea as PrAffectedArea,
  BreakingChange,
  TestCoverageNote,
  FileChange,
  PrSummary,
} from "./generation/pr-summary.js";

export {
  extractFunctions,
  parseParams,
  extractInterfaces,
  generateFunctionJsDoc,
  generateInterfaceJsDoc,
  generateDocsForFile,
  DEFAULT_DOC_OPTIONS,
} from "./generation/doc-generator.js";
export type {
  FunctionSignature,
  ParamInfo,
  InterfaceInfo,
  PropertyInfo,
  GeneratedDoc,
  DocGenerationOptions,
} from "./generation/doc-generator.js";

export {
  DEFAULT_README_CONFIG,
  generateTitleSection,
  generateDescriptionSection,
  generateInstallationSection,
  getInstallCommand,
  generateUsageSection,
  generateApiSection,
  generateScriptsSection,
  generateLicenseSection,
  generateToc,
  generateReadme,
} from "./generation/readme-generator.js";
export type {
  ProjectInfo,
  ApiMember,
  ReadmeConfig,
  ReadmeSection,
} from "./generation/readme-generator.js";

export {
  DEFAULT_TYPE_TITLES,
  DEFAULT_CHANGELOG_CONFIG,
  parseConventionalCommit,
  groupCommitsByType,
  formatCommitLine,
  generateReleaseEntry,
  generateChangelogHeader,
  generateChangelog,
  parseCommitLog,
} from "./generation/changelog.js";
export type {
  ParsedCommit,
  CommitGroup,
  ReleaseEntry,
  ChangelogConfig,
} from "./generation/changelog.js";

export {
  extractTestTargets,
  parseTestParams,
  suggestTestCases,
  generateSampleValue,
  generateMock,
  generateTestFile,
  DEFAULT_TEST_CONFIG,
} from "./generation/test-generator.js";
export type {
  TestTarget,
  TestParam,
  TestCase,
  TestCategory,
  GeneratedMock,
  TestGenConfig,
  GeneratedTestFile,
} from "./generation/test-generator.js";

// Assistant
export {
  identifyKeyFiles,
  detectPrimaryLanguage,
  detectPackageManager,
  detectMonorepo,
  generateSetupSteps,
  generateOnboardingGuide,
} from "./assistant/onboarding.js";
export type {
  KeyFile,
  FileCategory,
  ProjectStructure,
  OnboardingGuide,
  SetupStep,
} from "./assistant/onboarding.js";

export {
  parseStackTrace,
  parseError,
  explainError,
  formatExplanation,
} from "./assistant/error-explainer.js";
export type {
  StackFrame,
  ParsedError,
  ErrorExplanation,
} from "./assistant/error-explainer.js";

export {
  detectLongFunctions,
  detectExcessiveParams,
  detectComplexConditionals,
  detectDuplicateBlocks,
  calculateMetrics,
  analyzeForRefactoring,
} from "./assistant/refactor-advisor.js";
export type {
  RefactorType,
  RefactorPriority,
  RefactorSuggestion,
  CodeQualityMetrics,
  RefactorAnalysisResult,
} from "./assistant/refactor-advisor.js";

export {
  TOPIC_REGISTRY,
  generateProgressiveHints,
  createStepByStepExplanation,
  lookupTopic,
  getRecommendedTopics,
  adaptSkillLevel,
  generateTutoringResponse,
} from "./assistant/tutor.js";
export type {
  SkillLevel,
  TeachingTopic,
  TopicCategory as TutorTopicCategory,
  ProgressiveHint,
  ExplanationStep,
  Exercise,
  TutoringResponse,
} from "./assistant/tutor.js";

export {
  detectLanguages,
  detectFrameworks,
  classifyArchitecture,
  detectModules,
  findEntryPoints,
  summarizeProject,
} from "./assistant/project-summarizer.js";
export type {
  TechStack,
  LanguageUsage,
  ArchitectureType,
  ProjectModule,
  ProjectSummary,
} from "./assistant/project-summarizer.js";

// Tagging
export {
  scoreKeywords,
  detectType,
  detectPriority,
  detectAffectedAreas,
  generateLabels,
  autoTag,
} from "./tagging/auto-tagger.js";
export type {
  IssueType,
  PriorityLevel,
  AffectedArea as TaggerAffectedArea,
  TaggingResult,
  TaggingInput,
} from "./tagging/auto-tagger.js";

export {
  detectByExtension,
  detectByShebang,
  detectBySyntax,
  detectByKeywords,
  detectLanguage,
} from "./tagging/language-detector.js";
export type {
  DetectedLanguage,
  DetectionMethod,
  PolyglotResult,
} from "./tagging/language-detector.js";

export {
  scoreTopicRule,
  detectFullStack,
  generateTags,
  classifyTopics,
} from "./tagging/topic-classifier.js";
export type {
  TopicCategory as ClassifierTopicCategory,
  ClassifiedTopic,
  ClassificationInput,
  ClassificationResult,
} from "./tagging/topic-classifier.js";

export {
  calculateSentimentScore,
  classifySentiment,
  calculateUrgency,
  detectEmotions,
  analyzeSentiment,
  analyzeBatchSentiment,
} from "./tagging/sentiment-analyzer.js";
export type {
  Sentiment,
  UrgencyLevel,
  SentimentResult,
  EmotionIndicator,
  EmotionType,
  BatchSentimentResult,
} from "./tagging/sentiment-analyzer.js";

// Utilities
export {
  estimateTokenCount,
  estimateTokensDetailed,
  checkContextWindow,
  truncateToTokenLimit,
  truncateAdvanced,
  detectCodeContent,
  estimateMessageTokens,
  DEFAULT_TRUNCATE_OPTIONS,
} from "./utils/token-counter.js";
export type {
  TokenEstimate,
  ContextWindowCheck,
  TruncationStrategy,
  TruncateOptions,
} from "./utils/token-counter.js";

export {
  extractVariableNames,
  substituteVariables,
  formatFewShotExamples,
  PromptBuilder,
  DEFAULT_PROMPT_CONFIG,
  createCodingPrompt,
} from "./utils/prompt-builder.js";
export type {
  PromptVariable,
  FewShotExample,
  PromptSection,
  PromptBuilderConfig,
  CompiledPrompt,
} from "./utils/prompt-builder.js";

export {
  extractCodeBlocks,
  extractCodeBlockByLanguage,
  stripCodeBlocks,
  parseMarkdownSections,
  extractListItems,
  extractJson,
  cleanResponse,
  parseResponse,
  extractField,
  splitIntoChunks,
} from "./utils/response-parser.js";
export type {
  CodeBlock,
  MarkdownSection,
  ListItem,
  ParsedResponse,
} from "./utils/response-parser.js";

export {
  estimateCost,
  CostTracker,
  MODEL_PRICING,
  DEFAULT_BUDGET_CONFIG,
} from "./utils/cost-tracker.js";
export type {
  UsageRecord,
  UserUsageSummary,
  BudgetConfig,
  BudgetCheck,
  ModelPricing,
} from "./utils/cost-tracker.js";
