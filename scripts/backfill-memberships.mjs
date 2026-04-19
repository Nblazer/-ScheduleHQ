// One-time migration: create a Membership row for every existing User
// based on their legacy User.organizationId / User.role / User.active.
//
// Run once, locally, against your prod (or dev) database:
//   DATABASE_URL="<your url>" node scripts/backfill-memberships.mjs
//
// Safe to run multiple times — it skips users who already have a membership
// for their legacy org.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      organizationId: true,
      role: true,
      active: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const u of users) {
    if (!u.organizationId) {
      skipped++;
      continue;
    }
    const existing = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: u.id, organizationId: u.organizationId },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.membership.create({
      data: {
        userId: u.id,
        organizationId: u.organizationId,
        role: u.role,
        active: u.active,
      },
    });
    console.log(`  created membership for ${u.email} in org ${u.organizationId}`);
    created++;
  }

  console.log(`\nDone. created=${created} skipped=${skipped} total=${users.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
