"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { announcementSchema } from "@/lib/validation";
import { sendEmail, announcementEmail } from "@/lib/email";

type Result = { ok: true } | { ok: false; error: string };

export async function createAnnouncementAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    pinned: formData.get("pinned") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const emailBlast = formData.get("emailBlast") === "on";

  await prisma.announcement.create({
    data: {
      organizationId: user.organizationId,
      title: parsed.data.title,
      body: parsed.data.body,
      pinned: parsed.data.pinned,
      postedById: user.id,
    },
  });

  if (emailBlast) {
    const memberships = await prisma.membership.findMany({
      where: {
        organizationId: user.organizationId,
        active: true,
        userId: { not: user.id },
      },
      include: { user: { select: { email: true, name: true } } },
    });
    await Promise.all(
      memberships.map((m) =>
        sendEmail(
          m.user.email,
          `[${user.organizationName}] ${parsed.data.title}`,
          announcementEmail({
            name: m.user.name,
            orgName: user.organizationName,
            title: parsed.data.title,
            body: parsed.data.body,
          }),
        ).catch((e) => console.error("announcement email failed", e)),
      ),
    );
  }

  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function togglePinAction(id: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };
  const a = await prisma.announcement.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!a) return { ok: false, error: "Not found." };
  await prisma.announcement.update({ where: { id }, data: { pinned: !a.pinned } });
  revalidatePath("/announcements");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };
  const a = await prisma.announcement.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!a) return { ok: false, error: "Not found." };
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/announcements");
  return { ok: true };
}
