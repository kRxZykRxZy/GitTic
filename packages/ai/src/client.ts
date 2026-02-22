import { RateLimiter } from "@platform/utils";

const POLLINATIONS_TEXT_URL = "https://text.pollinations.ai";

export interface AiRequestOptions {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  repoContext?: string;
}

export interface AiResponse {
  content: string;
  model: string;
  timestamp: number;
}

/**
 * Pollinations AI client with rate limiting.
 */
export class PollinationsClient {
  private rateLimiter: RateLimiter;

  constructor(rateLimitPerMinute = 30) {
    this.rateLimiter = new RateLimiter({
      windowMs: 60_000,
      maxRequests: rateLimitPerMinute,
    });
  }

  /**
   * Send a text generation request to Pollinations AI.
   */
  async generate(userId: string, options: AiRequestOptions): Promise<AiResponse> {
    const rateCheck = this.rateLimiter.check(userId);
    if (!rateCheck.allowed) {
      throw new Error(
        `Rate limit exceeded. Retry after ${Math.ceil(rateCheck.retryAfterMs / 1000)}s`
      );
    }

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    if (options.repoContext) {
      messages.push({
        role: "system",
        content: `Repository context:\n${options.repoContext}`,
      });
    }
    messages.push({ role: "user", content: options.prompt });

    const response = await fetch(POLLINATIONS_TEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: options.model || "openai",
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature ?? 0.7,
        jsonMode: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return {
      content: text,
      model: options.model || "openai",
      timestamp: Date.now(),
    };
  }

  /**
   * Check rate limit status for a user.
   */
  checkRateLimit(userId: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    // Peek without consuming
    const entry = this.rateLimiter.check(userId);
    return entry;
  }
}
