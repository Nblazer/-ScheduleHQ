"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, setActiveOrg } from "@/lib/session";

export async function switchOrgAction(organizationId: string) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Verify the user is actually a member of the target org.
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId },
    },
  });
  if (!membership || !membership.active) return;

  await setActiveOrg(organizationId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
