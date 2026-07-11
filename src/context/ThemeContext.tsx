import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useStore } from "./StoreContext";
import { useLocalStorage } from "../lib/hooks";
import { hexToRgba } from "../lib/utils";
import type { Theme } from "../lib/types";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useStore();
  const [theme, setThemeState] = useLocalStorage<Theme>("alaya_theme", settings.defaultTheme);

  const apply = useCallback(
    (t: Theme) => {
      const root = document.documentElement;
      root.classList.toggle("dark", t === "dark");
      const accent = t === "dark" ? settings.accentDark : settings.accentLight;
      root.style.setProperty("--c-accent", accent);
      root.style.setProperty("--c-accent-soft", hexToRgba(accent, t === "dark" ? 0.16 : 0.1));
      root.style.setProperty("--c-accent-ink", t === "dark" ? "#1a1510" : "#ffffff");
    },
    [settings.accentDark, settings.accentLight]
  );

  useEffect(() => {
    apply(theme);
  }, [theme, apply]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), [setThemeState]);
  const toggleTheme = useCallback(
    () => setThemeState((p) => (p === "dark" ? "light" : "dark")),
    [setThemeState]
  );

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
