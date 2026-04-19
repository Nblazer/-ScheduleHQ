import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { assignableRoles, getSessionUser, hasRole } from "@/lib/session";
import { TeamView } from "./_components/team-view";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const user = (await getSessionUser())!;
  if (!hasRole(user, "MANAGER")) redirect("/dashboard");

  const [members, invites] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    }),
    prisma.invite.findMany({
      where: { organizationId: user.organizationId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Invite people, change roles, and manage who can access your workspace.
          </p>
        </div>
      </div>

      <TeamView
        currentUserId={user.id}
        currentRole={user.role}
        assignableRoles={assignableRoles(user.role)}
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          active: m.active,
          emailVerified: m.emailVerifiedAt !== null,
          createdAt: m.createdAt.toISOString(),
        }))}
        invites={invites.map((i) => ({
          id: i.id,
          email: i.email,
          name: i.name,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
