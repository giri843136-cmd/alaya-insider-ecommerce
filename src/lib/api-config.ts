/**
 * ALAYA INSIDER — API Configuration
 * --------------------------------------------------------------------------
 * Provides runtime configuration for the backend API connection.
 *
 * Configuration source priority:
 *  1. Runtime window.__ALAYA_CONFIG__ (injected via index.html at deploy time)
 *  2. Environment variables (import.meta.env.VITE_*)
 *  3. localStorage (user-configured in Settings > Developer)
 *  4. Defaults (localStorage fallback only)
 */

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface ApiConfig {
  /** Base URL of the backend REST API (e.g. https://api.alayainsider.com/v1). */
  apiUrl: string;

  /** Bearer token for JWT/OAuth2 authentication. */
  authToken?: string;

  /** Alternative: API key for X-API-Key authentication. */
  apiKey?: string;

  /** Request timeout in milliseconds. Default: 15_000. */
  timeoutMs: number;

  /** Maximum number of automatic retries. Default: 3. */
  maxRetries: number;

  /** Whether to send credentials (cookies) with cross-origin requests. */
  includeCredentials: boolean;

  /** Enable response caching. Default: true. */
  cacheEnabled: boolean;

  /** Debug logging to console. */
  debug: boolean;

  /** Feature flag: use localStorage fallback when API is unreachable. */
  localStorageFallback: boolean;
}

/* ================================================================== */
/*  DEFAULTS                                                           */
/* ================================================================== */

const DEFAULT_CONFIG: ApiConfig = {
  apiUrl: "https://alaya-insider-api-production.up.railway.app/api/v1",
  authToken: undefined,
  apiKey: undefined,
  timeoutMs: 15_000,
  maxRetries: 3,
  includeCredentials: false,
  cacheEnabled: true,
  debug: false,
  localStorageFallback: true,
};

const STORAGE_KEY = "alaya_api_config";

/* ================================================================== */
/*  LOADERS                                                            */
/* ================================================================== */

/**
 * Try to read runtime config injected via window.__ALAYA_CONFIG__.
 * This is set from the server side at deploy time.
 */
function loadRuntimeConfig(): Partial<ApiConfig> | null {
  try {
    const runtime =
      typeof window !== "undefined" &&
      (window as unknown as Record<string, unknown>).__ALAYA_CONFIG__;
    if (runtime && typeof runtime === "object") {
      return runtime as Partial<ApiConfig>;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Load user-configured API settings from localStorage.
 * Note: Vite env vars (import.meta.env) are not available at runtime
 * when using vite-plugin-singlefile since the code is inlined.
 * Use DEFAULT_CONFIG or window.__ALAYA_CONFIG__ instead.
 */
function loadLocalStorageConfig(): Partial<ApiConfig> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Partial<ApiConfig>;
    }
  } catch {
    // ignore
  }
  return null;
}

/* ================================================================== */
/*  PUBLIC API                                                         */
/* ================================================================== */

/**
 * Get the effective API configuration by merging all sources.
 * Priority: runtime → env → localStorage → defaults.
 */
export function getApiConfig(): ApiConfig {
  const runtime = loadRuntimeConfig();
  const local = loadLocalStorageConfig();

  return {
    ...DEFAULT_CONFIG,
    ...runtime,
    ...local,
  };
}

/**
 * Persist API configuration to localStorage (for the Settings UI).
 * Overwrites previous saved config entirely.
 */
export function saveApiConfig(config: Partial<ApiConfig>): void {
  try {
    const existing = loadLocalStorageConfig() ?? {};
    const merged = { ...existing, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore quota errors
  }
}

/**
 * Clear persisted API configuration from localStorage.
 */
export function clearApiConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Check if the API has been configured with a valid URL.
 */
export function isApiConfigured(): boolean {
  const cfg = getApiConfig();
  return Boolean(cfg.apiUrl && cfg.apiUrl.startsWith("http"));
}

/**
 * Get the display-friendly name of the current API configuration state.
 */
export function getApiStatus(): {
  configured: boolean;
  mode: "remote" | "local" | "hybrid";
  url: string;
} {
  const cfg = getApiConfig();
  const configured = Boolean(cfg.apiUrl);
  return {
    configured,
    mode: configured
      ? cfg.localStorageFallback
        ? "hybrid"
        : "remote"
      : "local",
    url: cfg.apiUrl || "localStorage (no backend)",
  };
}
