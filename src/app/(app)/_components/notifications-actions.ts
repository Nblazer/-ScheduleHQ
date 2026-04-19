"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, setActiveOrg } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

export async function acceptNotificationInviteAction(token: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return { ok: false, error: "Invite not found." };
  if (invite.acceptedAt) return { ok: false, error: "This invite has already been used." };
  if (invite.expiresAt < new Date()) return { ok: false, error: "This invite has expired." };

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      ok: false,
      error: `This invite was sent to ${invite.email}, but you're signed in as ${user.email}.`,
    };
  }

  const existing = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId: invite.organizationId },
    },
  });
  if (existing) {
    if (!existing.active) {
      await prisma.membership.update({
        where: { id: existing.id },
        data: { active: true, role: invite.role },
      });
    }
  } else {
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  // Switch them into the newly-joined workspace so they see it right away.
  await setActiveOrg(invite.organizationId);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function declineNotificationInviteAction(token: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return { ok: false, error: "Invite not found." };
  if (invite.acceptedAt) return { ok: false, error: "This invite has already been used." };

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: "That invite isn't for you." };
  }

  await prisma.invite.delete({ where: { id: invite.id } });
  revalidatePath("/", "layout");
  return { ok: true };
}
