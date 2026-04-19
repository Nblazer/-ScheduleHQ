"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setActiveOrg } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

// Accept an invite where the user already has a ScheduleHQ account.
// Requires them to be logged in with a matching email.
export async function acceptInviteForExistingAction(formData: FormData): Promise<Result | void> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, error: "Missing token." };

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return { ok: false, error: "Invite not found." };
  if (invite.acceptedAt) return { ok: false, error: "This invite has already been used." };
  if (invite.expiresAt < new Date()) return { ok: false, error: "This invite has expired." };

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    include: { sessions: true, memberships: true },
  });
  if (!existingUser) return { ok: false, error: "No account found for this email." };

  // Require the current browser to be logged in as this user.
  const sessionToken = cookies().get("shq_session")?.value;
  if (!sessionToken) {
    redirect(`/login?next=/invite?token=${encodeURIComponent(token)}`);
  }
  const session = await prisma.session.findUnique({ where: { token: sessionToken } });
  if (!session || session.userId !== existingUser.id) {
    return {
      ok: false,
      error: "Please log in as " + invite.email + " to accept this invitation.",
    };
  }

  const already = existingUser.memberships.find(
    (m) => m.organizationId === invite.organizationId,
  );
  if (!already) {
    await prisma.membership.create({
      data: {
        userId: existingUser.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });
  } else if (!already.active) {
    await prisma.membership.update({
      where: { id: already.id },
      data: { active: true, role: invite.role },
    });
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  await setActiveOrg(invite.organizationId);
  redirect("/dashboard?welcome=1");
}
