/**
 * Simple in-memory cache utility
 * In production, this can be replaced with Redis for distributed caching
 */

interface CacheEntry<T> {
  value: T;
  expireAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private defaultTTL = 300; // 5 minutes default

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expireAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const ttl = options?.ttl || this.defaultTTL;
    const expireAt = Date.now() + ttl * 1000;

    this.store.set(key, {
      value,
      expireAt,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Delete entries matching a pattern
   */
  deletePattern(pattern: string | RegExp): number {
    let deleted = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.store.size,
      entries: Array.from(this.store.keys()),
    };
  }
}

// Export singleton instance
export const cache = new Cache();

// Cache keys for products
export const CACHE_KEYS = {
  PRODUCTS_LIST: 'products:list',
  PRODUCT_DETAIL: (id: string) => `product:${id}`,
  CATEGORIES: 'categories:list',
  CATEGORIES_WITH_PRODUCTS: 'categories:with-products',
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};
