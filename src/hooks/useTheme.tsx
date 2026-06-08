import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
type Applied = "light" | "dark";

interface ThemeCtx {
  mode: ThemeMode;
  applied: Applied;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "shopitt:theme";

function systemPrefers(): Applied {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(applied: Applied) {
  const root = document.documentElement;
  root.classList.toggle("light", applied === "light");
  root.classList.toggle("dark", applied === "dark");
  root.style.colorScheme = applied;
}

function getInitial(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitial);
  const [applied, setApplied] = useState<Applied>(() =>
    getInitial() === "system" ? systemPrefers() : (getInitial() as Applied),
  );

  useEffect(() => {
    const next: Applied = mode === "system" ? systemPrefers() : mode;
    setApplied(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    if (mode === "system" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => {
        const n: Applied = mq.matches ? "light" : "dark";
        setApplied(n);
        apply(n);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggle = useCallback(
    () => setModeState((m) => (m === "dark" ? "light" : "dark")),
    [],
  );

  return (
    <ThemeContext.Provider value={{ mode, applied, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { mode: "dark", applied: "dark", setMode: () => {}, toggle: () => {} };
  }
  return ctx;
}
