"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { inviteToOrganization, inviteUrl } from "@/lib/auth";
import { assignableRoles, canManage, getSessionUser, hasRole } from "@/lib/session";
import { inviteSchema } from "@/lib/validation";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

export type InviteActionResult = Result<{
  email: string;
  name: string;
  inviteLink: string;
  alreadyHasAccount: boolean;
}>;

export async function inviteAction(
  _: InviteActionResult | null,
  formData: FormData,
): Promise<InviteActionResult> {
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
    const outcome = await inviteToOrganization({
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      inviterName: user.name,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
    });
    revalidatePath("/team");
    return {
      ok: true,
      email: outcome.email,
      name: outcome.name,
      inviteLink: inviteUrl(outcome.token),
      alreadyHasAccount: outcome.alreadyHasAccount,
    };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not send invite." };
  }
}

export async function changeRoleAction(
  targetId: string,
  nextRole: Role,
): Promise<Result> {
  const actor = await getSessionUser();
  if (!actor) return { ok: false, error: "Not signed in." };

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: targetId, organizationId: actor.organizationId },
    },
  });
  if (!membership) return { ok: false, error: "User not found in your organization." };
  if (targetId === actor.id) return { ok: false, error: "Use the settings page to change your own role." };

  if (!canManage(actor.role, membership.role)) {
    return { ok: false, error: "You can't manage someone at or above your role." };
  }
  if (!assignableRoles(actor.role).includes(nextRole)) {
    return { ok: false, error: "You can't assign that role." };
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: nextRole },
  });
  revalidatePath("/team");
  return { ok: true };
}

export async function setActiveAction(
  targetId: string,
  active: boolean,
): Promise<Result> {
  const actor = await getSessionUser();
  if (!actor) return { ok: false, error: "Not signed in." };
  if (!hasRole(actor, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: targetId, organizationId: actor.organizationId },
    },
  });
  if (!membership) return { ok: false, error: "User not found." };
  if (targetId === actor.id) return { ok: false, error: "You can't deactivate yourself." };
  if (!canManage(actor.role, membership.role)) {
    return { ok: false, error: "You can't manage someone at or above your role." };
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { active },
  });
  if (!active) {
    // If the deactivated user's active org was this one, nudge them to another.
    await prisma.session.updateMany({
      where: { userId: targetId, activeOrganizationId: actor.organizationId },
      data: { activeOrganizationId: null },
    });
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
