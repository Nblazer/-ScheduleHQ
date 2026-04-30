"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  Bell,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReminderDialog } from "./reminder-dialog";

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

type Event = {
  id: string;
  title: string;
  body: string | null;
  color: string;
  occurrenceISO: string;
  recurrence: Recurrence;
};

type Reminder = {
  id: string;
  title: string;
  body: string | null;
  color: string;
  scheduledAt: string;
  recurrence: Recurrence;
  recurrenceUntil: string | null;
  notifyBeforeMinutes: number;
};

type Upcoming = {
  id: string;
  title: string;
  color: string;
  whenISO: string;
  recurrence: Recurrence;
  notifyBeforeMinutes: number;
};

const COLOR_BG: Record<string, string> = {
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

const COLOR_CHIP: Record<string, string> = {
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/40",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/40",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function CalendarView({
  year,
  month,
  gridStartISO,
  todayISO,
  selectedDayKey,
  events,
  reminders,
  upcoming,
}: {
  year: number;
  month: number;
  gridStartISO: string;
  todayISO: string;
  selectedDayKey: string;
  events: Event[];
  reminders: Reminder[];
  upcoming: Upcoming[];
}) {
  const [dialog, setDialog] = React.useState<
    | { mode: "create"; defaultDateISO: string }
    | { mode: "edit"; reminder: Reminder }
    | null
  >(null);

  const today = new Date(todayISO);
  const todayKey = dayKey(today);
  const gridStart = new Date(gridStartISO);

  // Group events by day for fast lookup.
  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const k = dayKey(new Date(e.occurrenceISO));
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const days: { date: Date; key: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    days.push({ date: d, key: dayKey(d), inMonth: d.getUTCMonth() === month });
  }

  const selected = React.useMemo(() => {
    return days.find((d) => d.key === selectedDayKey) ?? days.find((d) => d.key === todayKey);
  }, [days, selectedDayKey, todayKey]);

  const selectedEvents = selected ? eventsByDay.get(selected.key) ?? [] : [];

  const prevMonthKey = monthKey(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  const nextMonthKey = monthKey(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  const thisMonthKey = monthKey(today.getUTCFullYear(), today.getUTCMonth());

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Personal reminders, tied to your account. Travel with you across every workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?month=${prevMonthKey}`}>
            <Button variant="outline" size="icon" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/calendar?month=${thisMonthKey}`}>
            <Button variant="outline" size="sm">Today</Button>
          </Link>
          <Link href={`/calendar?month=${nextMonthKey}`}>
            <Button variant="outline" size="icon" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            onClick={() =>
              setDialog({
                mode: "create",
                defaultDateISO: selected?.date.toISOString() ?? today.toISOString(),
              })
            }
          >
            <Plus className="h-4 w-4" /> New reminder
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-5">
        <Card>
          <CardContent className="pt-5">
            <div className="text-xl font-semibold mb-4">
              {MONTHS[month]} {year}
            </div>
            <div className="grid grid-cols-7 text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              {DOW.map((d) => (
                <div key={d} className="px-2 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const isToday = d.key === todayKey;
                const isSelected = d.key === selected?.key;
                const dayEvents = eventsByDay.get(d.key) ?? [];
                return (
                  <Link
                    key={d.key}
                    href={`/calendar?month=${monthKey(year, month)}&day=${d.key}`}
                    scroll={false}
                    className={cn(
                      "relative min-h-[84px] rounded-lg border p-1.5 text-left transition group",
                      d.inMonth ? "bg-card" : "bg-muted/30 opacity-70",
                      isToday && "border-primary/60",
                      isSelected ? "ring-2 ring-primary" : "border-border hover:border-primary/40",
                    )}
                  >
                    <div
                      className={cn(
                        "text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center mb-1",
                        isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {d.date.getUTCDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div
                          key={`${e.id}-${i}`}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium truncate flex items-center gap-1",
                            COLOR_CHIP[e.color] ?? COLOR_CHIP.indigo,
                          )}
                        >
                          {e.recurrence !== "NONE" && (
                            <Repeat className="h-2.5 w-2.5 shrink-0 opacity-70" />
                          )}
                          <span className="truncate">{e.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">
                  {selected
                    ? selected.date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      })
                    : "Pick a day"}
                </h2>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Nothing scheduled this day.
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((e, i) => {
                    const r = reminders.find((rem) => rem.id === e.id);
                    return (
                      <li
                        key={`${e.id}-${i}`}
                        className="flex items-start gap-2 rounded-lg border border-border p-2.5 hover:border-primary/40 transition cursor-pointer"
                        onClick={() => {
                          if (r) setDialog({ mode: "edit", reminder: r });
                        }}
                      >
                        <span
                          className={cn(
                            "mt-1 h-2.5 w-2.5 rounded-full shrink-0",
                            COLOR_BG[e.color] ?? COLOR_BG.indigo,
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm flex items-center gap-1.5">
                            {e.recurrence !== "NONE" && (
                              <Repeat className="h-3 w-3 text-muted-foreground" />
                            )}
                            {e.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(e.occurrenceISO).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            {r && r.notifyBeforeMinutes > 0 && (
                              <span className="flex items-center gap-1">
                                <Bell className="h-3 w-3" />
                                {fmtLead(r.notifyBeforeMinutes)} before
                              </span>
                            )}
                          </div>
                          {e.body && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {e.body}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" /> Upcoming
              </h2>
              {upcoming.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No upcoming reminders. Click <strong>New reminder</strong> to add one.
                </div>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((u) => (
                    <li key={u.id} className="flex items-start gap-2 text-sm">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full shrink-0",
                          COLOR_BG[u.color] ?? COLOR_BG.indigo,
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate flex items-center gap-1.5">
                          {u.recurrence !== "NONE" && (
                            <Repeat className="h-3 w-3 text-muted-foreground" />
                          )}
                          {u.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {humanizeWhen(u.whenISO)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {dialog && dialog.mode === "create" && (
        <ReminderDialog
          mode="create"
          defaultDateISO={dialog.defaultDateISO}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog && dialog.mode === "edit" && (
        <ReminderDialog
          mode="edit"
          reminder={dialog.reminder}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function fmtLead(min: number) {
  if (min === 0) return "At time";
  if (min < 60) return `${min} min`;
  if (min < 1440) {
    const h = Math.round(min / 60);
    return `${h}h`;
  }
  const d = Math.round(min / 1440);
  return `${d}d`;
}

function humanizeWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  const dateLabel = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffH < 1) {
    const mins = Math.max(0, Math.round(diffMs / 60000));
    return `In ${mins} min · ${timeLabel}`;
  }
  if (diffH < 24) return `In ${Math.round(diffH)}h · ${timeLabel}`;
  return `${dateLabel} · ${timeLabel}`;
}
