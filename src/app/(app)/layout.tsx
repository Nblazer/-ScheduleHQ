import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "./_components/app-shell";
import { VerifyBanner } from "./_components/verify-banner";
import type { NotificationInvite } from "./_components/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const now = new Date();
  const pendingInvites = await prisma.invite.findMany({
    where: {
      email: user.email.toLowerCase(),
      acceptedAt: null,
      expiresAt: { gt: now },
      // Filter out invites to workspaces they're already an active member of,
      // e.g. stale invites lingering after auto-add during earlier bugs.
      organization: {
        memberships: {
          none: { userId: user.id, active: true },
        },
      },
    },
    include: {
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Best-effort inviter name lookup — not every invite has a stored inviter,
  // so we do one lookup batch against org owners as a reasonable display name.
  const notifications: NotificationInvite[] = await Promise.all(
    pendingInvites.map(async (i) => {
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

  return (
    <AppShell user={user} notifications={notifications}>
      {!user.emailVerified ? <VerifyBanner email={user.email} /> : null}
      {children}
    </AppShell>
  );
}
