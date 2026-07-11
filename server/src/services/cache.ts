/**
 * ALAYA INSIDER — Enterprise Cache Platform (PR-11)
 * --------------------------------------------------------------------------
 * Redis-ready caching layer with multiple cache stores, TTL management,
 * invalidation rules, and warmup strategies.
 *
 * Stores:
 *  - MemoryCache:  In-memory LRU cache (primary, no Redis dependency)
 *  - QueryCache:   SQL query result caching
 *  - SearchCache:  Search result caching with TTL
 *  - RecCache:     Recommendation result caching
 *  - AffiliateCache: Affiliate link/data caching
 *  - PriceCache:   Price intelligence caching
 *  - SessionCache: Session data caching
 *  - SettingsCache: Settings & feature flag caching
 */

/* ================================================================== */
/*  MEMORY CACHE (LRU)                                                 */
/* ================================================================== */

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
  tags: string[];
}

export class MemoryCache {
  private store: Map<string, CacheEntry>;
  private maxSize: number;
  private defaultTTL: number; // ms
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize = 10000, defaultTTLMs = 300_000) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLMs;
  }

  get<T = any>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    entry.hits++;
    this.hits++;
    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  set(key: string, value: any, ttlMs?: number, tags?: string[]): void {
    // Evict if at capacity
    if (this.store.size >= this.maxSize) {
      // Delete least recently used (first entry)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
      createdAt: Date.now(),
      hits: 0,
      tags: tags || [],
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  get size(): number {
    return this.store.size;
  }

  get stats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 10000) / 100 : 0,
      keys: [...this.store.keys()],
    };
  }
}

/* ================================================================== */
/*  CACHE MANAGER — Centralized cache orchestration                    */
/* ================================================================== */

export class CacheManager {
  public memory: MemoryCache;
  public search: MemoryCache;
  public recommendations: MemoryCache;
  public affiliate: MemoryCache;
  public price: MemoryCache;
  public session: MemoryCache;
  public settings: MemoryCache;
  public query: MemoryCache;

  constructor() {
    this.memory = new MemoryCache(10000, 300_000);     // 5 min default
    this.search = new MemoryCache(5000, 60_000);        // 1 min (fresh search results)
    this.recommendations = new MemoryCache(2000, 600_000); // 10 min
    this.affiliate = new MemoryCache(1000, 900_000);    // 15 min
    this.price = new MemoryCache(1000, 1_800_000);      // 30 min
    this.session = new MemoryCache(5000, 3_600_000);    // 1 hour
    this.settings = new MemoryCache(500, 600_000);      // 10 min
    this.query = new MemoryCache(2000, 120_000);         // 2 min (SQL query cache)
  }

  /** Clear all caches */
  clearAll(): void {
    this.memory.clear();
    this.search.clear();
    this.recommendations.clear();
    this.affiliate.clear();
    this.price.clear();
    this.session.clear();
    this.settings.clear();
    this.query.clear();
  }

  /** Warm critical caches with initial data */
  async warmup(getters: {
    search?: () => Promise<any>;
    recommendations?: () => Promise<any>;
    settings?: () => Promise<any>;
    filters?: () => Promise<any>;
  }): Promise<{ warmed: string[] }> {
    const warmed: string[] = [];

    const tasks: Promise<void>[] = [];

    if (getters.settings) {
      tasks.push(
        getters.settings().then((data) => {
          this.settings.set("settings", data, 600_000, ["settings"]);
          warmed.push("settings");
        }).catch(() => {}),
      );
    }

    if (getters.filters) {
      tasks.push(
        getters.filters().then((data) => {
          this.search.set("filters", data, 120_000, ["filters"]);
          warmed.push("search-filters");
        }).catch(() => {}),
      );
    }

    if (getters.recommendations) {
      tasks.push(
        getters.recommendations().then((data) => {
          this.recommendations.set("trending", data, 600_000, ["trending"]);
          warmed.push("trending");
        }).catch(() => {}),
      );
    }

    await Promise.allSettled(tasks);
    return { warmed };
  }

  /** Get all cache stats */
  getStats(): Record<string, any> {
    return {
      memory: this.memory.stats,
      search: this.search.stats,
      recommendations: this.recommendations.stats,
      affiliate: this.affiliate.stats,
      price: this.price.stats,
      session: this.session.stats,
      settings: this.settings.stats,
      query: this.query.stats,
      total_entries: this.memory.size + this.search.size + this.recommendations.size +
        this.affiliate.size + this.price.size + this.session.size + this.settings.size + this.query.size,
    };
  }
}

// Singleton
export const cacheManager = new CacheManager();

/* ================================================================== */
/*  CACHE HELPER FUNCTIONS                                             */
/* ================================================================== */

/** Smart cache wrapper: cache-first with background refresh */
export async function cached<T>(
  cache: MemoryCache,
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number,
  tags?: string[],
  staleWhileRevalidate = true,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    // Background refresh if stale while revalidate and entry is half-expired
    if (staleWhileRevalidate) {
      const entry = (cache as any).store?.get(key) as CacheEntry<T> | undefined;
      if (entry && Date.now() > entry.expiresAt - (ttlMs ?? 300_000) / 2) {
        fetcher().then((fresh) => {
          cache.set(key, fresh, ttlMs, tags);
        }).catch(() => {});
      }
    }
    return cached;
  }

  const fresh = await fetcher();
  cache.set(key, fresh, ttlMs, tags);
  return fresh;
}

/** Invalidate caches by entity type (for data change events) */
export function invalidateEntity(entityType: string, entityId?: string): void {
  const tag = entityId ? `${entityType}:${entityId}` : entityType;
  cacheManager.search.invalidateByTag(tag);
  cacheManager.recommendations.invalidateByTag(tag);
  cacheManager.memory.invalidateByTag(tag);
  cacheManager.query.invalidateByTag(tag);
}

/** Invalidate all cache types that depend on product data */
export function invalidateProductData(): void {
  cacheManager.search.clear();
  cacheManager.recommendations.clear();
  cacheManager.price.clear();
  cacheManager.affiliate.clear();
}

/** TTL constants in milliseconds */
export const TTL = {
  SECOND: 1000,
  MINUTE: 60_000,
  FIVE_MINUTES: 300_000,
  TEN_MINUTES: 600_000,
  FIFTEEN_MINUTES: 900_000,
  THIRTY_MINUTES: 1_800_000,
  HOUR: 3_600_000,
  DAY: 86_400_000,
} as const;
