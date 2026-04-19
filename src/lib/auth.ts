import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { randomToken, slugify } from "./utils";
import { sendEmail, verificationEmail, inviteEmail } from "./email";
import type { Role } from "@prisma/client";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
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

  const { user, verificationToken } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName, slug } });
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: "OWNER",
        organizationId: org.id,
      },
      include: { organization: true },
    });
    const token = randomToken(24);
    await tx.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      },
    });
    return { user, verificationToken: token };
  });

  await sendEmail(
    user.email,
    "Confirm your ScheduleHQ account",
    verificationEmail({ name: user.name, token: verificationToken }),
  ).catch((e) => console.error("verification email failed", e));

  return user;
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
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) },
  });
  await sendEmail(
    user.email,
    "Confirm your ScheduleHQ account",
    verificationEmail({ name: user.name, token }),
  );
}

export async function createInvite(params: {
  organizationId: string;
  organizationName: string;
  inviterName: string;
  email: string;
  name: string;
  role: Role;
}) {
  const email = params.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists.");

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

  await sendEmail(
    email,
    `You've been invited to ${params.organizationName} on ScheduleHQ`,
    inviteEmail({
      name: params.name,
      inviterName: params.inviterName,
      orgName: params.organizationName,
      token,
    }),
  ).catch((e) => console.error("invite email failed", e));

  return invite;
}

export async function acceptInvite(params: { token: string; password: string }) {
  const invite = await prisma.invite.findUnique({ where: { token: params.token } });
  if (!invite) throw new Error("Invalid invite link.");
  if (invite.acceptedAt) throw new Error("This invite has already been used.");
  if (invite.expiresAt < new Date()) throw new Error("This invite has expired.");

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) throw new Error("An account with that email already exists.");

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
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return user;
  });

  return user;
}
