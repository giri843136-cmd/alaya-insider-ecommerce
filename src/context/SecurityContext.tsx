import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fingerprint, generateToken, type SessionFingerprint } from "../lib/security";

/** A recorded login / security event. */
export interface SecurityEvent {
  id: string;
  ts: number;
  type: "login" | "logout" | "failed_login" | "permission_change" | "suspicious" | "lockdown" | "backup" | "export" | "config";
  actor: string;
  detail: string;
  fp?: Partial<SessionFingerprint>;
}

/** An active admin session. */
export interface AdminSession {
  id: string;
  actor: string;
  loginAt: number;
  lastActivity: number;
  fp: SessionFingerprint;
}

const EVENTS_KEY = "alaya_security_events";
const MAX_EVENTS = 200;

function readEvents(): SecurityEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]") as SecurityEvent[];
  } catch {
    return [];
  }
}

interface SecurityContextValue {
  events: SecurityEvent[];
  sessions: AdminSession[];
  csrfToken: string;
  log: (type: SecurityEvent["type"], actor: string, detail: string, fp?: Partial<SessionFingerprint>) => void;
  registerSession: (actor: string) => void;
  terminateSession: (id: string) => void;
  terminateAll: () => void;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<SecurityEvent[]>(readEvents);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  // CSRF token is generated once per page load and stable across the session.
  const [csrfToken] = useState(() => generateToken(32));
  const currentFp = useMemo(() => fingerprint(), []);

  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
    } catch {
      /* ignore */
    }
  }, [events]);

  const log = useCallback<SecurityContextValue["log"]>((type, actor, detail, fp) => {
    setEvents((prev) => [
      { id: generateToken(8), ts: Date.now(), type, actor, detail, fp },
      ...prev,
    ].slice(0, MAX_EVENTS));
  }, []);

  const registerSession = useCallback(
    (actor: string) => {
      const session: AdminSession = {
        id: generateToken(8),
        actor,
        loginAt: Date.now(),
        lastActivity: Date.now(),
        fp: currentFp,
      };
      setSessions((prev) => [session, ...prev.filter((s) => s.actor !== actor)]);
      log("login", actor, "Signed in", currentFp);
    },
    [currentFp, log]
  );

  const terminateSession = useCallback(
    (id: string) => {
      const s = sessions.find((x) => x.id === id);
      setSessions((prev) => prev.filter((x) => x.id !== id));
      if (s) log("logout", s.actor, "Session terminated");
    },
    [sessions, log]
  );

  const terminateAll = useCallback(() => {
    sessions.forEach((s) => log("logout", s.actor, "Session terminated (all)"));
    setSessions([]);
  }, [sessions, log]);

  const value = useMemo<SecurityContextValue>(
    () => ({ events, sessions, csrfToken, log, registerSession, terminateSession, terminateAll }),
    [events, sessions, csrfToken, log, registerSession, terminateSession, terminateAll]
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurity must be used within <SecurityProvider>");
  return ctx;
}
