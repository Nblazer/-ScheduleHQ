"use client";

import * as React from "react";
import type { ThemeAccent, ThemePreset } from "@/lib/theme";

type Ctx = {
  preset: ThemePreset;
  accent: ThemeAccent;
  setPreset: (p: ThemePreset) => void;
  setAccent: (a: ThemeAccent) => void;
};

const ThemeCtx = React.createContext<Ctx | null>(null);

export function useTheme() {
  const c = React.useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used within <ThemeProvider>");
  return c;
}

export function ThemeProvider({
  initialPreset,
  initialAccent,
  children,
}: {
  initialPreset: ThemePreset;
  initialAccent: ThemeAccent;
  children: React.ReactNode;
}) {
  const [preset, setPresetState] = React.useState<ThemePreset>(initialPreset);
  const [accent, setAccentState] = React.useState<ThemeAccent>(initialAccent);

  const apply = React.useCallback((p: ThemePreset, a: ThemeAccent) => {
    const html = document.documentElement;
    html.setAttribute("data-theme", p);
    html.setAttribute("data-accent", a);
    document.cookie = `shq_theme=${p}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.cookie = `shq_accent=${a}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);

  const setPreset = React.useCallback(
    (p: ThemePreset) => {
      setPresetState(p);
      apply(p, accent);
    },
    [accent, apply],
  );

  const setAccent = React.useCallback(
    (a: ThemeAccent) => {
      setAccentState(a);
      apply(preset, a);
    },
    [preset, apply],
  );

  // On mount, re-apply in case cookie drifted from SSR (e.g., after login).
  React.useEffect(() => {
    apply(preset, accent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ThemeCtx.Provider value={{ preset, accent, setPreset, setAccent }}>{children}</ThemeCtx.Provider>;
}
