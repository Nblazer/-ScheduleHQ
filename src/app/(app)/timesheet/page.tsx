import Link from "next/link";
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { addDays, startOfWeek, toDayKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Timesheet" };

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const user = (await getSessionUser())!;
  const canManage = hasRole(user, "MANAGER");

  const anchor = parseWeek(searchParams.week) ?? startOfWeek(new Date());
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 7);
  const prevWeek = toDayKey(addDays(weekStart, -7));
  const nextWeek = toDayKey(addDays(weekStart, 7));

  const shifts = await prisma.shift.findMany({
    where: {
      organizationId: user.organizationId,
      startsAt: { gte: weekStart, lt: weekEnd },
      // Employees see only their own shifts; managers+ see everyone.
      ...(canManage ? {} : { employeeId: user.id }),
    },
    include: {
      employee: {
        include: {
          memberships: {
            where: { organizationId: user.organizationId },
            select: { hourlyRateCents: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  // Group by employee for the manager view; single bucket for employee view.
  const byEmployee = new Map<
    string,
    {
      userId: string;
      name: string;
      rateCents: number | null;
      paymentProfile: string | null;
      totalMinutes: number;
      shifts: typeof shifts;
    }
  >();
  for (const s of shifts) {
    const existing = byEmployee.get(s.employeeId);
    const minutes = Math.max(0, (s.endsAt.getTime() - s.startsAt.getTime()) / 60000);
    if (existing) {
      existing.totalMinutes += minutes;
      existing.shifts.push(s);
    } else {
      byEmployee.set(s.employeeId, {
        userId: s.employeeId,
        name: s.employee.name,
        rateCents: s.employee.memberships[0]?.hourlyRateCents ?? null,
        paymentProfile: null,
        totalMinutes: minutes,
        shifts: [s],
      });
    }
  }

  // Pull payment profiles (and ensure employee view has their own even with no shifts).
  if (byEmployee.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(byEmployee.keys()) } },
      select: { id: true, paymentProfile: true },
    });
    for (const u of users) {
      const entry = byEmployee.get(u.id);
      if (entry) entry.paymentProfile = u.paymentProfile;
    }
  }

  const rows = Array.from(byEmployee.values()).sort((a, b) => a.name.localeCompare(b.name));
  const totalEarnings = rows.reduce((sum, r) => {
    if (r.rateCents == null) return sum;
    return sum + Math.round((r.totalMinutes / 60) * r.rateCents);
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timesheet</h1>
          <p className="text-sm text-muted-foreground">
            Week of{" "}
            {weekStart.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })}
            {canManage ? " · everyone's hours + earnings" : " · your hours + earnings"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/timesheet?week=${prevWeek}`}>
            <Button variant="outline" size="icon" aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/timesheet?week=${toDayKey(startOfWeek(new Date()))}`}>
            <Button variant="outline" size="sm">This week</Button>
          </Link>
          <Link href={`/timesheet?week=${nextWeek}`}>
            <Button variant="outline" size="icon" aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {canManage && rows.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          <Card className="flex-1 min-w-[240px]">
            <CardContent className="pt-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total payroll</div>
              <div className="text-2xl font-bold mt-1">{money(totalEarnings)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatHours(rows.reduce((s, r) => s + r.totalMinutes, 0))} worked across {rows.length} people
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No shifts this week.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <EmployeeRow
              key={r.userId}
              row={r}
              canManage={canManage}
              isSelf={r.userId === user.id}
            />
          ))}
        </div>
      )}

      {!canManage ? (
        <p className="text-xs text-muted-foreground text-center">
          Your hourly rate is private — only you and your managers can see it.
        </p>
      ) : null}
    </div>
  );
}

function EmployeeRow({
  row,
  canManage,
  isSelf,
}: {
  row: {
    userId: string;
    name: string;
    rateCents: number | null;
    paymentProfile: string | null;
    totalMinutes: number;
    shifts: Array<{
      id: string;
      startsAt: Date;
      endsAt: Date;
      position: string | null;
    }>;
  };
  canManage: boolean;
  isSelf: boolean;
}) {
  const canSeeRate = canManage || isSelf;
  const earnings =
    row.rateCents != null ? Math.round((row.totalMinutes / 60) * row.rateCents) : null;

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold flex items-center gap-2">
              {row.name}
              {isSelf && <Badge variant="outline">You</Badge>}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatHours(row.totalMinutes)} · {row.shifts.length} shift
              {row.shifts.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="text-right">
            {canSeeRate ? (
              <>
                <div className="font-semibold text-lg">
                  {earnings != null ? money(earnings) : "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {row.rateCents != null
                    ? `${money(row.rateCents)}/hr`
                    : "No rate set"}
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground italic">Rate private</div>
            )}
          </div>
        </div>

        {canManage && row.paymentProfile ? (
          <div className="rounded-lg bg-muted/40 border border-border p-2.5 text-xs flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Pay via:</span>
            <span className="font-medium break-all">{row.paymentProfile}</span>
          </div>
        ) : null}

        <div className="text-xs text-muted-foreground divide-y divide-border">
          {row.shifts.map((s) => (
            <div key={s.id} className="py-1.5 flex items-center justify-between">
              <span>
                {s.startsAt.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                ·{" "}
                {s.startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}–
                {s.endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                {s.position ? ` · ${s.position}` : ""}
              </span>
              <span>{formatHours((s.endsAt.getTime() - s.startsAt.getTime()) / 60000)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function parseWeek(v: string | undefined): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
