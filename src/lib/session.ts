import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";
import { randomToken } from "./utils";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "shq_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(userId: string, activeOrganizationId: string | null) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  await prisma.session.create({
    data: { userId, token, expiresAt, activeOrganizationId },
  });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return token;
}

export async function destroySession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookies().delete(COOKIE_NAME);
}

export async function setActiveOrg(organizationId: string) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return;
  await prisma.session.updateMany({
    where: { token },
    data: { activeOrganizationId: organizationId },
  });
}

export type OrgOption = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: Role;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  // From the active membership:
  role: Role;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  // Theme: user-level preference wins over org default
  themePreset: string;
  themeAccent: string;
  // All orgs this user belongs to (for the switcher)
  orgs: OrgOption[];
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          memberships: {
            where: { active: true },
            include: { organization: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (!u.active) return null;
  if (u.memberships.length === 0) return null;

  // Pick active membership: stored choice if still valid, otherwise first active.
  const active =
    u.memberships.find((m) => m.organizationId === session.activeOrganizationId) ??
    u.memberships[0];

  // If stored activeOrganizationId drifted (user removed from that org), heal it.
  if (session.activeOrganizationId !== active.organizationId) {
    await prisma.session.update({
      where: { id: session.id },
      data: { activeOrganizationId: active.organizationId },
    });
  }

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: u.emailVerifiedAt !== null,
    role: active.role,
    organizationId: active.organizationId,
    organizationName: active.organization.name,
    organizationSlug: active.organization.slug,
    themePreset: u.themePreset ?? active.organization.themePreset,
    themeAccent: u.themeAccent ?? active.organization.themeAccent,
    orgs: u.memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
      role: m.role,
    })),
  };
});

const RANK: Record<Role, number> = { OWNER: 4, ADMIN: 3, MANAGER: 2, EMPLOYEE: 1 };

export function hasRole(user: Pick<SessionUser, "role">, min: Role): boolean {
  return RANK[user.role] >= RANK[min];
}

export function canManage(actor: Role, target: Role): boolean {
  return RANK[actor] > RANK[target];
}

export function assignableRoles(actor: Role): Role[] {
  switch (actor) {
    case "OWNER":
      return ["ADMIN", "MANAGER", "EMPLOYEE"];
    case "ADMIN":
      return ["MANAGER", "EMPLOYEE"];
    case "MANAGER":
      return ["EMPLOYEE"];
    default:
      return [];
  }
}
