"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserCircle2,
  Building2,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; show?: boolean };

export function SettingsNav({ isAdmin, isOwner }: { isAdmin: boolean; isOwner: boolean }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/settings/account", label: "Account", icon: UserCircle2 },
    { href: "/settings/workspace", label: "Workspace", icon: Building2, show: isAdmin },
    { href: "/settings/workspaces", label: "All workspaces", icon: Layers },
    { href: "/settings/plan", label: "Plan", icon: Sparkles },
    { href: "/settings/danger", label: "Danger zone", icon: AlertTriangle },
  ].filter((i) => i.show !== false);

  return (
    <nav className="lg:sticky lg:top-24 lg:self-start">
      {/* Mobile: horizontal scroll bar */}
      <div className="flex lg:hidden gap-1 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition border",
                active
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <it.icon className="h-3.5 w-3.5" />
              {it.label}
            </Link>
          );
        })}
      </div>
      {/* Desktop: vertical column */}
      <ul className="hidden lg:flex flex-col gap-0.5">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <it.icon className="h-4 w-4" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
