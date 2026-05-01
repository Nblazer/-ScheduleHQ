import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Enter the email on your account. If it matches, we'll send a link to set a new
        password. The link expires in 1 hour.
      </p>
      <ForgotPasswordForm />
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Remembered it?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
