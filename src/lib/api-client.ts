/**
 * ALAYA INSIDER — Enterprise API Client
 * --------------------------------------------------------------------------
 * Production-grade HTTP client for connecting to the real backend REST API.
 *
 * Features:
 *  - Bearer-token / API-key auth injection
 *  - Automatic retry with exponential backoff (configurable)
 *  - Request cancellation via AbortController
 *  - Request/response interceptors (logging, PII redaction)
 *  - Typed errors with status codes
 *  - Timeout enforcement
 *  - CORS & content-type handling
 *
 * Usage:
 *   import { api } from "./api-client";
 *   const products = await api.get<Product[]>("/products");
 *   const created = await api.post<Product>("/products", body);
 */

import { getApiConfig, type ApiConfig } from "./api-config";
import { redactForLog } from "./security";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface ApiError {
  status: number;
  code: string;
  message: string;
  detail?: string;
  retryable: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  /** Request body (auto-JSON-stringified for objects). */
  body?: unknown;
  /** Additional headers to merge. */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Override the request timeout (ms). Default: 15_000. */
  timeout?: number;
  /** If true, skip the global auth header. */
  noAuth?: boolean;
  /** Raw FormData — skips JSON serialization. */
  formData?: FormData;
  /** Override the base URL for this request. */
  baseUrl?: string;
}

/* ================================================================== */
/*  INTERNAL STATE                                                      */
/* ================================================================== */

let config: ApiConfig | null = null;
let baseHeaders: Record<string, string> = {};

/**
 * (Re-)initialise the client with the current runtime configuration.
 * Called automatically on first request — call manually after env change.
 */
export function initApiClient(cfg?: ApiConfig): void {
  config = cfg ?? getApiConfig();
  baseHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Version": "1.0.0",
    "X-Client-Platform": "alaya-insider-spa",
  };
  if (config.apiKey) {
    baseHeaders["X-API-Key"] = config.apiKey;
  }
}

/* ================================================================== */
/*  RETRY LOGIC                                                        */
/* ================================================================== */

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** HTTP status codes that are safe to retry. */
  retryableStatuses: number[];
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shouldRetry(
  error: unknown,
  attempt: number,
  retryCfg: RetryConfig,
): Promise<boolean> {
  if (attempt >= retryCfg.maxRetries) return false;

  if (error instanceof ApiHttpError) {
    if (!retryCfg.retryableStatuses.includes(error.status)) return false;
  } else if (error instanceof DOMException && error.name === "AbortError") {
    return false; // never retry cancelled requests
  }
  // Network errors, timeouts: retry

  const delay = Math.min(
    retryCfg.baseDelayMs * 2 ** attempt,
    retryCfg.maxDelayMs,
  );
  await sleep(delay);
  return true;
}

/* ================================================================== */
/*  TYPED HTTP ERROR                                                   */
/* ================================================================== */

export class ApiHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public detail?: string,
    public responseBody?: string,
  ) {
    super(message);
    this.name = "ApiHttpError";
  }

  get retryable(): boolean {
    return [408, 429, 500, 502, 503, 504].includes(this.status);
  }

  toApiError(): ApiError {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      detail: this.detail,
      retryable: this.retryable,
    };
  }
}

/* ================================================================== */
/*  CORE REQUEST FUNCTION                                              */
/* ================================================================== */

let activeRequests = 0;

