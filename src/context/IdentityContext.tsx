/**
 * ALAYA INSIDER — Identity React Context
 * Bridges the identity.ts data engine to React with state management,
 * auth hooks, session awareness, and automatic re-rendering.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { IdentityUser, AuthSession } from "../lib/identity";
import {
  getUsers, getUser, createUser, updateUser, deleteUser,
  suspendUser, reactivateUser, createInvitation,
  getRoles, getRole, createRole, updateRole, deleteRole,
  getUserPermissions, hasPermission,
  getOrganizations, createOrganization,
  getTeams, createTeam,
  getSessionsForUser, revokeSession, revokeAllSessionsForUser,
  createSession, createApiKey, revokeApiKey, createServiceAccount,
  enableMfa, disableMfa, addTrustedDevice, isDeviceTrusted,
  createBreakGlassAccount, useBreakGlassAccount,
  startImpersonation, stopImpersonation,
  getZeroTrustPolicies, createZeroTrustPolicy,
  getLoginHistory, getIdentityEvents,
  generateComplianceReport, getIdentityAnalytics,
  authenticatePassword, verifyMfa, verifyMagicLink,
  assessRisk, logIdentityEvent,
  AUTH_STORAGE_KEY,
  type AuthResult, type UserType, type MFAType,
  type ZeroTrustPolicy, type IdentityEvent, type LoginHistoryEntry,
  type Organization, type Team, type Role, type ApiKey, type ServiceAccount,
  type BreakGlassAccount, type ImpersonationLog, type RiskAssessment,
} from "../lib/identity";
import { generateToken } from "../lib/security";

/* ================================================================== */
/*  CONTEXT DEFINITION                                                  */
/* ================================================================== */

interface IdentityContextValue {
  /* Users */
  users: IdentityUser[];
  currentUser: IdentityUser | null;
  loading: boolean;

  /* Auth state */
  isAuthenticated: boolean;
  requiresMfa: boolean;
  pendingUserId: string | null;
  activeSession: AuthSession | null;

  /* Auth actions */
  login: (email: string, password: string, deviceName?: string) => AuthResult;
  loginWithMagicLink: (token: string) => IdentityUser | null;
  verifyMfaCode: (code: string) => boolean;
  logout: () => void;
  refreshSession: () => void;

  /* User management */
  fetchUsers: () => void;
  fetchUser: (id: string) => IdentityUser | undefined;
  createNewUser: (input: { email: string; name: string; password: string; type: UserType; roles?: string[]; phone?: string; department?: string; title?: string }) => IdentityUser | null;
  editUser: (id: string, patch: Partial<IdentityUser>) => IdentityUser | null;
  removeUser: (id: string) => boolean;
  suspendUserById: (id: string) => boolean;
  reactivateUserById: (id: string) => boolean;
  inviteUser: (email: string, type: UserType, roles: string[]) => { token: string; expiresAt: number } | null;

  /* Roles */
  roles: Role[];
  fetchRoles: () => void;
  fetchRole: (id: string) => Role | undefined;
  createNewRole: (input: Omit<Role, "id" | "createdAt" | "updatedAt">) => Role;
  editRole: (id: string, patch: Partial<Role>) => Role | null;
  removeRole: (id: string) => boolean;

  /* Permissions */
  getUserPerms: (userId: string) => string[];
  checkPermission: (userId: string, permission: string) => boolean;

  /* Organizations & Teams */
  organizations: Organization[];
  teams: Team[];
  createNewOrg: (input: Omit<Organization, "id" | "createdAt" | "updatedAt">) => Organization;
  createNewTeam: (input: Omit<Team, "id" | "createdAt" | "updatedAt">) => Team;

  /* Sessions */
  fetchSessions: (userId: string) => AuthSession[];
  terminateSession: (id: string) => boolean;
  terminateAllSessions: (userId: string) => boolean;

  /* API Keys & Service Accounts */
  createNewApiKey: (input: { name: string; userId: string; type: "user" | "service_account" | "machine"; permissions?: string[]; allowedIps?: string[]; expiresAt?: number }) => { apiKey: ApiKey; rawKey: string };
  revokeApiKeyById: (id: string) => boolean;
  createNewServiceAccount: (input: { name: string; description: string; type: "api" | "worker" | "ai_agent" | "microservice" | "webhook" | "cli" | "sdk"; roles?: string[]; permissions?: string[] }) => ServiceAccount;

