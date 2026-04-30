import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { occurrencesIn, nextOccurrence } from "@/lib/recurrence";
import { CalendarView } from "./_components/calendar-view";

export const metadata = { title: "Calendar" };

function parseMonth(v: string | undefined): { year: number; month: number } | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11) return null;
  return { year, month };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; day?: string };
}) {
  const user = (await getSessionUser())!;
  const now = new Date();
  const target = parseMonth(searchParams.month) ?? {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
  };

  // Visible window: first Sun before/on the 1st, last Sat after/on the last day.
  // The grid covers up to 6 weeks (42 days) so we can render any month.
  const firstOfMonth = new Date(Date.UTC(target.year, target.month, 1));
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(1 - firstOfMonth.getUTCDay());
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridStart.getUTCDate() + 41);
  gridEnd.setUTCHours(23, 59, 59, 999);

  // Fetch all reminders that COULD have an occurrence in the window. We
  // can't filter recurring ones server-side without expansion, so we pull
  // every reminder for the user and expand client-side / here.
  const reminders = await prisma.personalReminder.findMany({
    where: { userId: user.id },
    orderBy: { scheduledAt: "asc" },
  });

  // Expand into per-day events for the grid.
  type Event = {
    id: string;
    title: string;
    body: string | null;
    color: string;
    occurrenceISO: string;
    recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  };
  const events: Event[] = [];
  for (const r of reminders) {
    for (const occ of occurrencesIn(
      {
        scheduledAt: r.scheduledAt,
        recurrence: r.recurrence,
        recurrenceUntil: r.recurrenceUntil,
      },
      gridStart,
      gridEnd,
    )) {
      events.push({
        id: r.id,
        title: r.title,
        body: r.body,
        color: r.color,
        occurrenceISO: occ.toISOString(),
        recurrence: r.recurrence,
      });
    }
  }

  // Upcoming list (next 5 occurrences across all reminders, after now).
  const upcoming = reminders
    .map((r) => {
      const next = nextOccurrence(
        {
          scheduledAt: r.scheduledAt,
          recurrence: r.recurrence,
          recurrenceUntil: r.recurrenceUntil,
        },
        now,
      );
      return next ? { reminder: r, when: next } : null;
    })
    .filter((x): x is { reminder: typeof reminders[number]; when: Date } => !!x)
    .sort((a, b) => a.when.getTime() - b.when.getTime())
    .slice(0, 5)
    .map((x) => ({
      id: x.reminder.id,
      title: x.reminder.title,
      color: x.reminder.color,
      whenISO: x.when.toISOString(),
      recurrence: x.reminder.recurrence,
      notifyBeforeMinutes: x.reminder.notifyBeforeMinutes,
    }));

  // Selected day (from query). Defaults to today if today is in the visible month.
  const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  const selectedKey = searchParams.day ?? todayKey;

  return (
    <CalendarView
      year={target.year}
      month={target.month}
      gridStartISO={gridStart.toISOString()}
      todayISO={now.toISOString()}
      selectedDayKey={selectedKey}
      events={events}
      reminders={reminders.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        color: r.color,
        scheduledAt: r.scheduledAt.toISOString(),
        recurrence: r.recurrence,
        recurrenceUntil: r.recurrenceUntil?.toISOString() ?? null,
        notifyBeforeMinutes: r.notifyBeforeMinutes,
      }))}
      upcoming={upcoming}
    />
  );
}
