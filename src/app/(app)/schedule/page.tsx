import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { addDays, startOfWeek, toDayKey } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleWeek } from "./_components/schedule-week";

export const metadata = { title: "Schedule" };

export default async function SchedulePage({ searchParams }: { searchParams: { week?: string } }) {
  const user = (await getSessionUser())!;
  const canManage = hasRole(user, "MANAGER");

  const anchor = parseWeek(searchParams.week) ?? startOfWeek(new Date());
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 7);
  const prevWeek = toDayKey(addDays(weekStart, -7));
  const nextWeek = toDayKey(addDays(weekStart, 7));
  const today = toDayKey(startOfWeek(new Date()));

  const [employees, shifts, dayNotes] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: user.organizationId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        startsAt: { gte: weekStart, lt: weekEnd },
      },
      include: { employee: { select: { id: true, name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.dayNote.findMany({
      where: {
        organizationId: user.organizationId,
        date: { gte: weekStart, lt: weekEnd },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Week of {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/schedule?week=${prevWeek}`}>
            <Button variant="outline" size="icon" aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/schedule?week=${today}`}>
            <Button variant="outline" size="sm">Today</Button>
          </Link>
          <Link href={`/schedule?week=${nextWeek}`}>
            <Button variant="outline" size="icon" aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <ScheduleWeek
        canManage={canManage}
        weekStartISO={weekStart.toISOString()}
        employees={employees.map((e) => ({ id: e.id, name: e.name, role: e.role }))}
        shifts={shifts.map((s) => ({
          id: s.id,
          employeeId: s.employeeId,
          employeeName: s.employee.name,
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
          position: s.position,
          notes: s.notes,
        }))}
        dayNotes={dayNotes.map((n) => ({
          id: n.id,
          date: n.date.toISOString(),
          title: n.title,
          body: n.body,
          color: n.color,
        }))}
      />

      {!canManage ? (
        <p className="text-xs text-muted-foreground text-center">
          Managers and admins can add shifts and day notes.
        </p>
      ) : null}
    </div>
  );
}

function parseWeek(v: string | undefined): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
