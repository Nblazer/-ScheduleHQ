import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back.</h1>
      <p className="text-muted-foreground mt-1 text-sm">Log in to your ScheduleHQ workspace.</p>
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
