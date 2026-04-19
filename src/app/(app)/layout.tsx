import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "./_components/app-shell";
import { VerifyBanner } from "./_components/verify-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      {!user.emailVerified ? <VerifyBanner email={user.email} /> : null}
      {children}
    </AppShell>
  );
}
