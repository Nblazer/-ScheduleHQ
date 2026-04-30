import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "../_components/profile-form";
import { PasswordForm } from "../_components/password-form";
import { ThemeCustomizer } from "../_components/theme-customizer";

export const metadata = { title: "Account · Settings" };

export default async function AccountSettingsPage() {
  const user = (await getSessionUser())!;
  const isAdmin = hasRole(user, "ADMIN");

  const [dbUser, org] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, paymentProfile: true },
    }),
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { themePreset: true, themeAccent: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your name shows up across every workspace. Phone is shared via Contacts.
            Payment profile is private to managers.
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

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Pick a theme and accent. Saves to your account — follows you across workspaces.
          </CardDescription>
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
    </div>
  );
}
