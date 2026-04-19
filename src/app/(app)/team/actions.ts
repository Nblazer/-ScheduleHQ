"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createInvite } from "@/lib/auth";
import { assignableRoles, canManage, getSessionUser, hasRole } from "@/lib/session";
import { inviteSchema } from "@/lib/validation";

type Result = { ok: true } | { ok: false; error: string };

export async function inviteAction(_: Result | null, formData: FormData): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  if (!assignableRoles(user.role).includes(parsed.data.role)) {
    return { ok: false, error: "You can't assign that role." };
  }

  try {
    await createInvite({
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      inviterName: user.name,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
    });
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not send invite." };
  }

  revalidatePath("/team");
  return { ok: true };
}

export async function changeRoleAction(targetId: string, nextRole: Role): Promise<Result> {
  const actor = await getSessionUser();
  if (!actor) return { ok: false, error: "Not signed in." };

  const target = await prisma.user.findFirst({
    where: { id: targetId, organizationId: actor.organizationId },
  });
  if (!target) return { ok: false, error: "User not found in your organization." };
  if (target.id === actor.id) return { ok: false, error: "Use the settings page to change your own role." };

  if (!canManage(actor.role, target.role)) {
    return { ok: false, error: "You can't manage someone at or above your role." };
  }
  if (!assignableRoles(actor.role).includes(nextRole)) {
    return { ok: false, error: "You can't assign that role." };
  }

  await prisma.user.update({ where: { id: targetId }, data: { role: nextRole } });
  revalidatePath("/team");
  return { ok: true };
}

export async function setActiveAction(targetId: string, active: boolean): Promise<Result> {
  const actor = await getSessionUser();
  if (!actor) return { ok: false, error: "Not signed in." };
  if (!hasRole(actor, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const target = await prisma.user.findFirst({
    where: { id: targetId, organizationId: actor.organizationId },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.id === actor.id) return { ok: false, error: "You can't deactivate yourself." };
  if (!canManage(actor.role, target.role)) {
    return { ok: false, error: "You can't manage someone at or above your role." };
  }

  await prisma.user.update({ where: { id: targetId }, data: { active } });
  if (!active) {
    // Kill any live sessions for the deactivated user.
    await prisma.session.deleteMany({ where: { userId: targetId } });
  }
  revalidatePath("/team");
  return { ok: true };
}

export async function revokeInviteAction(inviteId: string): Promise<Result> {
  const actor = await getSessionUser();
  if (!actor) return { ok: false, error: "Not signed in." };
  if (!hasRole(actor, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const invite = await prisma.invite.findFirst({
    where: { id: inviteId, organizationId: actor.organizationId },
  });
  if (!invite) return { ok: false, error: "Invite not found." };
  if (invite.acceptedAt) return { ok: false, error: "Invite already accepted." };
  await prisma.invite.delete({ where: { id: inviteId } });
  revalidatePath("/team");
  return { ok: true };
}
