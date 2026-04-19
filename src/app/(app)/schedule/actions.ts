"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { sendEmail, shiftNotificationEmail } from "@/lib/email";
import { dayNoteSchema, shiftSchema } from "@/lib/validation";
import { formatDate, formatTime } from "@/lib/utils";

type Result = { ok: true } | { ok: false; error: string };

export async function createShiftAction(_: Result | null, formData: FormData): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsed = shiftSchema.safeParse({
    employeeId: formData.get("employeeId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    position: formData.get("position") || null,
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const employee = await prisma.user.findFirst({
    where: { id: parsed.data.employeeId, organizationId: user.organizationId },
  });
  if (!employee) return { ok: false, error: "Employee not found in your organization." };

  await prisma.shift.create({
    data: {
      organizationId: user.organizationId,
      employeeId: employee.id,
      createdById: user.id,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      position: parsed.data.position ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  sendEmail(
    employee.email,
    `New shift — ${formatDate(parsed.data.startsAt, { weekday: "long", month: "short", day: "numeric" })}`,
    shiftNotificationEmail({
      name: employee.name,
      orgName: user.organizationName,
      when: `${formatDate(parsed.data.startsAt, { weekday: "long", month: "long", day: "numeric" })} · ${formatTime(parsed.data.startsAt)} – ${formatTime(parsed.data.endsAt)}`,
      position: parsed.data.position ?? null,
      notes: parsed.data.notes ?? null,
    }),
  ).catch((e) => console.error("shift email failed", e));

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteShiftAction(id: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };
  const shift = await prisma.shift.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!shift) return { ok: false, error: "Shift not found." };
  await prisma.shift.delete({ where: { id } });
  revalidatePath("/schedule");
  return { ok: true };
}

export async function createDayNoteAction(_: Result | null, formData: FormData): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsed = dayNoteSchema.safeParse({
    date: formData.get("date"),
    title: formData.get("title"),
    body: formData.get("body") || null,
    color: formData.get("color") || "blue",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // Normalize to UTC midnight
  const d = parsed.data.date;
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  await prisma.dayNote.create({
    data: {
      organizationId: user.organizationId,
      date: utc,
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      color: parsed.data.color,
      createdById: user.id,
    },
  });
  revalidatePath("/schedule");
  return { ok: true };
}

export async function deleteDayNoteAction(id: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };
  const note = await prisma.dayNote.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!note) return { ok: false, error: "Note not found." };
  await prisma.dayNote.delete({ where: { id } });
  revalidatePath("/schedule");
  return { ok: true };
}
