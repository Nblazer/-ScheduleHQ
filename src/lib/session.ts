import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";
import { randomToken } from "./utils";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "shq_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  await prisma.session.create({ data: { userId, token, expiresAt } });
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

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  themePreset: string;
  themeAccent: string;
  emailVerified: boolean;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { organization: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (!u.active) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    organizationId: u.organizationId,
    organizationName: u.organization.name,
    organizationSlug: u.organization.slug,
    themePreset: u.themePreset ?? u.organization.themePreset,
    themeAccent: u.themeAccent ?? u.organization.themeAccent,
    emailVerified: u.emailVerifiedAt !== null,
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