  /* MFA */
  enableMfaForUser: (userId: string, type: MFAType) => { secret?: string; backupCodes: string[] } | null;
  disableMfaForUser: (userId: string) => boolean;
  addTrustedDeviceForUser: (userId: string, name: string, fingerprint: string) => void;
  isDeviceTrustedForUser: (userId: string, fingerprint: string) => boolean;

  /* Risk & Zero Trust */
  assessRisks: (userId: string, ip: string, userAgent: string, fingerprint: string) => RiskAssessment;
  zeroTrustPolicies: ZeroTrustPolicy[];
  createZtPolicy: (input: Omit<ZeroTrustPolicy, "id" | "createdAt" | "updatedAt">) => ZeroTrustPolicy;

  /* Break Glass & Emergency */
  createBreakGlass: (name: string, email: string, reason: string) => BreakGlassAccount;
  useBreakGlass: (id: string, usedBy: string) => boolean;
  startImpersonating: (impersonatorId: string, targetId: string, reason: string) => ImpersonationLog | null;
  stopImpersonating: (id: string) => boolean;

  /* Audit */
  loginHistory: LoginHistoryEntry[];
  identityEvents: IdentityEvent[];
  fetchLoginHistory: (userId?: string, limit?: number) => LoginHistoryEntry[];
  fetchIdentityEvents: (userId?: string, limit?: number) => IdentityEvent[];

  /* Analytics & Reports */
  analytics: ReturnType<typeof getIdentityAnalytics>;
  fetchAnalytics: () => void;
  exportComplianceReport: (userId?: string, startDate?: number, endDate?: number) => string;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

/* ================================================================== */
/*  HOOK: useIdentity                                                   */
/* ================================================================== */

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within <IdentityProvider>");
  return ctx;
}

