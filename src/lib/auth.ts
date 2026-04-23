import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { randomToken, slugify } from "./utils";
import { sendEmail, verificationEmail, inviteEmail, addedToOrgEmail } from "./email";
import type { Role } from "@prisma/client";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function inviteUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/invite?token=${token}`;
}

// Create a new organization owned by an existing user. Used by the "New
// workspace" button in settings so a user can spin up more businesses
// without signing up again.
export async function createAdditionalWorkspace(params: {
  userId: string;
  orgName: string;
}) {
  let slug = slugify(params.orgName) || "org";
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(params.orgName)}-${attempt}`;
    if (attempt > 50) throw new Error("Could not create a unique org slug.");
  }
  const { organization } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: params.orgName, slug } });
    await tx.membership.create({
      data: { userId: params.userId, organizationId: org.id, role: "OWNER" },
    });
    return { organization: org };
  });
  return organization;
}

export async function createOrganizationAndOwner(params: {
  orgName: string;
  name: string;
  email: string;
  password: string;
}) {
  const { orgName, name, email, password } = params;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error("An account with that email already exists.");

  let slug = slugify(orgName) || "org";
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(orgName)}-${attempt}`;
    if (attempt > 50) throw new Error("Could not create a unique org slug.");
  }

  const passwordHash = await hashPassword(password);

  const { user, organization, verificationToken } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName, slug } });
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        // Legacy fields kept for schema compat; authoritative in Membership.
        role: "OWNER",
        organizationId: org.id,
      },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "OWNER",
      },
    });
    const token = randomToken(24);
    await tx.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      },
    });
    return { user, organization: org, verificationToken: token };
  });

  await sendEmail(
    user.email,
    "Confirm your ScheduleHQ account",
    verificationEmail({ name: user.name, token: verificationToken }),
  ).catch((e) => console.error("verification email failed", e));

  return { user, organization };
}

export async function consumeVerificationToken(token: string) {
  const record = await prisma.emailVerification.findUnique({ where: { token } });
  if (!record) return { ok: false as const, reason: "invalid" };
  if (record.usedAt) return { ok: false as const, reason: "used" };
  if (record.expiresAt < new Date()) return { ok: false as const, reason: "expired" };
  await prisma.$transaction([
    prisma.emailVerification.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
  ]);
  return { ok: true as const };
}

export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerifiedAt) return;
  const token = randomToken(24);
  await prisma.emailVerification.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS), },
  });
  await sendEmail(
    user.email,
    "Confirm your ScheduleHQ account",
    verificationEmail({ name: user.name, token }),
  );
}

export type InviteOutcome = {
  inviteId: string;
  token: string;
  email: string;
  name: string;
  alreadyHasAccount: boolean;
};

// Invite someone to an organization.
// Always creates an Invite + link that the invitee must explicitly accept.
// Works whether or not they already have a ScheduleHQ account — the accept
// page branches on that server-side.
export async function inviteToOrganization(params: {
  organizationId: string;
  organizationName: string;
  inviterName: string;
  email: string;
  name: string;
  role: Role;
}): Promise<InviteOutcome> {
  const email = params.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });

  if (existingUser) {
    const already = existingUser.memberships.find(
      (m) => m.organizationId === params.organizationId,
    );
    if (already && already.active) {
      throw new Error("This user is already a member of this workspace.");
    }
  }

  // If there's already a pending, non-expired invite for this email/org pair,
  // return it instead of duplicating. The UI can re-copy the link.
  const pending = await prisma.invite.findFirst({
    where: {
      organizationId: params.organizationId,
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (pending) {
    return {
      inviteId: pending.id,
      token: pending.token,
      email,
      name: pending.name,
      alreadyHasAccount: Boolean(existingUser),
    };
  }

  const token = randomToken(24);
  const invite = await prisma.invite.create({
    data: {
      organizationId: params.organizationId,
      email,
      name: params.name,
      role: params.role,
      token,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  sendEmail(
    email,
    `You've been invited to ${params.organizationName} on ScheduleHQ`,
    inviteEmail({
      name: params.name,
      inviterName: params.inviterName,
      orgName: params.organizationName,
      token,
    }),
  ).catch((e) => console.error("invite email failed", e));

  return {
    inviteId: invite.id,
    token: invite.token,
    email,
    name: params.name,
    alreadyHasAccount: Boolean(existingUser),
  };
}

export async function acceptInvite(params: { token: string; password: string }) {
  const invite = await prisma.invite.findUnique({ where: { token: params.token } });
  if (!invite) throw new Error("Invalid invite link.");
  if (invite.acceptedAt) throw new Error("This invite has already been used.");
  if (invite.expiresAt < new Date()) throw new Error("This invite has expired.");

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    include: { memberships: true },
  });

  if (existingUser) {
    // Someone created an account on ScheduleHQ between invite-send and invite-accept.
    // Attach them to this org instead of blocking.
    if (!existingUser.memberships.some((m) => m.organizationId === invite.organizationId)) {
      await prisma.membership.create({
        data: {
          userId: existingUser.id,
          organizationId: invite.organizationId,
          role: invite.role,
        },
      });
    }
    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return { user: existingUser, organizationId: invite.organizationId };
  }

  const passwordHash = await hashPassword(params.password);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: invite.email,
        name: invite.name,
        passwordHash,
        role: invite.role,
        organizationId: invite.organizationId,
        // Invited users skip email confirmation — the invite itself proves ownership.
        emailVerifiedAt: new Date(),
      },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return user;
  });

  return { user, organizationId: invite.organizationId };
}
