import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "./StoreContext";
import { useLocalStorage } from "../lib/hooks";
import type { Customer } from "../lib/types";

const SESSION_KEY = "alaya_customer_session";

interface AccountContextValue {
  customer: Customer | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  refresh: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

/** Maps the stored session id to the live Customer record from the store. */
export function AccountProvider({ children }: { children: ReactNode }) {
  const { authenticateCustomer, registerCustomer, customers } = useStore();
  const [sessionId, setSessionId] = useLocalStorage<string | null>(SESSION_KEY, null);
  const [nonce, setNonce] = useState(0);

  const customer = useMemo(
    () => (sessionId ? customers.find((c) => c.id === sessionId) ?? null : null),
    [sessionId, customers, nonce]
  );

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const login = useCallback(
    (email: string, password: string) => {
      const found = authenticateCustomer(email, password);
      if (found) {
        setSessionId(found.id);
        return true;
      }
      return false;
    },
    [authenticateCustomer, setSessionId]
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      const created = registerCustomer(name, email, password);
      if (created) {
        setSessionId(created.id);
        return true;
      }
      return false;
    },
    [registerCustomer, setSessionId]
  );

  const logout = useCallback(() => setSessionId(null), [setSessionId]);

  const value = useMemo(
    () => ({ customer, login, register, logout, refresh }),
    [customer, login, register, logout, refresh]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within <AccountProvider>");
  return ctx;
}
