import { Router, type Request, type Response, type NextFunction } from "express";
import { optionalAuth } from "../middleware/auth-guard.js";
import * as searchRepo from "../db/repositories/search-repo.js";

/**
 * Search routes.
 *
 * Provides full-text search across repositories, code, and users
 * via FTS5, as well as a trending projects endpoint.
 */
const router = Router();

/** Maximum results per page. */
const MAX_PER_PAGE = 100;
const DEFAULT_PER_PAGE = 20;
const DEFAULT_PAGE = 1;

/**
 * Valid search type filters.
 * Maps to the `type` column in the search_index table.
 */
const VALID_TYPES = ["repo", "user", "code"] as const;
type SearchType = (typeof VALID_TYPES)[number];

/**
 * Parse and clamp pagination query parameters.
 */
function parsePagination(query: Record<string, unknown>): { page: number; perPage: number } {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(query.perPage) || DEFAULT_PER_PAGE));
  return { page, perPage };
}

/**
 * GET /api/search
 *
 * Full-text search endpoint. Accepts a query string `q` and an
 * optional `type` filter (repo, user, code).
 *
 * Results are ranked by a combination of FTS5 relevance score
 * and the computed trending score from `search_meta`.
 *
 * @query q    - The search query (required, min 1 character).
 * @query type - Optional type filter: repo | user | code.
 * @query page - Page number (default 1).
 * @query perPage - Results per page (default 20, max 100).
 *
 * @example
 * GET /api/search?q=react&type=repo&page=1&perPage=10
 */
router.get("/", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (!q || q.length === 0) {
      res.status(400).json({
        error: "Search query parameter 'q' is required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    // Validate type filter
    const typeFilter = req.query.type as string | undefined;
    if (typeFilter && !(VALID_TYPES as readonly string[]).includes(typeFilter)) {
      res.status(400).json({
        error: `Invalid type filter. Must be one of: ${VALID_TYPES.join(", ")}`,
        code: "VALIDATION_ERROR",
      });
      return;
    }

    const { page, perPage } = parsePagination(req.query as Record<string, unknown>);

    const results = searchRepo.search(q, {
      page,
      perPage,
      type: typeFilter as SearchType | undefined,
    });

    res.json({
      data: results.map((r) => ({
        id: r.entityId,
        type: r.type,
        title: r.title,
        // Truncate content preview to 200 characters
        preview: r.content.length > 200 ? r.content.slice(0, 200) + "…" : r.content,
        score: r.score,
        rank: r.rank,
      })),
      pagination: { page, perPage },
      query: q,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/trending
 *
 * Returns trending repositories based on stars, clones, and
 * recency. Uses the pre-computed trending scores from
 * `search_meta`.
 *
 * @query limit - Number of results (default 20, max 100).
 */
router.get("/trending", (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(MAX_PER_PAGE, Math.max(1, Number(req.query.limit) || DEFAULT_PER_PAGE));

    // Search for all repos sorted by score (descending)
    // We use a broad match to get all indexed repos
    const results = searchRepo.search("*", {
      page: 1,
      perPage: limit,
      type: "repo",
    });

    // If FTS wildcard search doesn't return results, fall back
    // to a direct query sorted by score
    if (results.length === 0) {
      const { getDb } = require("../db/connection.js");
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT si.entity_id, si.type, si.title, si.content,
                  COALESCE(sm.score, 0) AS score,
                  COALESCE(sm.updated_at, '') AS updated_at
           FROM search_index si
           LEFT JOIN search_meta sm ON si.entity_id = sm.entity_id
           WHERE si.type = 'repo'
           ORDER BY sm.score DESC
           LIMIT ?`,
        )
        .all(limit) as Array<{
        entity_id: string;
        type: string;
        title: string;
        content: string;
        score: number;
        updated_at: string;
      }>;

      const trending = rows.map((r) => ({
        id: r.entity_id,
        type: r.type,
        title: r.title,
        preview: r.content.length > 200 ? r.content.slice(0, 200) + "…" : r.content,
        score: r.score,
      }));

      res.json({ data: trending });
      return;
    }

    // Sort by score descending (trending score)
    const sorted = [...results].sort((a, b) => b.score - a.score);

    res.json({
      data: sorted.map((r) => ({
        id: r.entityId,
        type: r.type,
        title: r.title,
        preview: r.content.length > 200 ? r.content.slice(0, 200) + "…" : r.content,
        score: r.score,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
