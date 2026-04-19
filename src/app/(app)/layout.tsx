import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "./_components/app-shell";
import { VerifyBanner } from "./_components/verify-banner";
import type { NotificationInvite, NotificationSwap } from "./_components/notifications";

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

  const [pendingInvitesRaw, pendingSwapsRaw] = await Promise.all([
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

  return (
    <AppShell user={user} notifications={notifications} swaps={swaps}>
      {!user.emailVerified ? <VerifyBanner email={user.email} /> : null}
      {children}
    </AppShell>
  );
}
