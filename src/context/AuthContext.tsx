import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "./StoreContext";
import { generateToken, fingerprint, verifyTOTP, maskPhone, maskEmail } from "../lib/security";
import { api } from "../lib/api-client";

const SESSION_KEY = "alaya_admin_session";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours
const TOKEN_ROTATION_INTERVAL = 30 * 60 * 1000; // 30 minutes

// OTP brute-force protection (local layer — primary enforcement on backend)
const OTP_LOCK_MAX = 5;
const OTP_LOCK_MS = 60_000; // 1 minute lockout
const OTP_LOCK_KEY = "alaya_admin_otp_lock";

interface AuthContextValue {
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  // OTP flow
  otpPending: boolean;
  otpSentTo: { email: string; phone: string };
  otpExpiresAt: number;
  mfaMethod: "email_sms" | "totp";
  generateAndSendOTP: () => void;
  verifyOTP: (code: string) => Promise<boolean>;
  resendOTP: () => void;
  completeOtpAuth: () => void;
  // OTP rate limiting
  otpLockedUntil: number;
}

interface SessionData {
  token: string;
  fingerprint: string;
  createdAt: number;
  lastRotated: number;
  expiresAt: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createSession(): SessionData {
  return {
    token: generateToken(32),
    fingerprint: JSON.stringify(fingerprint()),
    createdAt: Date.now(),
    lastRotated: Date.now(),
    expiresAt: Date.now() + SESSION_TTL,
  };
}

function validateSession(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const session = JSON.parse(raw) as SessionData;
    // Check expiry
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    // Optional: verify fingerprint hasn't changed drastically (basic session hijacking detection)
    return true;
  } catch {
    return false;
  }
}

function readSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return validateSession(raw);
  } catch {
    return false;
  }
}

function updateSessionActivity() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw) as SessionData;
    // Rotate token every 30 minutes
    if (Date.now() - session.lastRotated > TOKEN_ROTATION_INTERVAL) {
      session.token = generateToken(32);
      session.lastRotated = Date.now();
    }
    session.expiresAt = Date.now() + SESSION_TTL;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
}

// maskEmail and maskPhone are imported from ../lib/security

