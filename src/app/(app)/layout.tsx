import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { dueOccurrence } from "@/lib/recurrence";
import { AppShell } from "./_components/app-shell";
import { VerifyBanner } from "./_components/verify-banner";
import type {
  NotificationInvite,
  NotificationSwap,
  NotificationReminder,
} from "./_components/notifications";

function fmtShift(s: { startsAt: Date; endsAt: Date; position: string | null }) {
  const date = s.startsAt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const start = s.startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const end = s.endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${start}–${end}${s.position ? ` · ${s.position}` : ""}`;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const now = new Date();

  const [pendingInvitesRaw, pendingSwapsRaw, allReminders] = await Promise.all([
    prisma.invite.findMany({
      where: {
        email: user.email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: now },
        organization: {
          memberships: {
            none: { userId: user.id, active: true },
          },
        },
      },
      include: { organization: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shiftSwapRequest.findMany({
      where: {
        organizationId: user.organizationId,
        targetUserId: user.id,
        status: "PENDING",
      },
      include: {
        requester: { select: { name: true } },
        requesterShift: true,
        targetShift: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.personalReminder.findMany({
      where: { userId: user.id },
    }),
  ]);

  const notifications: NotificationInvite[] = await Promise.all(
    pendingInvitesRaw.map(async (i) => {
      const inviter = await prisma.membership.findFirst({
        where: { organizationId: i.organizationId, role: "OWNER", active: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      });
      return {
        id: i.id,
        token: i.token,
        orgName: i.organization.name,
        role: i.role,
        inviterName: inviter?.user.name ?? null,
        expiresAt: i.expiresAt.toISOString(),
      };
    }),
  );

  const swaps: NotificationSwap[] = pendingSwapsRaw.map((s) => ({
    id: s.id,
    requesterName: s.requester.name,
    theirShift: fmtShift(s.requesterShift),
    myShift: s.targetShift ? fmtShift(s.targetShift) : null,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
  }));

  // Compute which reminders are currently "due" — i.e. inside their notify-before window.
  const dueReminders: NotificationReminder[] = [];
  for (const r of allReminders) {
    const occ = dueOccurrence(
      {
        scheduledAt: r.scheduledAt,
        recurrence: r.recurrence,
        recurrenceUntil: r.recurrenceUntil,
        notifyBeforeMinutes: r.notifyBeforeMinutes,
        lastDismissedAt: r.lastDismissedAt,
      },
      now,
    );
    if (occ) {
      dueReminders.push({
        id: r.id,
        title: r.title,
        body: r.body,
        color: r.color,
        occurrenceISO: occ.toISOString(),
        recurring: r.recurrence !== "NONE",
      });
    }
  }
  dueReminders.sort(
    (a, b) => new Date(a.occurrenceISO).getTime() - new Date(b.occurrenceISO).getTime(),
  );

  return (
    <AppShell
      user={user}
      notifications={notifications}
      swaps={swaps}
      reminders={dueReminders}
    >
      {!user.emailVerified ? <VerifyBanner email={user.email} /> : null}
      {children}
    </AppShell>
  );
}
