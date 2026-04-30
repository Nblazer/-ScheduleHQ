import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PAYMENTS_ENABLED } from "@/lib/plan";
import { PlanSection } from "../_components/plan-section";

export const metadata = { title: "Plan · Settings" };

export default async function PlanSettingsPage() {
  const user = (await getSessionUser())!;

  const [dbUser, ownedCount, activeMembersCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    }),
    prisma.membership.count({
      where: { userId: user.id, role: "OWNER", active: true },
    }),
    prisma.membership.count({
      where: { organizationId: user.organizationId, active: true },
    }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan & billing</CardTitle>
        <CardDescription>
          Free is fine for most small teams. Upgrade when you need more headroom.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlanSection
          currentPlan={dbUser?.plan ?? "FREE"}
          ownedWorkspaces={ownedCount}
          activeMembersInCurrentOrg={activeMembersCount}
          paymentsEnabled={PAYMENTS_ENABLED}
        />
      </CardContent>
    </Card>
  );
}
