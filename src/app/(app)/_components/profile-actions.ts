"use server";

import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";

export type ProfileDetails = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";
  active: boolean;
  joinedAt: string;
  emailVerified: boolean;
  // Visibility-gated fields. null when the viewer can't see them.
  canSeeRate: boolean;
  rateCents: number | null;
  weekHoursMinutes: number | null;
  weekEarningsCents: number | null;
  weekShifts: number | null;
  // Manager-only.
  paymentProfile: string | null;
  // Universal: number of orgs this user is in (no names — privacy).
  totalWorkspaces: number;
};

// Fetch profile details for a member of the viewer's currently active workspace.
// Privacy:
//   - Always: name, email, phone, role, joinedAt
//   - Self OR manager+: hourly rate, weekly hours, weekly earnings
//   - Manager+ only: payment profile
export async function getProfileDetailsAction(userId: string): Promise<{
  ok: true;
  details: ProfileDetails;
} | { ok: false; error: string }> {
  const viewer = await getSessionUser();
  if (!viewer) return { ok: false, error: "Not signed in." };

  // Confirm both viewer + target are in the active org.
  const [targetMember, targetUser, totalWorkspaces] = await Promise.all([
    prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: viewer.organizationId,
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        paymentProfile: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    }),
    prisma.membership.count({
      where: { userId, active: true },
    }),
  ]);

  if (!targetMember || !targetUser) {
    return { ok: false, error: "User isn't in this workspace." };
  }

  const isSelf = userId === viewer.id;
  const isManager = hasRole(viewer, "MANAGER");
  const canSeeRate = isSelf || isManager;
  const canSeeManagerFields = isManager;

  // Compute weekly hours + earnings if the viewer is allowed.
  let weekHoursMinutes: number | null = null;
  let weekEarningsCents: number | null = null;
  let weekShifts: number | null = null;

  if (canSeeRate) {
    const now = new Date();
    const weekStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const shifts = await prisma.shift.findMany({
      where: {
        organizationId: viewer.organizationId,
        employeeId: userId,
        startsAt: { gte: weekStart, lt: weekEnd },
      },
      select: { startsAt: true, endsAt: true },
    });
    weekShifts = shifts.length;
    weekHoursMinutes = shifts.reduce(
      (acc, s) => acc + Math.max(0, (s.endsAt.getTime() - s.startsAt.getTime()) / 60000),
      0,
    );
    weekEarningsCents =
      targetMember.hourlyRateCents != null
        ? Math.round((weekHoursMinutes / 60) * targetMember.hourlyRateCents)
        : null;
  }

  return {
    ok: true,
    details: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      role: targetMember.role,
      active: targetMember.active,
      joinedAt: targetMember.createdAt.toISOString(),
      emailVerified: targetUser.emailVerifiedAt !== null,
      canSeeRate,
      rateCents: canSeeRate ? targetMember.hourlyRateCents : null,
      weekHoursMinutes,
      weekEarningsCents,
      weekShifts,
      paymentProfile: canSeeManagerFields ? targetUser.paymentProfile : null,
      totalWorkspaces,
    },
  };
}
