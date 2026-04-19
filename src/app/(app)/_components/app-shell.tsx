"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Megaphone,
  Inbox,
  Users,
  Settings,
  LayoutDashboard,
  Menu,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import { LogoMark } from "@/components/logo";
import { OrgSwitcher } from "./org-switcher";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";
};

const RANK = { OWNER: 4, ADMIN: 3, MANAGER: 2, EMPLOYEE: 1 } as const;

const NAV: Item[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/reports", label: "Reports", icon: Inbox },
  { href: "/team", label: "Team", icon: Users, minRole: "MANAGER" },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const allowed = NAV.filter((n) => !n.minRole || RANK[user.role] >= RANK[n.minRole]);

  return (
    <div className="min-h-screen flex">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed md:sticky top-0 h-screen w-64 shrink-0 border-r border-border bg-card z-50 transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-16 px-3 flex items-center gap-2 border-b border-border">
          <div className="pl-2">
            <LogoMark src={user.organizationLogoDataUrl} alt={user.organizationName} />
          </div>
          <div className="flex-1 min-w-0">
            <OrgSwitcher
              orgs={user.orgs}
              currentOrgId={user.organizationId}
              currentOrgName={user.organizationName}
              currentRole={user.role}
            />
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {allowed.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <UserMenu user={user} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 sticky top-0 z-30 glass border-b border-border flex items-center gap-3 px-4 md:px-8">
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-md p-2 hover:bg-muted"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 rounded-lg p-2 hover:bg-muted transition text-left"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-sm">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <a
            href="/logout"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-destructive"
          >
            <LogOut className="h-4 w-4" /> Log out
          </a>
        </div>
      )}
    </div>
  );
}
