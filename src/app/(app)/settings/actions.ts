"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { themeSchema, nameSchema } from "@/lib/validation";
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
