import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { reset?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back.</h1>
      <p className="text-muted-foreground mt-1 text-sm">Log in to your ScheduleHQ workspace.</p>

      {searchParams.reset === "1" ? (
        <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-emerald-100">
            Password updated. Sign in with your new one.
          </div>
        </div>
      ) : null}

      <LoginForm />
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Don't have a workspace yet?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up for free
        </Link>
      </p>
    </div>
  );
}
