"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  acceptInvite,
  consumeVerificationToken,
  createOrganizationAndOwner,
  resendVerification,
  verifyPassword,
} from "@/lib/auth";
import { createSession, destroySession, getSessionUser } from "@/lib/session";
import { loginSchema, signupSchema, acceptInviteSchema } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function signupAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    orgName: formData.get("orgName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const { user, organization } = await createOrganizationAndOwner(parsed.data);
    await createSession(user.id, organization.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not create account.";
    return { ok: false, error: message };
  }
  redirect("/dashboard?welcome=1");
}

export async function loginAction(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      memberships: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  if (!user || !user.active) return { ok: false, error: "Invalid email or password." };
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { ok: false, error: "Invalid email or password." };
  if (user.memberships.length === 0) {
    return { ok: false, error: "Your account isn't part of a workspace. Contact your manager." };
  }

  await createSession(user.id, user.memberships[0].organizationId);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function verifyAction(token: string) {
  return consumeVerificationToken(token);
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const u = await getSessionUser();
  if (!u) return { ok: false, error: "Not signed in." };
  try {
    await resendVerification(u.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send verification email." };
  }
}

export async function acceptInviteAction(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const { user, organizationId } = await acceptInvite(parsed.data);
    await createSession(user.id, organizationId);
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not accept invite." };
  }
  redirect("/dashboard?welcome=1");
}
