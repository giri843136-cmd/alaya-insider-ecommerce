/**
 * ALAYA INSIDER — Typed Hono Context Helpers
 * --------------------------------------------------------------------------
 * Provides typed context accessors that eliminate (c as any) patterns
 * across all route files. Every route handler should use these helpers
 * instead of direct (c as any) casts.
 *
 * Usage:
 *   import { getSession, getRequestId, getTraceId } from "../lib/context.js";
 *
 *   const session = getSession(c);     // returns Session | null
 *   const requestId = getRequestId(c); // returns string
 */

import type { Context } from "hono";

/* ================================================================== */
/*  HONO VARIABLE TYPES                                                */
/* ================================================================== */

export type Variables = {
  requestId: string;
  traceId: string;
  session?: Session;
};

export type AppContext = Context & { var: Variables };

export interface Session {
  id: string;
  userId: string;
  userType: "customer" | "admin";
  token: string;
  browser: string;
  os: string;
  ip: string;
  isTrusted: boolean;
  /** Timestamp as ISO-8601 string or Unix ms number, depending on source. */
  lastActivity: string | number;
  /** Timestamp as ISO-8601 string or Unix ms number. */
  createdAt: string | number;
  /** Timestamp as ISO-8601 string or Unix ms number. */
  expiresAt: string | number;
}

/* ================================================================== */
/*  TYPED ACCESSORS                                                    */
/* ================================================================== */

/** Safely retrieve the authenticated session from Hono context. */
export function getSession(c: Context): Session | null {
  const session = c.get("session") as Session | undefined;
  return session ?? null;
}

/** Safely retrieve the request ID from Hono context. */
export function getRequestId(c: Context): string {
  return (c.get("requestId") as string) || "unknown";
}

/** Safely retrieve the trace ID from Hono context. */
export function getTraceId(c: Context): string {
  return (c.get("traceId") as string) || "unknown";
}

/**
 * Attach a session to the Hono context.
 * This is called after successful authentication.
 */
export function setSession(c: Context, session: Session): void {
  c.set("session", session);
}

/**
 * Standardised error envelope.
 * Builds a consistent error response with requestId, traceId, and timestamp.
 */
export function errorEnvelope(
  c: Context,
  status: number,
  code: string,
  message: string,
  detail?: string,
): Record<string, unknown> {
  const requestId = getRequestId(c);
  const traceId = getTraceId(c);
  return {
    requestId,
    traceId,
    timestamp: new Date().toISOString(),
    status,
    code,
    message,
    ...(detail ? { detail } : {}),
  };
}
