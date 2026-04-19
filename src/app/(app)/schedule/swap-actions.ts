"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { swapRequestSchema } from "@/lib/validation";

type Result = { ok: true } | { ok: false; error: string };

export async function requestSwapAction(
  _: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = swapRequestSchema.safeParse({
    requesterShiftId: formData.get("requesterShiftId"),
    targetUserId: formData.get("targetUserId"),
    targetShiftId: formData.get("targetShiftId") || null,
    note: formData.get("note") || null,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // Requester must own this shift.
  const requesterShift = await prisma.shift.findFirst({
    where: {
      id: parsed.data.requesterShiftId,
      organizationId: user.organizationId,
      employeeId: user.id,
    },
  });
  if (!requesterShift) return { ok: false, error: "That shift isn't yours." };

  if (parsed.data.targetUserId === user.id) {
    return { ok: false, error: "You can't swap with yourself." };
  }

  const target = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: parsed.data.targetUserId,
        organizationId: user.organizationId,
      },
    },
  });
  if (!target || !target.active) {
    return { ok: false, error: "That teammate isn't in your workspace." };
  }

  // If they picked a target shift to trade for, validate ownership.
  if (parsed.data.targetShiftId) {
    const targetShift = await prisma.shift.findFirst({
      where: {
        id: parsed.data.targetShiftId,
        organizationId: user.organizationId,
        employeeId: parsed.data.targetUserId,
      },
    });
    if (!targetShift) {
      return { ok: false, error: "That teammate's shift no longer exists." };
    }
  }

  // Block duplicates (one pending request per (requester, requesterShift, target)).
  const dup = await prisma.shiftSwapRequest.findFirst({
    where: {
      organizationId: user.organizationId,
      requesterId: user.id,
      requesterShiftId: parsed.data.requesterShiftId,
      targetUserId: parsed.data.targetUserId,
      status: "PENDING",
    },
  });
  if (dup) return { ok: false, error: "You already have a pending request for this shift with this teammate." };

  await prisma.shiftSwapRequest.create({
    data: {
      organizationId: user.organizationId,
      requesterId: user.id,
      requesterShiftId: parsed.data.requesterShiftId,
      targetUserId: parsed.data.targetUserId,
      targetShiftId: parsed.data.targetShiftId ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath("/schedule");
  revalidatePath("/", "layout"); // refresh notification bell
  return { ok: true };
}

export async function acceptSwapAction(swapId: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const swap = await prisma.shiftSwapRequest.findFirst({
    where: {
      id: swapId,
      organizationId: user.organizationId,
      targetUserId: user.id,
      status: "PENDING",
    },
  });
  if (!swap) return { ok: false, error: "Swap request not found or already resolved." };

  // Re-fetch the underlying shifts to make sure they still exist and belong to the
  // expected users (protects against shifts being deleted or edited mid-flight).
  const requesterShift = await prisma.shift.findFirst({
    where: {
      id: swap.requesterShiftId,
      organizationId: user.organizationId,
      employeeId: swap.requesterId,
    },
  });
  if (!requesterShift) {
    await prisma.shiftSwapRequest.update({
      where: { id: swap.id },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
    return { ok: false, error: "That shift no longer exists." };
  }

  let targetShift: typeof requesterShift | null = null;
  if (swap.targetShiftId) {
    targetShift = await prisma.shift.findFirst({
      where: {
        id: swap.targetShiftId,
        organizationId: user.organizationId,
        employeeId: user.id,
      },
    });
    if (!targetShift) {
      await prisma.shiftSwapRequest.update({
        where: { id: swap.id },
        data: { status: "CANCELLED", resolvedAt: new Date() },
      });
      return { ok: false, error: "Your shift in the swap no longer exists." };
    }
  }

  // Atomic swap: requester's shift → target; target's shift (if any) → requester.
  await prisma.$transaction([
    prisma.shift.update({
      where: { id: requesterShift.id },
      data: { employeeId: user.id },
    }),
    ...(targetShift
      ? [
          prisma.shift.update({
            where: { id: targetShift.id },
            data: { employeeId: swap.requesterId },
          }),
        ]
      : []),
    prisma.shiftSwapRequest.update({
      where: { id: swap.id },
      data: { status: "ACCEPTED", resolvedAt: new Date() },
    }),
  ]);

  revalidatePath("/schedule");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function declineSwapAction(swapId: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const swap = await prisma.shiftSwapRequest.findFirst({
    where: {
      id: swapId,
      organizationId: user.organizationId,
      targetUserId: user.id,
      status: "PENDING",
    },
  });
  if (!swap) return { ok: false, error: "Swap request not found or already resolved." };

  await prisma.shiftSwapRequest.update({
    where: { id: swap.id },
    data: { status: "DECLINED", resolvedAt: new Date() },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cancelSwapAction(swapId: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const swap = await prisma.shiftSwapRequest.findFirst({
    where: {
      id: swapId,
      organizationId: user.organizationId,
      requesterId: user.id,
      status: "PENDING",
    },
  });
  if (!swap) return { ok: false, error: "Request not found or already resolved." };

  await prisma.shiftSwapRequest.update({
    where: { id: swap.id },
    data: { status: "CANCELLED", resolvedAt: new Date() },
  });

  revalidatePath("/schedule");
  revalidatePath("/", "layout");
  return { ok: true };
}