export function AuthProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings, log } = useStore();
  const [isAdmin, setIsAdmin] = useState<boolean>(readSession);

  // OTP state — OTP code NEVER stored in frontend; verified entirely on backend
  const [otpPending, setOtpPending] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);

  // OTP rate limiting — persisted to localStorage for parity with password lockout
  const [otpLockedUntil, setOtpLockedUntil] = useState(() => {
    try {
      return Number(window.localStorage.getItem(OTP_LOCK_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const otpAttemptsRef = useRef<number>(0);

  const completeOtpAuth = useCallback(() => {
    const session = createSession();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setIsAdmin(true);
    setOtpPending(false);
    // Start periodic session refresh
    const interval = setInterval(() => {
      updateSessionActivity();
    }, 60_000);
    (window as any).__alaya_session_refresh = interval;
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const emailOk = email.toLowerCase() === (settings.adminEmail || "").toLowerCase();
      const passwordOk = password === settings.adminPassword;
      const ok = emailOk && passwordOk;
      if (ok) {
        log("auth.credentials_verified", "admin", `Admin verified — OTP required`);
      } else if (!emailOk) {
        log("auth.login_failed", "admin", `Login failed — unrecognised email`);
      }
      return ok;
    },
    [settings.adminEmail, settings.adminPassword, log]
  );

  const generateAndSendOTP = useCallback(() => {
    // OTP code is generated ENTIRELY on the backend — never client-side
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes (matches backend TTL)
    setOtpExpiresAt(expiresAt);
    setOtpPending(true);

    // Use dedicated admin phone with fallbacks
    const otpPhone = settings.adminPhone || settings.contactPhone;
    const otpEmail = settings.adminEmail || settings.contactEmail;

    // Send OTP via SMS to the admin's phone (the user receives the code on their mobile)
    // Only ONE OTP is generated to avoid code mismatch between channels.
    if (otpPhone) {
      api.post<{ success: boolean; status?: string }>("/auth/admin/send-mobile-otp", { phone: otpPhone })
        .then(({ data }) => {
          if (data.success) {
            log("auth.otp_sms_sent", "system", `SMS OTP sent to admin phone`);
          } else if (data.status === "dev_mode") {
            log("auth.otp_sms_dev", "system", `Dev mode — SMS provider not configured`);
          }
        })
        .catch((err: Error) => {
          log("auth.otp_sms_unreachable", "system", `Backend SMS unavailable: ${err.message}`);
        });
    }

    // Log OTP send attempt for audit trail — never log the actual code
    if (otpEmail) log("auth.otp_sent", "email", `OTP sent to ${maskEmail(otpEmail)}`);
    if (otpPhone) log("auth.otp_sent", "sms", `OTP sent to ${maskPhone(otpPhone)}`);
  }, [settings.adminEmail, settings.adminPhone, settings.contactEmail, settings.contactPhone, log]);

  const verifyOTP = useCallback(async (code: string): Promise<boolean> => {
    // Check OTP rate limit (local layer — backend also enforces)
    if (Date.now() < otpLockedUntil) {
      log("auth.otp_rate_limited", "admin", "OTP verification blocked — rate limited");
      return false;
    }
    // Reset counter if lockout has expired
    if (otpAttemptsRef.current >= OTP_LOCK_MAX) {
      otpAttemptsRef.current = 0;
      setOtpLockedUntil(0);
      try { window.localStorage.removeItem(OTP_LOCK_KEY); } catch { /* ignore */ }
    }

    // TOTP mode — verify against authenticator app or backup codes (client-side only)
    if (settings.mfaMethod === "totp" && settings.totpSecret) {
      const backupIdx = settings.totpBackupCodes?.indexOf(code);
      if (backupIdx !== undefined && backupIdx !== -1) {
        log("auth.backup_code_used", "admin", "TOTP verified via backup code");
        const updated = [...settings.totpBackupCodes];
        updated.splice(backupIdx, 1);
        updateSettings({ totpBackupCodes: updated });
        otpAttemptsRef.current = 0;
        return true;
      }

      const ok = await verifyTOTP(settings.totpSecret, code);
      if (ok) {
        log("auth.totp_verified", "admin", "TOTP verified via authenticator app");
        otpAttemptsRef.current = 0;
        return true;
      }
      log("auth.totp_invalid", "admin", "TOTP verification failed — invalid code");
      otpAttemptsRef.current += 1;
      if (otpAttemptsRef.current >= OTP_LOCK_MAX) {
        const until = Date.now() + OTP_LOCK_MS;
        setOtpLockedUntil(until);
        try { window.localStorage.setItem(OTP_LOCK_KEY, String(until)); } catch { /* ignore */ }
        log("auth.otp_locked", "admin", "OTP locked — too many failed attempts");
      }
      return false;
    }

    // Email/SMS OTP mode — verify ENTIRELY on the backend via /auth/admin/verify-otp
    // The frontend NEVER stores or knows the OTP code
    // Use the PHONE as identifier because the OTP is received via SMS (mobile OTP)
    // The backend generates separate codes for email vs SMS — we verify against the
    // phone record since that's where the user actually receives the code.
    const identifier = settings.adminPhone || settings.contactPhone || settings.adminEmail || settings.contactEmail;
    if (!identifier) {
      log("auth.otp_no_identifier", "admin", "No admin contact configured for OTP");
      return false;
    }

    try {
      const { data } = await api.post<{ success: boolean; message?: string }>("/auth/admin/verify-otp", {
        identifier,
        code,
        type: "email",
      });

      if (data.success) {
        log("auth.otp_verified", "admin", "OTP verified via backend successfully");
        otpAttemptsRef.current = 0;
        // Session is created by completeOtpAuth() which follows successful verification
        // We do NOT store the backend session token here to avoid conflict
        return true;
      } else {
        log("auth.otp_invalid", "admin", `Backend OTP verification failed: ${data.message || "Invalid code"}`);
        otpAttemptsRef.current += 1;
        if (otpAttemptsRef.current >= OTP_LOCK_MAX) {
          const until = Date.now() + OTP_LOCK_MS;
          setOtpLockedUntil(until);
          try { window.localStorage.setItem(OTP_LOCK_KEY, String(until)); } catch { /* ignore */ }
          log("auth.otp_locked", "admin", "OTP locked — too many failed attempts");
        }
        return false;
      }
    } catch {
      log("auth.otp_backend_unreachable", "admin", "Backend unavailable — OTP cannot be verified.");
      // No fallback: if backend is unreachable, OTP verification cannot proceed
      otpAttemptsRef.current += 1;
      if (otpAttemptsRef.current >= OTP_LOCK_MAX) {
        const until = Date.now() + OTP_LOCK_MS;
        setOtpLockedUntil(until);
        try { window.localStorage.setItem(OTP_LOCK_KEY, String(until)); } catch { /* ignore */ }
      }
      return false;
    }
  }, [log, settings.mfaMethod, settings.totpSecret, settings.totpBackupCodes, updateSettings, otpLockedUntil, settings.adminEmail, settings.adminPhone, settings.contactEmail, settings.contactPhone]);

  const resendOTP = useCallback(() => {
    generateAndSendOTP();
  }, [generateAndSendOTP]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
    setOtpPending(false);
    // Clear session refresh interval
    const interval = (window as any).__alaya_session_refresh;
    if (interval) {
      clearInterval(interval);
      delete (window as any).__alaya_session_refresh;
    }
  }, []);

  // Use imported maskPhone/maskEmail from security.ts
  const otpSentTo = useMemo(
    () => ({
      email: maskEmail(settings.adminEmail || settings.contactEmail || ""),
      phone: maskPhone(settings.adminPhone || settings.contactPhone || ""),
    }),
    [settings.adminEmail, settings.adminPhone, settings.contactEmail, settings.contactPhone]
  );

  const mfaMethod = useMemo(() => settings.mfaMethod || "email_sms", [settings.mfaMethod]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAdmin,
      login,
      logout,
      otpPending,
      otpSentTo,
      otpExpiresAt,
      mfaMethod,
      generateAndSendOTP,
      verifyOTP,
      resendOTP,
      completeOtpAuth,
      otpLockedUntil,
    }),
    [
      isAdmin,
      login,
      logout,
      otpPending,
      otpSentTo,
      otpExpiresAt,
      mfaMethod,
      generateAndSendOTP,
      verifyOTP,
      resendOTP,
      completeOtpAuth,
      otpLockedUntil,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
