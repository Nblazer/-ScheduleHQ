import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { assignableRoles, getSessionUser, hasRole } from "@/lib/session";
import { TeamView } from "./_components/team-view";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const user = (await getSessionUser())!;
  if (!hasRole(user, "MANAGER")) redirect("/dashboard");

  const resendConfigured = Boolean(process.env.RESEND_API_KEY);

  const [memberships, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: user.organizationId },
      orderBy: [{ active: "desc" }, { role: "asc" }, { createdAt: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.invite.findMany({
      where: { organizationId: user.organizationId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Managers see everyone's rate; the helper fn on the client is gated by role.

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Invite people, change roles, and manage who can access this workspace.
          </p>
        </div>
      </div>

      <TeamView
        currentUserId={user.id}
        currentRole={user.role}
        assignableRoles={assignableRoles(user.role)}
        resendConfigured={resendConfigured}
        members={memberships.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          active: m.active,
          emailVerified: m.user.emailVerifiedAt !== null,
          createdAt: m.user.createdAt.toISOString(),
          hourlyRateCents: m.hourlyRateCents,
        }))}
        invites={invites.map((i) => ({
          id: i.id,
          email: i.email,
          name: i.name,
          role: i.role,
          token: i.token,
          expiresAt: i.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
