"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { destroySession, getSessionUser, hasRole } from "@/lib/session";
import { themeSchema, nameSchema, logoDataUrlSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";

type Result = { ok: true } | { ok: false; error: string };

export async function saveThemeAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = themeSchema.safeParse({
    preset: formData.get("preset"),
    accent: formData.get("accent"),
    scope: formData.get("scope") ?? "user",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  if (parsed.data.scope === "organization") {
    if (!hasRole(user, "ADMIN")) {
      return { ok: false, error: "Only admins and owners can change the workspace default." };
    }
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { themePreset: parsed.data.preset, themeAccent: parsed.data.accent },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { themePreset: parsed.data.preset, themeAccent: parsed.data.accent },
    });
  }

  cookies().set("shq_theme", parsed.data.preset, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  cookies().set("shq_accent", parsed.data.accent, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveProfileAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const passwordChangeSchema = z.object({
  current: z.string().min(1, "Current password required."),
  next: z.string().min(8, "At least 8 characters."),
});

export async function changePasswordAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsed = passwordChangeSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { ok: false, error: "Account not found." };
  const ok = await verifyPassword(parsed.data.current, dbUser.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect." };
  const hash = await hashPassword(parsed.data.next);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
  return { ok: true };
}

export async function saveOrgAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "ADMIN")) return { ok: false, error: "Admins and owners only." };
  const parsed = nameSchema.safeParse(formData.get("orgName"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { name: parsed.data },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

const MAX_LOGO_BYTES = 256 * 1024;

// Accepts FormData with either:
//   - "remove" = "1"   → clears the logo
//   - "logo"   = <File> → new upload (validated, converted to data URL, stored)
export async function saveLogoAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "ADMIN")) return { ok: false, error: "Admins and owners only." };

  if (formData.get("remove") === "1") {
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { logoDataUrl: null },
    });
    revalidatePath("/", "layout");
    return { ok: true };
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick an image file." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: "Image is too large — please use one under 256KB." };
  }
  const type = (file.type || "").toLowerCase();
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowed.includes(type)) {
    return { ok: false, error: "Unsupported format. Use PNG, JPEG, GIF, WebP, or SVG." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${type};base64,${buf.toString("base64")}`;

  const parsed = logoDataUrlSchema.safeParse(dataUrl);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid image." };

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { logoDataUrl: parsed.data },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// Returns a list of orgs where the user is the ONLY OWNER.
// Used by the Delete Account UI to block deletion and guide the user.
export async function getDeleteAccountBlockers(): Promise<
  { orgId: string; orgName: string }[]
> {
  const user = await getSessionUser();
  if (!user) return [];
  const owned = await prisma.membership.findMany({
    where: { userId: user.id, role: "OWNER", active: true },
    include: { organization: { select: { id: true, name: true } } },
  });
  const blockers: { orgId: string; orgName: string }[] = [];
  for (const m of owned) {
    const otherOwners = await prisma.membership.count({
      where: {
        organizationId: m.organizationId,
        role: "OWNER",
        active: true,
        userId: { not: user.id },
      },
    });
    if (otherOwners === 0) {
      blockers.push({ orgId: m.organizationId, orgName: m.organization.name });
    }
  }
  return blockers;
}

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password required to confirm."),
  confirm: z.string().refine((v) => v === "DELETE", {
    message: 'Type "DELETE" to confirm.',
  }),
});

export async function deleteAccountAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = deleteAccountSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { ok: false, error: "Account not found." };
  const ok = await verifyPassword(parsed.data.password, dbUser.passwordHash);
  if (!ok) return { ok: false, error: "Password is incorrect." };

  const blockers = await getDeleteAccountBlockers();
  if (blockers.length > 0) {
    return {
      ok: false,
      error: `You are the only owner of ${blockers.map((b) => b.orgName).join(", ")}. Promote another owner, or the workspace will be orphaned.`,
    };
  }

  // Reassign user-authored records in each org to a remaining OWNER, so the workspace
  // doesn't lose history. For orgs where user has no membership, records are untouched.
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { organizationId: true },
  });

  for (const m of memberships) {
    const otherOwner = await prisma.membership.findFirst({
      where: {
        organizationId: m.organizationId,
        role: "OWNER",
        active: true,
        userId: { not: user.id },
      },
      select: { userId: true },
    });
    if (!otherOwner) continue; // Shouldn't happen (blocker check above), but be safe.
    const reassignTo = otherOwner.userId;

    await prisma.$transaction([
      prisma.shift.updateMany({
        where: { organizationId: m.organizationId, createdById: user.id },
        data: { createdById: reassignTo },
      }),
      prisma.dayNote.updateMany({
        where: { organizationId: m.organizationId, createdById: user.id },
        data: { createdById: reassignTo },
      }),
      prisma.announcement.updateMany({
        where: { organizationId: m.organizationId, postedById: user.id },
        data: { postedById: reassignTo },
      }),
      prisma.report.updateMany({
        where: { organizationId: m.organizationId, submitterId: user.id },
        data: { submitterId: reassignTo },
      }),
      prisma.report.updateMany({
        where: { organizationId: m.organizationId, assigneeId: user.id },
        data: { assigneeId: null },
      }),
    ]);
  }

  // Delete the user. Cascades memberships, sessions, verifications,
  // and shifts where the user was the employee.
  await prisma.user.delete({ where: { id: user.id } });

  await destroySession();
  cookies().delete("shq_theme");
  cookies().delete("shq_accent");

  redirect("/?deleted=1");
}