/* ================================================================== */
/*  PROVIDER COMPONENT                                                 */
/* ================================================================== */

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [, setNonce] = useState(0);
  const [users, setUsers] = useState<IdentityUser[]>(() => getUsers());
  const [roles, setRoles] = useState<Role[]>(() => getRoles());
  const [currentUser, setCurrentUser] = useState<IdentityUser | null>(null);
  const [activeSession, setActiveSession] = useState<AuthSession | null>(null);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>(() => getOrganizations());
  const [teams, setTeams] = useState<Team[]>(() => getTeams());
  const [zeroTrustPolicies, setZeroTrustPolicies] = useState<ZeroTrustPolicy[]>(() => getZeroTrustPolicies());
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [identityEvents, setIdentityEvents] = useState<IdentityEvent[]>([]);
  const [analytics, setAnalytics] = useState(() => getIdentityAnalytics());

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { userId: string; sessionId: string; email: string };
        const user = getUser(data.userId);
        if (user) {
          setCurrentUser(user);
          const sessions = getSessionsForUser(user.id);
          const session = sessions.find((s) => s.id === data.sessionId);
          if (session) {
            setActiveSession(session);
            setRequiresMfa(session.mfaVerified ? false : user.mfaEnabled);
          }
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // Persist session
  const saveSession = useCallback((user: IdentityUser, session: AuthSession) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: user.id, sessionId: session.id, email: user.email }));
    } catch { /* ignore */ }
  }, []);

  const clearSession = useCallback(() => {
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
    setCurrentUser(null);
    setActiveSession(null);
    setRequiresMfa(false);
    setPendingUserId(null);
  }, []);

  /* ================================================================ */
  /*  AUTH ACTIONS                                                     */
  /* ================================================================ */

  const login = useCallback((email: string, password: string, deviceName = "Web Browser"): AuthResult => {
    const result = authenticatePassword(
      email, password,
      "client-resolved",
      navigator.userAgent,
      deviceName,
      navigator.language || "en",
      generateToken(8)
    );

    if (result.success && result.user) {
      if (result.requiresMfa) {
        setRequiresMfa(true);
        setPendingUserId(result.user.id);
      } else if (result.session) {
        setCurrentUser(result.user);
        setActiveSession(result.session);
        saveSession(result.user, result.session);
      }
      refresh();
    }
    return result;
  }, [saveSession, refresh]);

  const loginWithMagicLink = useCallback((token: string): IdentityUser | null => {
    const user = verifyMagicLink(token);
    if (user) {
      const session = createSession({
        userId: user.id,
        type: "magic_link",
        ip: "client-resolved",
        userAgent: navigator.userAgent,
        deviceName: "Magic Link",
        location: navigator.language || "en",
        fingerprint: generateToken(8),
      });
      setCurrentUser(user);
      setActiveSession(session);
      saveSession(user, session);
      refresh();
    }
    return user;
  }, [saveSession, refresh]);

  const verifyMfaCode = useCallback((code: string): boolean => {
    if (!pendingUserId || !activeSession) return false;
    const ok = verifyMfa(pendingUserId, code, activeSession.id);
    if (ok) {
      const user = getUser(pendingUserId);
      if (user) {
        setCurrentUser(user);
        setRequiresMfa(false);
        setPendingUserId(null);
        saveSession(user, activeSession);
        refresh();
      }
    }
    return ok;
  }, [pendingUserId, activeSession, saveSession, refresh]);

  const logout = useCallback(() => {
    if (activeSession) {
      revokeSession(activeSession.id);
      logIdentityEvent("logout", activeSession.userId, currentUser?.email || "unknown", "User logged out");
    }
    clearSession();
    refresh();
  }, [activeSession, currentUser, clearSession, refresh]);

  const refreshSession = useCallback(() => {
    if (currentUser) {
      const fresh = getUser(currentUser.id);
      if (fresh) setCurrentUser(fresh);
    }
    setUsers(getUsers());
    setRoles(getRoles());
    setOrganizations(getOrganizations());
    setTeams(getTeams());
    setZeroTrustPolicies(getZeroTrustPolicies());
    setAnalytics(getIdentityAnalytics());
  }, [currentUser]);

  /* ================================================================ */
  /*  USER MANAGEMENT                                                  */
  /* ================================================================ */

  const fetchUsers = useCallback(() => { setUsers(getUsers()); refresh(); }, [refresh]);
  const fetchUser = useCallback((id: string) => getUser(id), []);

  const createNewUser = useCallback((input: {
    email: string; name: string; password: string; type: UserType;
    roles?: string[]; phone?: string; department?: string; title?: string;
  }) => {
    const result = createUser({ ...input, createdBy: currentUser?.id || "system" });
    if (result) { setUsers(getUsers()); refresh(); }
    return result;
  }, [currentUser, refresh]);

  const editUser = useCallback((id: string, patch: Partial<IdentityUser>) => {
    const result = updateUser(id, patch);
    if (result) { setUsers(getUsers()); refresh(); }
    return result;
  }, [refresh]);

  const removeUser = useCallback((id: string) => {
    const result = deleteUser(id);
    if (result) { setUsers(getUsers()); refresh(); }
    return result;
  }, [refresh]);

  const suspendUserById = useCallback((id: string) => {
    const result = suspendUser(id);
    if (result) { setUsers(getUsers()); refresh(); }
    return result;
  }, [refresh]);

  const reactivateUserById = useCallback((id: string) => {
    const result = reactivateUser(id);
    if (result) { setUsers(getUsers()); refresh(); }
    return result;
  }, [refresh]);

  const inviteUser = useCallback((email: string, type: UserType, roles: string[]) => {
    const result = createInvitation(email, type, roles, currentUser?.id || "system");
    if (result) { setUsers(getUsers()); refresh(); }
    return result;
  }, [currentUser, refresh]);

  /* ================================================================ */
  /*  ROLES                                                            */
  /* ================================================================ */

  const fetchRoles = useCallback(() => { setRoles(getRoles()); refresh(); }, [refresh]);
  const fetchRole = useCallback((id: string) => getRole(id), []);

  const createNewRole = useCallback((input: Omit<Role, "id" | "createdAt" | "updatedAt">) => {
    const role = createRole(input);
    setRoles(getRoles());
    refresh();
    return role;
  }, [refresh]);

  const editRole = useCallback((id: string, patch: Partial<Role>) => {
    const result = updateRole(id, patch);
    if (result) { setRoles(getRoles()); refresh(); }
    return result;
  }, [refresh]);

  const removeRole = useCallback((id: string) => {
    const result = deleteRole(id);
    if (result) { setRoles(getRoles()); refresh(); }
    return result;
  }, [refresh]);

  /* ================================================================ */
  /*  PERMISSIONS                                                      */
  /* ================================================================ */

  const getUserPerms = useCallback((userId: string) => getUserPermissions(userId), []);
  const checkPermission = useCallback((userId: string, permission: string) => hasPermission(userId, permission), []);

  /* ================================================================ */
  /*  ORGS & TEAMS                                                     */
  /* ================================================================ */

  const createNewOrg = useCallback((input: Omit<Organization, "id" | "createdAt" | "updatedAt">) => {
    const org = createOrganization(input);
    setOrganizations(getOrganizations());
    refresh();
    return org;
  }, [refresh]);

  const createNewTeam = useCallback((input: Omit<Team, "id" | "createdAt" | "updatedAt">) => {
    const team = createTeam(input);
    setTeams(getTeams());
    refresh();
    return team;
  }, [refresh]);

  /* ================================================================ */
  /*  SESSIONS                                                         */
  /* ================================================================ */

  const fetchSessions = useCallback((userId: string) => getSessionsForUser(userId), []);

  const terminateUserSession = useCallback((id: string) => {
    const result = revokeSession(id);
    if (result && activeSession?.id === id) clearSession();
    refresh();
    return result;
  }, [activeSession, clearSession, refresh]);

  const terminateAllUserSessions = useCallback((userId: string) => {
    const result = revokeAllSessionsForUser(userId);
    if (result && currentUser?.id === userId) clearSession();
    refresh();
    return result;
  }, [currentUser, clearSession, refresh]);

  /* ================================================================ */
  /*  API KEYS                                                         */
  /* ================================================================ */

  const createNewApiKey = useCallback((input: {
    name: string; userId: string; type: "user" | "service_account" | "machine";
    permissions?: string[]; allowedIps?: string[]; expiresAt?: number;
  }) => {
    const result = createApiKey({ ...input, createdBy: currentUser?.id || "system" });
    refresh();
    return result;
  }, [currentUser, refresh]);

  const revokeApiKeyById = useCallback((id: string) => {
    const result = revokeApiKey(id);
    refresh();
    return result;
  }, [refresh]);

  const createNewServiceAccount = useCallback((input: {
    name: string; description: string; type: "api" | "worker" | "ai_agent" | "microservice" | "webhook" | "cli" | "sdk";
    roles?: string[]; permissions?: string[];
  }) => {
    const result = createServiceAccount({ ...input, createdBy: currentUser?.id || "system" });
    refresh();
    return result;
  }, [currentUser, refresh]);

  /* ================================================================ */
  /*  MFA                                                              */
  /* ================================================================ */

  const enableMfaForUser = useCallback((userId: string, type: MFAType) => {
    const result = enableMfa(userId, type);
    if (result) refresh();
    return result;
  }, [refresh]);

  const disableMfaForUser = useCallback((userId: string) => {
    const result = disableMfa(userId);
    if (result) refresh();
    return result;
  }, [refresh]);

  const addTrustedDeviceForUser = useCallback((userId: string, name: string, fingerprint: string) => {
    addTrustedDevice(userId, name, fingerprint);
    refresh();
  }, [refresh]);

  const isDeviceTrustedForUser = useCallback((userId: string, fingerprint: string) => {
    return isDeviceTrusted(userId, fingerprint);
  }, []);

  /* ================================================================ */
  /*  RISK & ZERO TRUST                                                */
  /* ================================================================ */

  const assessRisks = useCallback((userId: string, ip: string, userAgent: string, fingerprint: string) => {
    return assessRisk(userId, ip, userAgent, fingerprint);
  }, []);

  const createZtPolicy = useCallback((input: Omit<ZeroTrustPolicy, "id" | "createdAt" | "updatedAt">) => {
    const policy = createZeroTrustPolicy(input);
    setZeroTrustPolicies(getZeroTrustPolicies());
    refresh();
    return policy;
  }, [refresh]);

  /* ================================================================ */
  /*  BREAK GLASS & EMERGENCY                                          */
  /* ================================================================ */

  const createBreakGlass = useCallback((name: string, email: string, reason: string) => {
    const account = createBreakGlassAccount(name, email, reason, currentUser?.id || "system");
    refresh();
    return account;
  }, [currentUser, refresh]);

  const useBreakGlass = useCallback((id: string, usedBy: string) => {
    const result = useBreakGlassAccount(id, usedBy);
    refresh();
    return result;
  }, [refresh]);

  const startImpersonating = useCallback((impersonatorId: string, targetId: string, reason: string) => {
    const result = startImpersonation(impersonatorId, targetId, reason);
    refresh();
    return result;
  }, [refresh]);

  const stopImpersonating = useCallback((id: string) => {
    const result = stopImpersonation(id);
    refresh();
    return result;
  }, [refresh]);

  /* ================================================================ */
  /*  AUDIT                                                            */
  /* ================================================================ */

  const fetchLoginHistory = useCallback((userId?: string, limit?: number) => {
    const entries = getLoginHistory(userId, limit);
    setLoginHistory(entries);
    return entries;
  }, []);

  const fetchIdentityEvents = useCallback((userId?: string, limit?: number) => {
    const events = getIdentityEvents(userId, limit);
    setIdentityEvents(events);
    return events;
  }, []);

  /* ================================================================ */
  /*  ANALYTICS & REPORTS                                              */
  /* ================================================================ */

  const fetchAnalytics = useCallback(() => {
    setAnalytics(getIdentityAnalytics());
  }, []);

  const exportComplianceReport = useCallback((userId?: string, startDate?: number, endDate?: number) => {
    return generateComplianceReport(userId, startDate, endDate);
  }, []);

  /* ================================================================ */
  /*  CONTEXT VALUE                                                    */
  /* ================================================================ */

  const value = useMemo<IdentityContextValue>(() => ({
    users,
    currentUser,
    loading,
    isAuthenticated: !!currentUser && !requiresMfa,
    requiresMfa,
    pendingUserId,
    activeSession,
    login,
    loginWithMagicLink,
    verifyMfaCode,
    logout,
    refreshSession,
    fetchUsers,
    fetchUser,
    createNewUser,
    editUser,
    removeUser,
    suspendUserById,
    reactivateUserById,
    inviteUser,
    roles,
    fetchRoles,
    fetchRole,
    createNewRole,
    editRole,
    removeRole,
    getUserPerms: getUserPerms,
    checkPermission,
    organizations,
    teams,
    createNewOrg,
    createNewTeam,
    fetchSessions,
    terminateSession: terminateUserSession,
    terminateAllSessions: terminateAllUserSessions,
    createNewApiKey,
    revokeApiKeyById,
    createNewServiceAccount,
    enableMfaForUser,
    disableMfaForUser,
    addTrustedDeviceForUser,
    isDeviceTrustedForUser,
    assessRisks,
    zeroTrustPolicies,
    createZtPolicy,
    createBreakGlass,
    useBreakGlass,
    startImpersonating,
    stopImpersonating,
    loginHistory,
    identityEvents,
    fetchLoginHistory,
    fetchIdentityEvents,
    analytics,
    fetchAnalytics,
    exportComplianceReport,
  }), [
    users, currentUser, loading, requiresMfa, pendingUserId, activeSession,
    login, loginWithMagicLink, verifyMfaCode, logout, refreshSession,
    fetchUsers, fetchUser, createNewUser, editUser, removeUser,
    suspendUserById, reactivateUserById, inviteUser,
    roles, fetchRoles, fetchRole, createNewRole, editRole, removeRole,
    getUserPerms, checkPermission,
    organizations, teams, createNewOrg, createNewTeam,
    fetchSessions, terminateUserSession, terminateAllUserSessions,
    createNewApiKey, revokeApiKeyById, createNewServiceAccount,
    enableMfaForUser, disableMfaForUser, addTrustedDeviceForUser, isDeviceTrustedForUser,
    assessRisks, zeroTrustPolicies, createZtPolicy,
    createBreakGlass, useBreakGlass, startImpersonating, stopImpersonating,
    loginHistory, identityEvents, fetchLoginHistory, fetchIdentityEvents,
    analytics, fetchAnalytics, exportComplianceReport,
  ]);

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}
