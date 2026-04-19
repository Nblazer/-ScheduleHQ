import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeCustomizer } from "./_components/theme-customizer";
import { ProfileForm } from "./_components/profile-form";
import { PasswordForm } from "./_components/password-form";
import { OrgForm } from "./_components/org-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = (await getSessionUser())!;
  const isAdmin = hasRole(user, "ADMIN");
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true, themePreset: true, themeAccent: true },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize ScheduleHQ and manage your account.</p>
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
          <CardDescription>Your display name inside the workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialName={user.name} />
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
            <CardDescription>Your organization's display name.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrgForm initialName={org?.name ?? ""} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
