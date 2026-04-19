import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Megaphone,
  Inbox,
  Users,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata = { title: "Overview" };

export default async function DashboardPage({ searchParams }: { searchParams: { welcome?: string } }) {
  const user = (await getSessionUser())!;
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [upcomingShifts, recentAnnouncements, openReports, teamSize] = await Promise.all([
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        ...(user.role === "EMPLOYEE" ? { employeeId: user.id } : {}),
        startsAt: { gte: now, lte: in7 },
      },
      include: { employee: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    prisma.announcement.findMany({
      where: { organizationId: user.organizationId },
      include: { postedBy: { select: { name: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.report.count({
      where: {
        organizationId: user.organizationId,
        status: "OPEN",
        ...(user.role === "EMPLOYEE" ? { submitterId: user.id } : {}),
      },
    }),
    prisma.membership.count({ where: { organizationId: user.organizationId, active: true } }),
  ]);

  return (
    <div className="space-y-6">
      {searchParams.welcome ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm animate-fade-in">
          <strong>Welcome to ScheduleHQ, {user.name.split(" ")[0]}.</strong> Head to{" "}
          <Link href="/team" className="text-primary underline">Team</Link> to invite your crew, then start
          building a schedule.
        </div>
      ) : null}

      <div>
        <div className="text-sm text-muted-foreground">Good to see you,</div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user.name}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={CalendarDays} label="Shifts next 7 days" value={upcomingShifts.length} />
        <Stat icon={Inbox} label="Open reports" value={openReports} />
        <Stat icon={Users} label="Active teammates" value={teamSize} />
        <Stat icon={Megaphone} label="Announcements" value={recentAnnouncements.length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {user.role === "EMPLOYEE" ? "Your next shifts" : "Upcoming shifts"}
                </CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </div>
              <Link href="/schedule">
                <Button size="sm" variant="ghost">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingShifts.length === 0 ? (
              <EmptyRow text="No shifts scheduled in the next 7 days." />
            ) : (
              <ul className="divide-y divide-border">
                {upcomingShifts.map((s) => (
                  <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{s.employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(s.startsAt, { weekday: "short", month: "short", day: "numeric" })} · {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                        {s.position ? ` · ${s.position}` : ""}
                      </div>
                    </div>
                    <Badge variant="primary">Scheduled</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" /> Announcements
              </CardTitle>
              <Link href="/announcements">
                <Button size="sm" variant="ghost">All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length === 0 ? (
              <EmptyRow text="No announcements yet." />
            ) : (
              <ul className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {a.pinned ? <Badge variant="warning">Pinned</Badge> : null}
                      <div className="font-medium text-sm">{a.title}</div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                    <div className="text-[11px] text-muted-foreground mt-2">
                      {a.postedBy.name} · {formatDate(a.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
      <AlertCircle className="h-4 w-4" /> {text}
    </div>
  );
}
