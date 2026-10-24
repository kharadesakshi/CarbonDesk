/**
 * In-Memory Cache Service
 * Simple, lightweight caching for dashboard stats and frequently accessed data
 * Suitable for single-server deployments
 * 
 * For distributed systems (multiple servers), use Redis instead
 */

export interface CacheOptions {
  ttl?: number; // Time-to-live in milliseconds
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options (ttl in ms)
   */
  static set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || 5 * 60 * 1000; // Default 5 minutes
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, { value, expiresAt });

    // Log cache write
    console.log(`[CACHE] Set: ${key} (expires in ${ttl / 1000}s)`);
  }

  /**
   * Get a value from cache
   * Returns null if key doesn't exist or has expired
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`[CACHE] Expired: ${key}`);
      return null;
    }

    console.log(`[CACHE] Hit: ${key}`);
    return entry.value as T;
  }

  /**
   * Check if key exists and is valid
   */
  static has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get or set pattern
   * Fetches from cache or calls loader function
   */
  static async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, load fresh data
    console.log(`[CACHE] Miss: ${key}, loading...`);
    const value = await loader();

    // Store in cache
    this.set(key, value, options);

    return value;
  }

  /**
   * Delete a key from cache
   */
  static delete(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`[CACHE] Deleted: ${key}`);
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param pattern Regex pattern or simple string to match
   */
  static deletePattern(pattern: string | RegExp): number {
    let deleted = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`[CACHE] Deleted ${deleted} keys matching pattern`);
    }

    return deleted;
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[CACHE] Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    size: number;
    entries: Array<{
      key: string;
      expiresIn: number; // ms until expiry
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, entry.expiresAt - Date.now()),
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Start background cleanup of expired entries
   * Runs every minute by default
   */
  static startCleanup(interval: number = 60 * 1000): void {
    if (this.cleanupInterval) {
      console.log('[CACHE] Cleanup already running');
      return;
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[CACHE] Cleanup: removed ${cleaned} expired entries`);
      }
    }, interval);

    console.log(`[CACHE] Cleanup started (interval: ${interval / 1000}s)`);
  }

  /**
   * Stop background cleanup
   */
  static stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval as NodeJS.Timeout);
      this.cleanupInterval = null;
      console.log('[CACHE] Cleanup stopped');
    }
  }

  /**
   * Cache invalidation helper for related data
   * When a project is updated, invalidate dashboard stats
   */
  static invalidateProject(projectId: string): void {
    this.deletePattern(`dashboard_.*`);
    this.deletePattern(`stats_.*`);
    this.delete(`project_${projectId}`);
    console.log(`[CACHE] Invalidated project-related cache`);
  }

  /**
   * Cache invalidation for participants
   */
  static invalidateParticipants(projectId: string): void {
    this.deletePattern(`participants_${projectId}_.*`);
    this.deletePattern(`dashboard_.*`);
    console.log(`[CACHE] Invalidated participant-related cache`);
  }

  /**
   * Cache invalidation for documents
   */
  static invalidateDocuments(projectId?: string): void {
    if (projectId) {
      this.deletePattern(`documents_${projectId}_.*`);
    } else {
      this.deletePattern(`documents_.*`);
    }
    this.deletePattern(`dashboard_.*`);
    console.log(`[CACHE] Invalidated document-related cache`);
  }
}
