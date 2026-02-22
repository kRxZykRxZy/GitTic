/**
 * Token storage interface and in-memory implementation.
 * Provides a generic token store with support for storing, looking up,
 * revoking, and cleaning up expired tokens.
 * @module tokens/token-store
 */

/**
 * Generic stored token entry.
 */
export interface StoredToken {
  /** Unique token ID */
  id: string;
  /** Token hash or value (depending on implementation) */
  tokenHash: string;
  /** User ID the token belongs to */
  userId: string;
  /** Token type identifier */
  type: string;
  /** Arbitrary metadata associated with the token */
  metadata: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: number;
  /** Expiration timestamp */
  expiresAt: number;
  /** Whether the token has been revoked */
  revoked: boolean;
  /** Revocation timestamp */
  revokedAt: number | null;
}

/**
 * Options for querying tokens.
 */
export interface TokenQueryOptions {
  /** Filter by user ID */
  userId?: string;
  /** Filter by token type */
  type?: string;
  /** Include revoked tokens */
  includeRevoked?: boolean;
  /** Include expired tokens */
  includeExpired?: boolean;
  /** Maximum number of results */
  limit?: number;
  /** Sort by field */
  sortBy?: "createdAt" | "expiresAt";
  /** Sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Token store interface that can be implemented by different backends.
 */
export interface TokenStore {
  /** Store a new token */
  store(token: StoredToken): Promise<void>;
  /** Look up a token by its hash */
  lookupByHash(tokenHash: string): Promise<StoredToken | null>;
  /** Look up a token by its ID */
  lookupById(id: string): Promise<StoredToken | null>;
  /** Revoke a token by ID */
  revokeById(id: string): Promise<boolean>;
  /** Revoke all tokens matching a query */
  revokeAll(query: TokenQueryOptions): Promise<number>;
  /** Query tokens */
  query(options: TokenQueryOptions): Promise<StoredToken[]>;
  /** Clean up expired and revoked tokens */
  cleanup(): Promise<number>;
  /** Count tokens matching a query */
  count(options: TokenQueryOptions): Promise<number>;
}

/**
 * In-memory token store implementation.
 * Suitable for development, testing, and single-instance deployments.
 */
export class InMemoryTokenStore implements TokenStore {
  private readonly tokens = new Map<string, StoredToken>();
  private readonly hashIndex = new Map<string, string>();

  /**
   * Store a new token entry.
   * @param token - Token entry to store
   */
  async store(token: StoredToken): Promise<void> {
    this.tokens.set(token.id, { ...token });
    this.hashIndex.set(token.tokenHash, token.id);
  }

  /**
   * Look up a token by its hash value.
   * @param tokenHash - Hash of the token to find
   * @returns The stored token or null
   */
  async lookupByHash(tokenHash: string): Promise<StoredToken | null> {
    const id = this.hashIndex.get(tokenHash);
    if (!id) {
      return null;
    }
    const token = this.tokens.get(id);
    if (!token) {
      return null;
    }
    if (token.revoked || Date.now() > token.expiresAt) {
      return null;
    }
    return { ...token };
  }

  /**
   * Look up a token by its unique ID.
   * @param id - Token ID
   * @returns The stored token or null
   */
  async lookupById(id: string): Promise<StoredToken | null> {
    const token = this.tokens.get(id);
    return token ? { ...token } : null;
  }

  /**
   * Revoke a token by its ID.
   * @param id - Token ID to revoke
   * @returns True if the token was found and revoked
   */
  async revokeById(id: string): Promise<boolean> {
    const token = this.tokens.get(id);
    if (!token || token.revoked) {
      return false;
    }
    token.revoked = true;
    token.revokedAt = Date.now();
    return true;
  }

  /**
   * Revoke all tokens matching the given query.
   * @param query - Query to match tokens for revocation
   * @returns Number of tokens revoked
   */
  async revokeAll(query: TokenQueryOptions): Promise<number> {
    const matching = await this.query({
      ...query,
      includeRevoked: false,
    });
    let count = 0;
    for (const token of matching) {
      const stored = this.tokens.get(token.id);
      if (stored && !stored.revoked) {
        stored.revoked = true;
        stored.revokedAt = Date.now();
        count++;
      }
    }
    return count;
  }

  /**
   * Query tokens with filtering, sorting, and pagination.
   * @param options - Query options
   * @returns Array of matching tokens
   */
  async query(options: TokenQueryOptions): Promise<StoredToken[]> {
    const now = Date.now();
    let results: StoredToken[] = [];

    for (const token of this.tokens.values()) {
      if (options.userId && token.userId !== options.userId) {
        continue;
      }
      if (options.type && token.type !== options.type) {
        continue;
      }
      if (!options.includeRevoked && token.revoked) {
        continue;
      }
      if (!options.includeExpired && token.expiresAt <= now) {
        continue;
      }
      results.push({ ...token });
    }

    // Sort
    const sortField = options.sortBy ?? "createdAt";
    const sortOrder = options.sortOrder ?? "desc";
    results.sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortOrder === "asc" ? diff : -diff;
    });

    // Limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Remove expired and revoked tokens from the store.
   * @returns Number of tokens removed
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let removed = 0;

    for (const [id, token] of this.tokens) {
      if (token.revoked || token.expiresAt <= now) {
        this.tokens.delete(id);
        this.hashIndex.delete(token.tokenHash);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Count tokens matching a query.
   * @param options - Query options
   * @returns Number of matching tokens
   */
  async count(options: TokenQueryOptions): Promise<number> {
    const results = await this.query(options);
    return results.length;
  }

  /**
   * Get the total number of tokens in the store.
   * @returns Total token count
   */
  size(): number {
    return this.tokens.size;
  }

  /**
   * Clear all tokens from the store.
   */
  clear(): void {
    this.tokens.clear();
    this.hashIndex.clear();
  }
}
