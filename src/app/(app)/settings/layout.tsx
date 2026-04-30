import Link from "next/link";
import { getSessionUser, hasRole } from "@/lib/session";
import { SettingsNav } from "./_components/settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = (await getSessionUser())!;
  const isAdmin = hasRole(user, "ADMIN");
  const isOwner = user.role === "OWNER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, your active workspace ({user.organizationName}), and your plan.
        </p>
      </div>

      <div className="grid lg:grid-cols-[14rem_1fr] gap-6">
        <SettingsNav isAdmin={isAdmin} isOwner={isOwner} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
