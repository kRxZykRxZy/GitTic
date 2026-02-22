import { Router, type Request, type Response, type NextFunction } from "express";
import { PollinationsClient, PROMPTS } from "@platform/ai";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import rateLimit from "express-rate-limit";

/**
 * AI-powered code assistance routes.
 *
 * All endpoints require authentication and are rate-limited
 * to prevent abuse of the AI backend. Uses the Pollinations
 * client for model inference.
 */
const router = Router();

/**
 * Rate limiter specific to AI endpoints.
 * 20 requests per 15-minute window per user.
 */
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.userId ?? req.ip ?? "anonymous",
  message: {
    error: "Too many AI requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

/** Singleton AI client instance. */
let _client: InstanceType<typeof PollinationsClient> | null = null;

/**
 * Get or create the AI client singleton.
 */
function getClient(): InstanceType<typeof PollinationsClient> {
  if (!_client) {
    _client = new PollinationsClient();
  }
  return _client;
}

// Apply auth and rate limiting to all AI routes
router.use(requireAuth, aiRateLimiter);

/**
 * POST /api/ai/explain
 *
 * Explains a code snippet in plain language. Useful for
 * understanding unfamiliar code or onboarding new developers.
 */
router.post(
  "/explain",
  validate([
    { field: "code", location: "body", required: true, type: "string", min: 1, max: 50000 },
    { field: "language", location: "body", type: "string", max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, language } = req.body;
      const client = getClient();

      const options = PROMPTS.codeExplain(code);

      const response = await client.generate(req.user!.userId, options);

      res.json({
        explanation: response.content,
        model: response.model,
        timestamp: response.timestamp,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/ai/bugs
 *
 * Analyses code for potential bugs, security issues, and
 * anti-patterns.
 */
router.post(
  "/bugs",
  validate([
    { field: "code", location: "body", required: true, type: "string", min: 1, max: 50000 },
    { field: "language", location: "body", type: "string", max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, language } = req.body;
      const client = getClient();

      const options = PROMPTS.bugDetect(code);

      const response = await client.generate(req.user!.userId, options);

      res.json({
        analysis: response.content,
        model: response.model,
        timestamp: response.timestamp,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/ai/commit-message
 *
 * Generates a conventional commit message from a diff.
 */
router.post(
  "/commit-message",
  validate([
    { field: "diff", location: "body", required: true, type: "string", min: 1, max: 100000 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { diff } = req.body;
      const client = getClient();

      const options = PROMPTS.commitMessage(diff);

      const response = await client.generate(req.user!.userId, options);

      res.json({
        message: response.content.trim(),
        model: response.model,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/ai/refactor
 *
 * Suggests refactoring improvements for the given code.
 */
router.post(
  "/refactor",
  validate([
    { field: "code", location: "body", required: true, type: "string", min: 1, max: 50000 },
    { field: "language", location: "body", type: "string", max: 50 },
    { field: "instructions", location: "body", type: "string", max: 2000 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, language, instructions } = req.body;
      const client = getClient();

      const extra = instructions ? `\n\nAdditional instructions: ${instructions}` : "";
      const options = PROMPTS.refactorSuggest(code);

      const response = await client.generate(req.user!.userId, options);

      res.json({
        refactored: response.content,
        model: response.model,
        timestamp: response.timestamp,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/ai/chat
 *
 * Free-form AI chat for development questions.
 * Accepts a conversation history for multi-turn dialogues.
 */
router.post(
  "/chat",
  validate([
    { field: "message", location: "body", required: true, type: "string", min: 1, max: 10000 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, context } = req.body;
      const client = getClient();

      const options = PROMPTS.chatWithContext(message, context);

      const response = await client.generate(req.user!.userId, options);

      res.json({
        reply: response.content,
        model: response.model,
        timestamp: response.timestamp,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
