import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your workspace" };

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div>
      <h1 className="text-2xl font-bold">Create your workspace</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Set up your business in ScheduleHQ. Free, no card required.
      </p>
      <SignupForm />
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
