"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAdditionalWorkspace } from "@/lib/auth";
import { getSessionUser, setActiveOrg } from "@/lib/session";
import { nameSchema } from "@/lib/validation";

type Result = { ok: true } | { ok: false; error: string };

export async function createWorkspaceAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsed = nameSchema.safeParse(formData.get("orgName"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };

  try {
    const org = await createAdditionalWorkspace({ userId: user.id, orgName: parsed.data });
    await setActiveOrg(org.id);
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create workspace." };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard?welcome=1");
}

// Current user removes themselves from the active workspace.
// Blocked if they're the only remaining OWNER.
export async function leaveWorkspaceAction(): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId: user.organizationId },
    },
  });
  if (!membership) return { ok: false, error: "You're not a member of this workspace." };

  if (membership.role === "OWNER") {
    const otherOwners = await prisma.membership.count({
      where: {
        organizationId: user.organizationId,
        role: "OWNER",
        active: true,
        userId: { not: user.id },
      },
    });
    if (otherOwners === 0) {
      return {
        ok: false,
        error:
          "You're the only Owner. Transfer ownership to someone else first, or delete the workspace entirely.",
      };
    }
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  // Nudge their session off this org; it'll fall back to another on next fetch.
  await prisma.session.updateMany({
    where: { userId: user.id, activeOrganizationId: user.organizationId },
    data: { activeOrganizationId: null },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// Promote another active member to OWNER. The current owner is demoted to
// ADMIN so the new owner has sole top-level authority but the old owner
// keeps operational access. If they want to fully leave, they can then
// use Leave workspace.
export async function transferOwnershipAction(targetUserId: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (user.role !== "OWNER") return { ok: false, error: "Only Owners can transfer ownership." };
  if (targetUserId === user.id) return { ok: false, error: "Pick a different member to transfer to." };

  const target = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: targetUserId, organizationId: user.organizationId },
    },
  });
  if (!target || !target.active) {
    return { ok: false, error: "That person isn't an active member of this workspace." };
  }

  await prisma.$transaction([
    prisma.membership.update({
      where: { id: target.id },
      data: { role: "OWNER" as Role },
    }),
    prisma.membership.updateMany({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
        role: "OWNER",
      },
      data: { role: "ADMIN" as Role },
    }),
  ]);

  revalidatePath("/", "layout");
  return { ok: true };
}

// Hard-deletes the workspace and everything in it. Owner-only. Confirms by
// requiring the workspace name to match.
export async function deleteWorkspaceAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (user.role !== "OWNER") return { ok: false, error: "Only Owners can delete a workspace." };

  const typed = String(formData.get("confirm") ?? "").trim();
  if (typed !== user.organizationName) {
    return {
      ok: false,
      error: `Type the exact workspace name "${user.organizationName}" to confirm.`,
    };
  }

  // Cascade delete handles memberships, shifts, notes, announcements, reports,
  // invites, resource pages, swap requests — all FKs use onDelete: Cascade
  // back to Organization.
  await prisma.organization.delete({ where: { id: user.organizationId } });

  // Reset everyone's sessions that were active on this org.
  await prisma.session.updateMany({
    where: { activeOrganizationId: user.organizationId },
    data: { activeOrganizationId: null },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
