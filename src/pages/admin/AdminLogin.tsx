import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Smartphone, Clock, RotateCcw, KeyRound, AtSign } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSecurity } from "../../context/SecurityContext";
import { Seo } from "../../components/Seo";

const LOCK_KEY = "alaya_admin_lock";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

function OtpInput({
  length,
  onComplete,
  disabled,
}: {
  length: number;
  onComplete: (code: string) => void;
  disabled: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [values, setValues] = useState<string[]>(Array(length).fill(""));

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    // Auto-advance to next input
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit on complete
    const code = next.join("");
    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setValues(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
    if (pasted.length === length) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          className={`h-12 w-11 rounded-xl border text-center text-lg font-semibold tracking-widest transition-all duration-150
            ${disabled
              ? "border-line bg-surface2/50 text-muted cursor-not-allowed"
              : val
                ? "border-accent bg-accent-soft/30 text-ink shadow-sm"
                : "border-line bg-surface2 text-ink hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            } outline-none`}
        />
      ))}
    </div>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, login, otpPending, otpSentTo, otpExpiresAt, mfaMethod, generateAndSendOTP, verifyOTP, resendOTP, completeOtpAuth, otpLockedUntil } = useAuth();
  const { registerSession, log } = useSecurity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(() => {
    try {
      return Number(window.localStorage.getItem(LOCK_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const [now, setNow] = useState(Date.now());

  // OTP stage state
  const [stage, setStage] = useState<"password" | "otp">("password");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpTimer, setOtpTimer] = useState(0);

  // Countdown for lock
  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  // Countdown for OTP expiry
  useEffect(() => {
    if (!otpPending) return;
    const t = setInterval(() => {
      const remaining = Math.max(0, otpExpiresAt - Date.now());
      setOtpTimer(remaining);
      if (remaining <= 0) {
        setOtpError("OTP has expired. Request a new one.");
      }
    }, 250);
    return () => clearInterval(t);
  }, [otpPending, otpExpiresAt]);

  // OTP lockout countdown
  const [otpLockedNow, setOtpLockedNow] = useState(Date.now());
  useEffect(() => {
    if (otpLockedUntil <= Date.now()) return;
    const t = setInterval(() => setOtpLockedNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [otpLockedUntil]);

  const isOtpLocked = otpLockedUntil > otpLockedNow;
  const otpLockRemaining = Math.ceil((otpLockedUntil - otpLockedNow) / 1000);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Admin credentials: alayainsider@gmail.com / Alaya@1923

  // Redirect if already authenticated
  useEffect(() => {
    if (isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, navigate]);

  // Auto-redirect when OTP is verified and auth completes
  useEffect(() => {
    if (otpSuccess) {
      completeOtpAuth();
      registerSession("admin");
      navigate("/admin", { replace: true });
    }
  }, [otpSuccess, completeOtpAuth, registerSession, navigate]);

  const isLocked = lockedUntil > now;
  const remaining = Math.ceil((lockedUntil - now) / 1000);

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (login(email, password)) {
      setError("");
      try {
        window.localStorage.removeItem(LOCK_KEY);
      } catch { /* ignore */ }

      // Enter 2FA stage — generate OTP for email/SMS, skip for TOTP (codes from authenticator app)
      if (mfaMethod !== "totp") {
        generateAndSendOTP();
      }
      setStage("otp");
      setAttempts(0);
      setPassword("");
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_MS;
        setLockedUntil(until);
        try {
          window.localStorage.setItem(LOCK_KEY, String(until));
        } catch { /* ignore */ }
        setError(`Too many attempts. Locked for 30 seconds.`);
        log("failed_login", "admin", "Account locked after 5 failed attempts");
      } else {
        setError(`Invalid credentials. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} remaining.`);
      }
      log("failed_login", "admin", `Failed login attempt ${next}/${MAX_ATTEMPTS}`);
      setPassword("");
    }
  };

  const handleOtpComplete = useCallback(
    async (code: string) => {
      setOtpError("");
      try {
        const ok = await verifyOTP(code);
        if (ok) {
          setOtpSuccess(true);
        } else {
          setOtpError("Invalid code. Please try again.");
        }
      } catch {
        setOtpError("Verification failed. Please try again.");
      }
    },
    [verifyOTP]
  );

  const handleResend = () => {
    if (resendCooldown > 0) return;
    resendOTP();
    setOtpError("");
    setResendCooldown(30);
  };

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Seo title="Admin sign in" path="/admin/login" />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-5">
        <div className="absolute inset-0 bg-luxe" aria-hidden="true" />
        <div className="relative w-full max-w-md animate-scale-in">
          <div className="card p-8 sm:p-10">
            {/* ── Icon ── */}
            <div className="flex flex-col items-center text-center">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl transition-all duration-500 ${
                stage === "otp" ? "bg-accent-soft text-accent scale-110" : "bg-accent-soft text-accent"
              }`}>
                {stage === "password" ? (
                  <Lock className="h-7 w-7" />
                ) : otpSuccess ? (
                  <ShieldCheck className="h-7 w-7" />
                ) : (
                  <KeyRound className="h-7 w-7" />
                )}
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold text-ink">
                {stage === "password" ? "Admin access" : otpSuccess ? "Verified" : "Two-factor verification"}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {stage === "password"
                  ? "Sign in to manage your store, products and orders."
                  : otpSuccess
                    ? "Redirecting to admin panel…"
                    : mfaMethod === "totp"
                      ? "Open your authenticator app and enter the 6-digit code."
                      : "Enter the verification code sent to your contact methods."}
              </p>
            </div>

            {/* ── Stage 1: Email + Password ── */}
            {stage === "password" && (
              <form onSubmit={submitPassword} className="mt-7 space-y-4" noValidate>
                <div>
                  <label className="label-field" htmlFor="admin-email">Admin email</label>
                  <div className="relative">
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLocked}
                      autoFocus
                      autoComplete="new-email"
                      className="input-field pl-10"
                      placeholder="Enter your admin email"
                    />
                    <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </div>
                <div>
                  <label className="label-field" htmlFor="pwd">Password</label>
                  <div className="relative">
                    <input
                      id="pwd"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLocked}
                      autoComplete="new-password"
                      className="input-field pr-11"
                      placeholder="Enter admin password"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className={`rounded-lg px-3 py-2 text-xs ${isLocked ? "bg-danger/10 text-danger" : "bg-danger/10 text-danger"}`} role="alert">
                    {isLocked ? `Locked. Try again in ${remaining}s.` : error}
                  </p>
                )}

                <button type="submit" disabled={isLocked || !email || !password} className="btn-primary btn-md w-full">
                  {isLocked ? `Locked (${remaining}s)` : "Sign in"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* ── Stage 2: OTP / TOTP ── */}
            {stage === "otp" && !otpSuccess && (
              <div className="mt-7 space-y-6">
                {/* Contact info / Authenticator app indicator */}
                {mfaMethod === "totp" ? (
                  <div className="space-y-2 rounded-xl bg-surface2 p-4 text-center">
                    <KeyRound className="mx-auto h-6 w-6 text-accent" />
                    <p className="text-sm text-ink">Authenticator app</p>
                    <p className="text-xs text-muted">Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)</p>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl bg-surface2 p-4 text-center">
                    <Smartphone className="mx-auto h-6 w-6 text-accent" />
                    <p className="text-sm text-ink">Verification code sent to:</p>
                    <p className="text-sm font-medium text-ink">{otpSentTo.phone}</p>
                    <p className="text-xs text-muted">Enter the 6-digit code sent to your mobile number.</p>
                  </div>
                )}

                {/* OTP lockout banner */}
                {isOtpLocked && (
                  <div className="rounded-lg bg-danger/10 px-3 py-2.5 text-center text-xs text-danger" role="alert">
                    Too many failed attempts. OTP verification locked for <span className="font-semibold">{otpLockRemaining}s</span>.
                  </div>
                )}

                {/* OTP input */}
                <div className="space-y-4">
                  <OtpInput
                    length={6}
                    onComplete={handleOtpComplete}
                    disabled={isOtpLocked || (mfaMethod === "email_sms" && otpTimer <= 0)}
                  />

                  {/* Backup code hint (TOTP only) */}
                  {mfaMethod === "totp" && (
                    <p className="text-center text-xs text-muted">
                      You can also use a recovery code if you've lost access to your authenticator app.
                    </p>
                  )}

                  {/* Timer (email/SMS only) */}
                  {mfaMethod === "email_sms" && otpTimer > 0 && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      Code expires in <span className={`font-semibold ${otpTimer < 30000 ? "text-danger" : "text-ink"}`}>{formatTime(otpTimer)}</span>
                    </div>
                  )}
                  {mfaMethod === "email_sms" && otpTimer <= 0 && (
                    <p className="text-center text-xs text-danger">Code expired — request a new one below.</p>
                  )}
                </div>

                {/* OTP error */}
                {otpError && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger text-center" role="alert">
                    {otpError}
                  </p>
                )}

                {/* Resend & back (email/SMS only) */}
                {mfaMethod === "email_sms" ? (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setStage("password");
                        setOtpError("");
                      }}
                      className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                    >
                      ← Back to password
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="btn-ghost btn-sm flex items-center gap-1.5 text-xs"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStage("password");
                        setOtpError("");
                      }}
                      className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                    >
                      ← Back to password
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Admin credentials info ── */}
            {stage === "password" && (
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-accent/30 bg-accent-soft/20 px-4 py-3">
                  <p className="flex items-start gap-2 text-xs text-ink">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>
                      Use your admin credentials to sign in.
                      <br />
                      Go to <strong>Settings → Security</strong> to update your password or add a mobile number for OTP verification.
                    </span>
                  </p>
                </div>

              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/" className="hover:text-accent">← Back to store</Link>
          </p>
        </div>
      </div>
    </>
  );
}
