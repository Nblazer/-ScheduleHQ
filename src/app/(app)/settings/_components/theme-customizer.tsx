"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  THEME_ACCENTS,
  THEME_PRESETS,
  type ThemeAccent,
  type ThemePreset,
} from "@/lib/theme";
import { saveThemeAction } from "../actions";

export function ThemeCustomizer({
  userPreset,
  userAccent,
  orgPreset,
  orgAccent,
  isAdmin,
}: {
  userPreset: string;
  userAccent: string;
  orgPreset: string;
  orgAccent: string;
  isAdmin: boolean;
}) {
  const { preset, accent, setPreset, setAccent } = useTheme();
  const [scope, setScope] = React.useState<"user" | "organization">("user");
  const [pending, start] = React.useTransition();
  const toast = useToast();
  const router = useRouter();

  // Keep local state in sync with provider (user may have changed elsewhere)
  React.useEffect(() => {
    setPreset((userPreset as ThemePreset) ?? "midnight");
    setAccent((userAccent as ThemeAccent) ?? "indigo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <div className="text-sm font-medium mb-3">Theme preset</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={cn(
                "relative rounded-xl border p-3 text-left transition hover:-translate-y-0.5",
                preset === p.id ? "border-primary ring-2 ring-primary/40" : "border-border",
              )}
            >
              <div
                className="h-20 rounded-lg mb-3 relative overflow-hidden"
                style={{ background: p.swatch.bg }}
              >
                <div
                  className="absolute left-2 right-2 top-2 h-2 rounded"
                  style={{ background: p.swatch.card }}
                />
                <div
                  className="absolute left-2 right-6 bottom-2 h-2 rounded"
                  style={{ background: p.swatch.card, opacity: 0.7 }}
                />
              </div>
              <div className="font-medium text-sm">{p.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
              {preset === p.id && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="text-sm font-medium mb-3">Accent</div>
        <div className="flex flex-wrap gap-2">
          {THEME_ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccent(a.id)}
              className={cn(
                "group relative h-10 px-3 rounded-lg border flex items-center gap-2 transition hover:-translate-y-0.5",
                accent === a.id ? "border-primary ring-2 ring-primary/40" : "border-border",
              )}
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ background: a.hex, boxShadow: `0 0 0 3px ${a.hex}33` }}
              />
              <span className="text-sm">{a.label}</span>
              {accent === a.id && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border pt-5">
        <div className="text-sm">
          <div className="font-medium">Save scope</div>
          <div className="text-muted-foreground">
            {isAdmin
              ? "Apply this to your profile only, or set the workspace default for everyone."
              : "This change only applies to your account."}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "user" | "organization")}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
            >
              <option value="user">Just me</option>
              <option value="organization">Workspace default</option>
            </select>
          ) : null}
          <Button
            loading={pending}
            onClick={() =>
              start(async () => {
                const fd = new FormData();
                fd.set("preset", preset);
                fd.set("accent", accent);
                fd.set("scope", scope);
                const r = await saveThemeAction(null, fd);
                if (r.ok) {
                  toast.success("Theme saved.");
                  router.refresh();
                } else toast.error(r.error);
              })
            }
          >
            Save theme
          </Button>
        </div>
      </div>

      {isAdmin && (
        <p className="text-xs text-muted-foreground">
          Workspace default is <span className="font-medium">{orgPreset}</span> /{" "}
          <span className="font-medium">{orgAccent}</span>. Users can override it for themselves.
        </p>
      )}
    </div>
  );
}
