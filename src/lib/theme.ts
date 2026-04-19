// Theme presets and accent colors. Themes drive CSS variables in <html data-theme data-accent>.
// Values consumed by src/app/globals.css.

export type ThemePreset = "midnight" | "daylight" | "slate" | "mocha";
export type ThemeAccent = "indigo" | "violet" | "emerald" | "amber" | "rose" | "sky";

export const THEME_PRESETS: {
  id: ThemePreset;
  label: string;
  description: string;
  // For preview swatches only — actual values live in globals.css.
  swatch: { bg: string; fg: string; card: string };
}[] = [
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep, focused dark — the default for a reason.",
    swatch: { bg: "#0b0d14", fg: "#f1f5f9", card: "#151824" },
  },
  {
    id: "daylight",
    label: "Daylight",
    description: "Crisp white canvas for bright workspaces.",
    swatch: { bg: "#f7f8fc", fg: "#0b0d14", card: "#ffffff" },
  },
  {
    id: "slate",
    label: "Slate",
    description: "Muted steel grays with cool undertones.",
    swatch: { bg: "#121722", fg: "#e2e8f0", card: "#1a2030" },
  },
  {
    id: "mocha",
    label: "Mocha",
    description: "Warm espresso tones, easy on the eyes.",
    swatch: { bg: "#1a1411", fg: "#f5ebe0", card: "#241a15" },
  },
];

export const THEME_ACCENTS: { id: ThemeAccent; label: string; hex: string }[] = [
  { id: "indigo", label: "Indigo", hex: "#6366f1" },
  { id: "violet", label: "Violet", hex: "#8b5cf6" },
  { id: "emerald", label: "Emerald", hex: "#10b981" },
  { id: "amber", label: "Amber", hex: "#f59e0b" },
  { id: "rose", label: "Rose", hex: "#f43f5e" },
  { id: "sky", label: "Sky", hex: "#0ea5e9" },
];

export const DEFAULT_PRESET: ThemePreset = "midnight";
export const DEFAULT_ACCENT: ThemeAccent = "indigo";

export function isPreset(v: string | undefined): v is ThemePreset {
  return !!v && THEME_PRESETS.some((p) => p.id === v);
}

export function isAccent(v: string | undefined): v is ThemeAccent {
  return !!v && THEME_ACCENTS.some((a) => a.id === v);
}