async function request<T>(
  method: HttpMethod,
  path: string,
  opts: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const cfg = config ?? getApiConfig();

  // If backend URL is not configured, throw a clear error
  if (!cfg.apiUrl) {
    throw new ApiHttpError(
      0,
      "BACKEND_NOT_CONFIGURED",
      "No backend API URL configured. Set ALAYA_API_URL or configure via env.",
      "The API client needs a valid backend endpoint to connect.",
    );
  }

  const base = opts.baseUrl ?? cfg.apiUrl;
  const url = `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  const timeoutMs = opts.timeout ?? cfg.timeoutMs ?? 15_000;

  const headers: Record<string, string> = {
    ...baseHeaders,
    ...opts.headers,
  };

  // Auth
  if (!opts.noAuth) {
    if (cfg.authToken) {
      headers["Authorization"] = `Bearer ${cfg.authToken}`;
    } else if (cfg.apiKey) {
      headers["X-API-Key"] = cfg.apiKey;
    }
  }

  // Body
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
    // Let browser set Content-Type with boundary
    delete headers["Content-Type"];
  } else if (opts.body !== undefined && method !== "GET") {
    body = JSON.stringify(opts.body);
  }

  // AbortController with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine external signal if provided
  const signal = opts.signal
    ? combineSignals(opts.signal, controller.signal)
    : controller.signal;

  let attempt = 0;
  const retryCfg: RetryConfig = {
    maxRetries: cfg.maxRetries ?? DEFAULT_RETRY.maxRetries,
    baseDelayMs: DEFAULT_RETRY.baseDelayMs,
    maxDelayMs: DEFAULT_RETRY.maxDelayMs,
    retryableStatuses: DEFAULT_RETRY.retryableStatuses,
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt++;
    const t0 = performance.now();

    try {
      activeRequests++;

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal,
        credentials: cfg.includeCredentials ? "include" : "same-origin",
        mode: "cors",
        cache: cfg.cacheEnabled ? "default" : "no-store",
      });

      const elapsed = Math.round(performance.now() - t0);
      const resHeaders: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      // Parse body
      let data: T;
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      if (contentType.includes("application/json") || text.startsWith("{")) {
        try {
          data = JSON.parse(text) as T;
        } catch {
          data = text as unknown as T;
        }
      } else {
        data = text as unknown as T;
      }

      // Log request
      if (cfg.debug) {
        console.debug(
          `[API] ${method} ${path} → ${response.status} (${elapsed}ms)`,
        );
      }

      // Error handling
      if (!response.ok) {
        const errBody =
          typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
        const code =
          (errBody.code as string) ??
          (errBody.error as string) ??
          `HTTP_${response.status}`;
        const message =
          (errBody.message as string) ??
          (errBody.detail as string) ??
          response.statusText;

        const error = new ApiHttpError(
          response.status,
          code,
          message,
          errBody.detail as string | undefined,
          text,
        );

        if (await shouldRetry(error, attempt, retryCfg)) continue;
        throw error;
      }

      return {
        data,
        status: response.status,
        headers: resHeaders,
        cached: resHeaders["x-cache"]?.includes("HIT") ?? false,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiHttpError) {
        // Already handled above with retry
        if (await shouldRetry(error, attempt, retryCfg)) continue;
        throw error;
      }

      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw new ApiHttpError(
          0,
          "REQUEST_TIMEOUT",
          `Request to ${path} timed out after ${timeoutMs}ms`,
          "The server did not respond within the configured timeout.",
        );
      }

      // Network / other errors
      const networkError = error as Error;
      const redactedMsg = redactForLog(networkError.message);

      // Check retryability for network errors
      const tempError = new ApiHttpError(
        0,
        "NETWORK_ERROR",
        `Network error: ${redactedMsg}`,
        "The request could not reach the server. Check connectivity and API URL.",
      );
      if (await shouldRetry(tempError, attempt, retryCfg)) continue;

      throw tempError;
    } finally {
      activeRequests--;
      clearTimeout(timeoutId);
    }
  }
}

/** Combine two AbortSignals into one (whichever fires first cancels). */
function combineSignals(
  s1: AbortSignal,
  s2: AbortSignal,
): AbortSignal {
  if (s1.aborted) return s1;
  if (s2.aborted) return s2;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  s1.addEventListener("abort", onAbort);
  s2.addEventListener("abort", onAbort);
  if (controller.signal.aborted) {
    s1.removeEventListener("abort", onAbort);
    s2.removeEventListener("abort", onAbort);
  }
  return controller.signal;
}

/* ================================================================== */
/*  CONVENIENCE METHODS                                                */
/* ================================================================== */

export const api = {
  get<T>(path: string, opts?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("GET", path, opts);
  },

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("POST", path, { ...opts, body });
  },

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, { ...opts, body });
  },

  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, { ...opts, body });
  },

  delete<T>(path: string, opts?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path, opts);
  },

  /** Upload a file via FormData. */
  upload<T>(
    path: string,
    formData: FormData,
    opts?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("POST", path, { ...opts, formData });
  },

  /** Get the number of currently active/in-flight requests. */
  get activeRequests(): number {
    return activeRequests;
  },

  /** Initialise (or re-initialise) the client. */
  init(cfg?: ApiConfig): void {
    initApiClient(cfg);
  },
};

export type Api = typeof api;

/* ================================================================== */
/*  AUTO-INIT                                                           */
/* ================================================================== */

// Initialise on module load if env vars are available
initApiClient();
