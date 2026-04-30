"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_NAME = "shq_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = React.useState(false);

  // The server doesn't render the banner if the consent cookie is already set.
  // On the client we double-check (handles edge case where user clears cookies
  // mid-session) and show if not present.
  React.useEffect(() => {
    const has = document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!has) setVisible(true);
  }, []);

  const accept = () => {
    document.cookie = `${COOKIE_NAME}=accepted; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-[80] animate-slide-up">
      <div className="rounded-xl border border-border bg-card shadow-2xl p-4 sm:p-5 flex gap-3 items-start">
        <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm">Cookies, transparently</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            ScheduleHQ uses only essential cookies — your login session and your theme
            preference. No tracking, no ads, no third-party analytics. By continuing
            you accept these.{" "}
            <Link href="/legal/cookies" className="text-primary hover:underline">
              Details
            </Link>
            .
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={accept}>
              Got it
            </Button>
            <Link href="/legal/privacy">
              <Button size="sm" variant="ghost">
                Privacy policy
              </Button>
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={accept}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
