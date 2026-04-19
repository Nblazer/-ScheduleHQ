"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { resourcePageSchema } from "@/lib/validation";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function createResourcePageAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsed = resourcePageSchema.safeParse({
    title: formData.get("title"),
    icon: formData.get("icon") || null,
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // Place new pages at the bottom by default.
  const last = await prisma.resourcePage.findFirst({
    where: { organizationId: user.organizationId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const page = await prisma.resourcePage.create({
    data: {
      organizationId: user.organizationId,
      title: parsed.data.title,
      icon: parsed.data.icon ?? null,
      body: parsed.data.body,
      sortOrder: (last?.sortOrder ?? 0) + 10,
      createdById: user.id,
    },
  });

  revalidatePath("/resources");
  redirect(`/resources/${page.id}?edit=1`);
}

export async function updateResourcePageAction(
  id: string,
  input: { title: string; icon: string | null; body: string },
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsed = resourcePageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.resourcePage.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return { ok: false, error: "Page not found." };

  await prisma.resourcePage.update({
    where: { id },
    data: {
      title: parsed.data.title,
      icon: parsed.data.icon ?? null,
      body: parsed.data.body,
    },
  });

  revalidatePath("/resources");
  revalidatePath(`/resources/${id}`);
  return { ok: true };
}

export async function deleteResourcePageAction(id: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const existing = await prisma.resourcePage.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return { ok: false, error: "Page not found." };

  await prisma.resourcePage.delete({ where: { id } });
  revalidatePath("/resources");
  return { ok: true };
}
