"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { sendEmail, shiftNotificationEmail } from "@/lib/email";
import { dayNoteSchema, deleteScopeSchema, shiftSchema, type DeleteScope } from "@/lib/validation";
import { formatDate, formatTime } from "@/lib/utils";

type Result = { ok: true } | { ok: false; error: string };

// Generate the list of start dates for a weekly recurrence.
// Given an initial date + the days-of-week pattern, produce one date per
// matching day across `weeks` consecutive weeks, including the original.
function weeklyDates(start: Date, daysOfWeek: number[], weeks: number): Date[] {
  // Start from the Sunday of the start date's week.
  const weekStart = new Date(start);
  weekStart.setUTCDate(start.getUTCDate() - start.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);

  const originalDow = start.getUTCDay();
  const selected = daysOfWeek.length > 0 ? [...new Set(daysOfWeek)].sort() : [originalDow];

  const out: Date[] = [];
  for (let w = 0; w < weeks; w++) {
    for (const dow of selected) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + w * 7 + dow);
      d.setUTCHours(start.getUTCHours(), start.getUTCMinutes(), 0, 0);
      // Only include dates on/after the original start to avoid "past" instances.
      if (d.getTime() >= start.getTime() - 60 * 1000) out.push(d);
    }
  }
  return out;
}

export async function createShiftAction(_: Result | null, formData: FormData): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const recurrenceRaw = formData.get("recurrence");
  let recurrence: { frequency: "NONE" | "WEEKLY"; daysOfWeek: number[]; weeks: number } | undefined;
  if (typeof recurrenceRaw === "string" && recurrenceRaw) {
    try {
      recurrence = JSON.parse(recurrenceRaw);
    } catch {
      return { ok: false, error: "Invalid recurrence settings." };
    }
  }

  const parsed = shiftSchema.safeParse({
    employeeId: formData.get("employeeId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    position: formData.get("position") || null,
    notes: formData.get("notes") || null,
    recurrence,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: parsed.data.employeeId,
        organizationId: user.organizationId,
      },
    },
    include: { user: true },
  });
  if (!membership || !membership.active) {
    return { ok: false, error: "Employee not found in your organization." };
  }
  const employee = membership.user;

  const durationMs = parsed.data.endsAt.getTime() - parsed.data.startsAt.getTime();
  const rec = parsed.data.recurrence;
  const recurring = rec && rec.frequency === "WEEKLY";

  const starts = recurring
    ? weeklyDates(parsed.data.startsAt, rec!.daysOfWeek, rec!.weeks)
    : [parsed.data.startsAt];

  if (starts.length === 0) {
    return { ok: false, error: "Recurrence produced no shifts — pick at least one day of week." };
  }

  const seriesId = recurring ? randomUUID() : null;
  const payloads = starts.map((s) => ({
    organizationId: user.organizationId,
    employeeId: employee.id,
    createdById: user.id,
    startsAt: s,
    endsAt: new Date(s.getTime() + durationMs),
    position: parsed.data.position ?? null,
    notes: parsed.data.notes ?? null,
    seriesId,
  }));

  await prisma.shift.createMany({ data: payloads });

  // Email the employee once, summarizing the first (and additional) shifts.
  sendEmail(
    employee.email,
    recurring
      ? `${payloads.length} new shifts scheduled`
      : `New shift — ${formatDate(parsed.data.startsAt, { weekday: "long", month: "short", day: "numeric" })}`,
    shiftNotificationEmail({
      name: employee.name,
      orgName: user.organizationName,
      when: recurring
        ? `${payloads.length} shifts starting ${formatDate(starts[0], { weekday: "long", month: "long", day: "numeric" })} at ${formatTime(starts[0])}`
        : `${formatDate(parsed.data.startsAt, { weekday: "long", month: "long", day: "numeric" })} · ${formatTime(parsed.data.startsAt)} – ${formatTime(parsed.data.endsAt)}`,
      position: parsed.data.position ?? null,
      notes: parsed.data.notes ?? null,
    }),
  ).catch((e) => console.error("shift email failed", e));

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteShiftAction(id: string, scope: DeleteScope = "single"): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsedScope = deleteScopeSchema.safeParse(scope);
  if (!parsedScope.success) return { ok: false, error: "Invalid scope." };

  const shift = await prisma.shift.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!shift) return { ok: false, error: "Shift not found." };

  if (parsedScope.data === "single" || !shift.seriesId) {
    await prisma.shift.delete({ where: { id } });
  } else if (parsedScope.data === "future") {
    await prisma.shift.deleteMany({
      where: {
        organizationId: user.organizationId,
        seriesId: shift.seriesId,
        startsAt: { gte: shift.startsAt },
      },
    });
  } else {
    await prisma.shift.deleteMany({
      where: { organizationId: user.organizationId, seriesId: shift.seriesId },
    });
  }

  revalidatePath("/schedule");
  return { ok: true };
}

export async function createDayNoteAction(_: Result | null, formData: FormData): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const recurrenceRaw = formData.get("recurrence");
  let recurrence: { frequency: "NONE" | "WEEKLY"; daysOfWeek: number[]; weeks: number } | undefined;
  if (typeof recurrenceRaw === "string" && recurrenceRaw) {
    try {
      recurrence = JSON.parse(recurrenceRaw);
    } catch {
      return { ok: false, error: "Invalid recurrence settings." };
    }
  }

  const parsed = dayNoteSchema.safeParse({
    date: formData.get("date"),
    title: formData.get("title"),
    body: formData.get("body") || null,
    color: formData.get("color") || "blue",
    recurrence,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const rec = parsed.data.recurrence;
  const recurring = rec && rec.frequency === "WEEKLY";

  // Normalize each date to UTC midnight.
  const base = parsed.data.date;
  const baseUtc = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));

  const dates = recurring
    ? weeklyDates(baseUtc, rec!.daysOfWeek, rec!.weeks).map(
        (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())),
      )
    : [baseUtc];

  if (dates.length === 0) {
    return { ok: false, error: "Recurrence produced no notes — pick at least one day of week." };
  }

  const seriesId = recurring ? randomUUID() : null;
  await prisma.dayNote.createMany({
    data: dates.map((d) => ({
      organizationId: user.organizationId,
      date: d,
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      color: parsed.data.color,
      createdById: user.id,
      seriesId,
    })),
  });

  revalidatePath("/schedule");
  return { ok: true };
}

export async function deleteDayNoteAction(id: string, scope: DeleteScope = "single"): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsedScope = deleteScopeSchema.safeParse(scope);
  if (!parsedScope.success) return { ok: false, error: "Invalid scope." };

  const note = await prisma.dayNote.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!note) return { ok: false, error: "Note not found." };

  if (parsedScope.data === "single" || !note.seriesId) {
    await prisma.dayNote.delete({ where: { id } });
  } else if (parsedScope.data === "future") {
    await prisma.dayNote.deleteMany({
      where: {
        organizationId: user.organizationId,
        seriesId: note.seriesId,
        date: { gte: note.date },
      },
    });
  } else {
    await prisma.dayNote.deleteMany({
      where: { organizationId: user.organizationId, seriesId: note.seriesId },
    });
  }

  revalidatePath("/schedule");
  return { ok: true };
}
