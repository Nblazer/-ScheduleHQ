"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { reminderSchema } from "@/lib/validation";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function createReminderAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = reminderSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") || null,
    color: formData.get("color") || "indigo",
    scheduledAt: formData.get("scheduledAt"),
    recurrence: formData.get("recurrence") || "NONE",
    recurrenceUntil: formData.get("recurrenceUntil") || null,
    notifyBeforeMinutes: formData.get("notifyBeforeMinutes") ?? 0,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const created = await prisma.personalReminder.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      color: parsed.data.color,
      scheduledAt: parsed.data.scheduledAt,
      recurrence: parsed.data.recurrence,
      recurrenceUntil: parsed.data.recurrenceUntil ?? null,
      notifyBeforeMinutes: parsed.data.notifyBeforeMinutes,
    },
  });
  revalidatePath("/calendar");
  revalidatePath("/", "layout");
  return { ok: true, id: created.id };
}

export async function updateReminderAction(
  id: string,
  input: {
    title: string;
    body: string | null;
    color: string;
    scheduledAt: Date;
    recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    recurrenceUntil: Date | null;
    notifyBeforeMinutes: number;
  },
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.personalReminder.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return { ok: false, error: "Reminder not found." };

  await prisma.personalReminder.update({
    where: { id },
    data: {
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      color: parsed.data.color,
      scheduledAt: parsed.data.scheduledAt,
      recurrence: parsed.data.recurrence,
      recurrenceUntil: parsed.data.recurrenceUntil ?? null,
      notifyBeforeMinutes: parsed.data.notifyBeforeMinutes,
      // Editing a reminder clears any prior dismissal so the new occurrence fires.
      lastDismissedAt: null,
    },
  });
  revalidatePath("/calendar");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteReminderAction(id: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const existing = await prisma.personalReminder.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return { ok: false, error: "Reminder not found." };
  await prisma.personalReminder.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/", "layout");
  return { ok: true };
}

// Mark a fired reminder as acknowledged. For non-recurring this effectively
// silences it forever (next-occurrence becomes null). For recurring it just
// skips the current instance — the next one fires as usual.
export async function dismissReminderAction(id: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const existing = await prisma.personalReminder.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return { ok: false, error: "Reminder not found." };
  await prisma.personalReminder.update({
    where: { id },
    data: { lastDismissedAt: new Date() },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
