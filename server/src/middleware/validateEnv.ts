/**
 * ALAYA INSIDER — Environment Variable Validation
 * --------------------------------------------------------------------------
 * Validates that all required environment variables are set at startup.
 * Prevents silent failures from missing configuration in production.
 *
 * Usage: Import and call validateEnv() at the top of server/src/index.ts.
 * The server will log warnings for missing vars but won't crash,
 * allowing the app to start in development with defaults.
 */

import { writeLog } from "../services/observabilityEngine.js";
import { ENV } from "../db/index.js";

/* ================================================================== */
/*  CONFIG                                                             */
/* ================================================================== */

export interface EnvVarSpec {
  /** Environment variable name (e.g. "JWT_SECRET") */
  name: string;
  /** Whether this is critical for the app to function */
  critical: boolean;
  /** Human-readable description */
  description: string;
  /** Default value in development only */
  devDefault?: string;
  /** Pattern to validate against */
  pattern?: RegExp;
  /** Minimum length */
  minLength?: number;
}

const REQUIRED_VARS: EnvVarSpec[] = [
  // ── Database ──
  { name: "DATABASE_URL", critical: false, description: "PostgreSQL connection string", devDefault: undefined },
  { name: "DB_HOST", critical: false, description: "Database host", devDefault: "localhost" },
  { name: "DB_PORT", critical: false, description: "Database port", devDefault: "5432" },
  { name: "DB_NAME", critical: false, description: "Database name", devDefault: "alaya_insider_development" },
  { name: "DB_USER", critical: false, description: "Database user", devDefault: "postgres" },
  { name: "DB_PASSWORD", critical: false, description: "Database password", devDefault: "postgres" },

  // ── Auth / Secrets ──
  { name: "JWT_SECRET", critical: true, description: "JWT signing secret (min 32 chars)", minLength: 32 },
  { name: "SESSION_SECRET", critical: true, description: "Session encryption secret (min 32 chars)", minLength: 32 },
  { name: "OTP_SECRET", critical: true, description: "OTP encryption secret (min 16 chars)", minLength: 16 },

  // ── Payment Providers ──
  { name: "STRIPE_SECRET_KEY", critical: false, description: "Stripe secret key (sk_live_ or sk_test_)" },
  { name: "STRIPE_WEBHOOK_SECRET", critical: false, description: "Stripe webhook signing secret (whsec_)" },
  { name: "PAYPAL_CLIENT_ID", critical: false, description: "PayPal REST API client ID" },
  { name: "PAYPAL_CLIENT_SECRET", critical: false, description: "PayPal REST API client secret" },

  // ── Email / SMS ──
  { name: "BIRD_API_KEY", critical: false, description: "Bird (MessageBird) API key for email" },
  { name: "TWILIO_ACCOUNT_SID", critical: false, description: "Twilio account SID for SMS" },
  { name: "TWILIO_AUTH_TOKEN", critical: false, description: "Twilio auth token for SMS" },
  { name: "TWILIO_PHONE_NUMBER", critical: false, description: "Twilio sender phone number" },
  { name: "SMTP_HOST", critical: false, description: "SMTP server hostname" },
  { name: "SMTP_PORT", critical: false, description: "SMTP server port", devDefault: "587" },
  { name: "SMTP_USER", critical: false, description: "SMTP username" },
  { name: "SMTP_PASS", critical: false, description: "SMTP password" },

  // ── AI Providers ──
  { name: "OPENAI_API_KEY", critical: false, description: "OpenAI API key" },
  { name: "GEMINI_API_KEY", critical: false, description: "Google Gemini API key" },
  { name: "DEEPSEEK_API_KEY", critical: false, description: "DeepSeek API key" },

  // ── Analytics ──
  { name: "GA4_MEASUREMENT_ID", critical: false, description: "Google Analytics 4 measurement ID (G-XXXXXXXXXX)" },
  { name: "CLARITY_PROJECT_ID", critical: false, description: "Microsoft Clarity project ID" },

  // ── Media ──
  { name: "CLOUDINARY_CLOUD_NAME", critical: false, description: "Cloudinary cloud name" },
  { name: "CLOUDINARY_API_KEY", critical: false, description: "Cloudinary API key" },
  { name: "CLOUDINARY_API_SECRET", critical: false, description: "Cloudinary API secret" },

  // ── OAuth ──
  { name: "GOOGLE_CLIENT_ID", critical: false, description: "Google OAuth client ID" },
  { name: "GOOGLE_CLIENT_SECRET", critical: false, description: "Google OAuth client secret" },
  { name: "APPLE_TEAM_ID", critical: false, description: "Apple Sign-In team ID" },
  { name: "APPLE_KEY_ID", critical: false, description: "Apple Sign-In key ID" },
  { name: "APPLE_CLIENT_ID", critical: false, description: "Apple Sign-In client / service ID" },
];

/* ================================================================== */
/*  VALIDATION FUNCTION                                                */
/* ================================================================== */

export interface ValidationResult {
  valid: boolean;
  missing: { name: string; critical: boolean; description: string }[];
  warnings: string[];
}

/**
 * Validate that all required environment variables are configured.
 * Logs warnings for missing vars. In production, critical vars must be set.
 */
export function validateEnv(): ValidationResult {
  const isProd = ENV === "production";
  const missing: { name: string; critical: boolean; description: string }[] = [];
  const warnings: string[] = [];

  for (const spec of REQUIRED_VARS) {
    const value = process.env[spec.name];

    if (!value) {
      // Allow dev defaults in non-production (use ?? instead of mutating process.env)
      if (!isProd && spec.devDefault !== undefined) {
        continue;
      }

      missing.push({ name: spec.name, critical: spec.critical, description: spec.description });

      if (spec.critical && isProd) {
        warnings.push(`CRITICAL: ${spec.name} (${spec.description}) is not set — app may fail at runtime`);
      } else if (isProd) {
        warnings.push(`WARNING: ${spec.name} (${spec.description}) is not set — feature disabled`);
      }
      continue;
    }

    // Validate length
    if (spec.minLength && value.length < spec.minLength) {
      warnings.push(
        `WARNING: ${spec.name} is too short (${value.length} chars, minimum ${spec.minLength}) — using insecure value`,
      );
    }

    // Validate pattern
    if (spec.pattern && !spec.pattern.test(value)) {
      warnings.push(`WARNING: ${spec.name} does not match expected format — may cause integration failures`);
    }
  }

  // Log results
  if (warnings.length > 0) {
    for (const warning of warnings) {
      writeLog({ level: "warning", message: warning, service: "server", module: "env_validation" }).catch(() => {});
    }
  }

  if (missing.length > 0) {
    console.log(`[ENV] ${missing.length} env var(s) not configured (${missing.filter(m => m.critical).length} critical)`);
  }

  return { valid: missing.filter(m => m.critical).length === 0, missing, warnings };
}
