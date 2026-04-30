import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgForm } from "../_components/org-form";
import { LogoForm } from "../_components/logo-form";

export const metadata = { title: "Workspace · Settings" };

export default async function WorkspaceSettingsPage() {
  const user = (await getSessionUser())!;
  if (!hasRole(user, "ADMIN")) redirect("/settings/account");

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true, logoDataUrl: true },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>How this business appears in the sidebar and on emails.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgForm initialName={org?.name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Replaces the default ScheduleHQ mark in your sidebar and on printed schedules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoForm orgName={org?.name ?? ""} initialLogo={org?.logoDataUrl ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
