import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { CookieBanner } from "@/components/cookie-banner";
import { getSessionUser } from "@/lib/session";
import {
  DEFAULT_ACCENT,
  DEFAULT_PRESET,
  isAccent,
  isPreset,
  type ThemeAccent,
  type ThemePreset,
} from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "ScheduleHQ — Shift scheduling for teams that run on time",
    template: "%s · ScheduleHQ",
  },
  description:
    "ScheduleHQ is the free, professional shift scheduling platform for restaurants, retail, and service teams. Build schedules, post announcements, and manage your team in one place.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  // Multi-format icon set. The .ico ships first because Chrome auto-requests
  // /favicon.ico for the tab and we want it to find a real file there.
  // PNGs cover modern hi-DPI / PWA / social slots.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icon0.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const c = cookies();
  const cookiePreset = c.get("shq_theme")?.value;
  const cookieAccent = c.get("shq_accent")?.value;
  const consented = c.get("shq_cookie_consent")?.value === "accepted";

  const preset: ThemePreset = isPreset(user?.themePreset)
    ? (user!.themePreset as ThemePreset)
    : isPreset(cookiePreset)
      ? cookiePreset
      : DEFAULT_PRESET;

  const accent: ThemeAccent = isAccent(user?.themeAccent)
    ? (user!.themeAccent as ThemeAccent)
    : isAccent(cookieAccent)
      ? cookieAccent
      : DEFAULT_ACCENT;

  return (
    <html lang="en" data-theme={preset} data-accent={accent} className={inter.variable}>
      <body>
        <ThemeProvider initialPreset={preset} initialAccent={accent}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        {!consented ? <CookieBanner /> : null}
      </body>
    </html>
  );
}
