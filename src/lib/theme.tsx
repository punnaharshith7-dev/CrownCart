import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { preloadVenom, venomTransition } from "./venom";

export type ThemePref = "light" | "dark" | "system";
export type MotionPref = "full" | "reduced";

interface ThemeState {
  theme: ThemePref;
  resolved: "light" | "dark";
  setTheme: (t: ThemePref) => void;
  motion: MotionPref;
  setMotion: (m: MotionPref) => void;
}

const ThemeContext = createContext<ThemeState>(null!);

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: preference lasts for this visit only */
  }
};

const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
const systemReduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(() => (read("cc-theme") as ThemePref) || "system");
  const [motion, setMotionState] = useState<MotionPref>(() => (read("cc-motion") as MotionPref) || (systemReduced() ? "reduced" : "full"));
  const [dark, setDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const on = () => setDark(mq.matches);
    mq?.addEventListener("change", on);
    return () => mq?.removeEventListener("change", on);
  }, []);

  const resolved = theme === "system" ? (dark ? "dark" : "light") : theme;

  useEffect(() => {
    preloadVenom();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // The venom snapshots the finished new theme, so skip the colour fade while it plays.
    const fade = !root.classList.contains("venom-active");
    if (fade) root.classList.add("theme-transition");
    root.dataset.theme = resolved;
    root.dataset.motion = motion;
    root.style.colorScheme = resolved;
    const t = setTimeout(() => root.classList.remove("theme-transition"), 300);
    return () => clearTimeout(t);
  }, [resolved, motion]);

  const setTheme = (t: ThemePref) => {
    const next = t === "system" ? (dark ? "dark" : "light") : t;
    const apply = () => {
      // Write the theme straight onto <html> too, so the view-transition snapshot already has it.
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      setThemeState(t);
    };
    // A visible light/dark flip plays the venom; same-look changes (e.g. dark → system-dark) just apply.
    if (next !== resolved && motion !== "reduced") venomTransition(next, apply);
    else apply();
    write("cc-theme", t);
    // Mirror to the account so the choice follows the user across devices.
    fetch("/api/account/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t }) }).catch(() => {});
  };
  const setMotion = (m: MotionPref) => {
    setMotionState(m);
    write("cc-motion", m);
  };

  return <ThemeContext.Provider value={{ theme, resolved, setTheme, motion, setMotion }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Adopt the theme saved on the account after sign-in. */
export function useAccountTheme(pref: ThemePref | undefined) {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (pref && pref !== theme && !read("cc-theme")) setTheme(pref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pref]);
}
