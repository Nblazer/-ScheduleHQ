import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeCustomizer } from "./_components/theme-customizer";
import { ProfileForm } from "./_components/profile-form";
import { PasswordForm } from "./_components/password-form";
import { OrgForm } from "./_components/org-form";
import { LogoForm } from "./_components/logo-form";
import { DeleteAccount } from "./_components/delete-account";
import { WorkspaceLifecycle } from "./_components/workspace-lifecycle";
import { getDeleteAccountBlockers } from "./actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = (await getSessionUser())!;
  const isAdmin = hasRole(user, "ADMIN");
  const isOwner = user.role === "OWNER";

  const [org, dbUser, otherMembers, deleteBlockers] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        name: true,
        themePreset: true,
        themeAccent: true,
        logoDataUrl: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, paymentProfile: true },
    }),
    prisma.membership.findMany({
      where: {
        organizationId: user.organizationId,
        active: true,
        userId: { not: user.id },
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    getDeleteAccountBlockers(),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize ScheduleHQ and manage your workspaces.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how ScheduleHQ looks to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeCustomizer
            userPreset={user.themePreset}
            userAccent={user.themeAccent}
            orgPreset={org?.themePreset ?? "midnight"}
            orgAccent={org?.themeAccent ?? "indigo"}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your display name, phone (shared via Contacts), and how your managers pay you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={user.name}
            initialPhone={dbUser?.phone ?? null}
            initialPaymentProfile={dbUser?.paymentProfile ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your login password.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Your organization's display name and logo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <OrgForm initialName={org?.name ?? ""} />
            <div className="border-t border-border pt-6">
              <div className="text-sm font-medium mb-3">Logo</div>
              <LogoForm orgName={org?.name ?? ""} initialLogo={org?.logoDataUrl ?? null} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>
            Create another one, leave this one, transfer ownership, or delete the
            whole workspace (Owners only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceLifecycle
            isOwner={isOwner}
            orgName={user.organizationName}
            otherMembers={otherMembers.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              role: m.role,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Destructive actions. No going back.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccount blockers={deleteBlockers} />
        </CardContent>
      </Card>
    </div>
  );
}
