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
  BookOpen,
  DollarSign,
  Contact,
  Briefcase,
  MessageCircle,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import { LogoMark } from "@/components/logo";
import { OrgSwitcher } from "./org-switcher";
import {
  NotificationBell,
  type NotificationInvite,
  type NotificationSwap,
  type NotificationReminder,
} from "./notifications";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";
};

type Section = "work" | "chat" | "personal";

const RANK = { OWNER: 4, ADMIN: 3, MANAGER: 2, EMPLOYEE: 1 } as const;

const WORK_NAV: Item[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/timesheet", label: "Timesheet", icon: DollarSign },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/reports", label: "Reports", icon: Inbox },
  { href: "/team", label: "Team", icon: Users, minRole: "MANAGER" },
];

const PERSONAL_NAV: Item[] = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings/account", label: "Account", icon: UserIcon },
  { href: "/settings/workspaces", label: "Workspaces", icon: Settings },
  { href: "/settings/plan", label: "Plan", icon: Sparkles },
];

const CHAT_NAV: Item[] = [{ href: "/chat", label: "Chat", icon: MessageCircle }];

function sectionFromPath(pathname: string): Section {
  if (pathname.startsWith("/calendar")) return "personal";
  if (pathname.startsWith("/settings")) return "personal";
  if (pathname.startsWith("/chat")) return "chat";
  return "work";
}

const TABS: { id: Section; label: string; icon: React.ComponentType<{ className?: string }>; href: string }[] = [
  { id: "work", label: "Work", icon: Briefcase, href: "/dashboard" },
  { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
  { id: "personal", label: "You", icon: UserIcon, href: "/calendar" },
];

export function AppShell({
  user,
  notifications,
  swaps,
  reminders,
  children,
}: {
  user: SessionUser;
  notifications: NotificationInvite[];
  swaps: NotificationSwap[];
  reminders: NotificationReminder[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const section = sectionFromPath(pathname);

  const navForSection: Item[] =
    section === "personal" ? PERSONAL_NAV : section === "chat" ? CHAT_NAV : WORK_NAV;
  const allowed = navForSection.filter((n) => !n.minRole || RANK[user.role] >= RANK[n.minRole]);

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
          "fixed md:sticky top-0 h-screen w-64 shrink-0 border-r border-border bg-card z-50 transition-transform md:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header: org switcher (Work) or branded title (Chat / Personal) */}
        <div className="h-20 px-3 flex items-center gap-3 border-b border-border shrink-0">
          <div className="pl-1">
            <LogoMark
              size={44}
              src={section === "work" ? user.organizationLogoDataUrl : null}
              alt={section === "work" ? user.organizationName : "ScheduleHQ"}
            />
          </div>
          <div className="flex-1 min-w-0">
            {section === "work" ? (
              <OrgSwitcher
                orgs={user.orgs}
                currentOrgId={user.organizationId}
                currentOrgName={user.organizationName}
                currentRole={user.role}
              />
            ) : (
              <div className="px-2">
                <div className="font-semibold text-sm truncate">
                  {section === "chat" ? "Chat" : "Personal"}
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {user.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top-level section tabs */}
        <div className="px-3 pt-3">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/50 p-1">
            {TABS.map((t) => {
              const active = section === t.id;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] font-medium transition",
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Section nav */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto scrollbar-thin">
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

        <div className="p-3 border-t border-border shrink-0">
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
          <NotificationBell invites={notifications} swaps={swaps} reminders={reminders} />
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
