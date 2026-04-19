"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { reportSchema, reportResponseSchema } from "@/lib/validation";

type Result = { ok: true } | { ok: false; error: string };

export async function submitReportAction(_: Result | null, formData: FormData): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = reportSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    priority: formData.get("priority") ?? "NORMAL",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.report.create({
    data: {
      organizationId: user.organizationId,
      submitterId: user.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      priority: parsed.data.priority,
    },
  });

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function respondReportAction(
  id: string,
  input: { status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED"; response: string | null },
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!hasRole(user, "MANAGER")) return { ok: false, error: "Managers+ only." };

  const parsed = reportResponseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const report = await prisma.report.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!report) return { ok: false, error: "Report not found." };

  await prisma.report.update({
    where: { id },
    data: {
      status: parsed.data.status,
      managerResponse: parsed.data.response ?? null,
      respondedAt: parsed.data.response ? new Date() : report.respondedAt,
      assigneeId: user.id,
    },
  });

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { ok: true };
}
