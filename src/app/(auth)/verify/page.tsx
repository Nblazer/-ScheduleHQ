import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { consumeVerificationToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Verify email" };

export default async function VerifyPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  if (!token) {
    return <State ok={false} title="No token provided" message="This link is missing its verification token." />;
  }
  const result = await consumeVerificationToken(token);
  if (result.ok) {
    return (
      <State
        ok
        title="Email confirmed."
        message="Your email is verified. You can close this tab or jump back to the app."
      />
    );
  }
  const reason =
    result.reason === "expired"
      ? "This link has expired. Log in and request a new one."
      : result.reason === "used"
        ? "This link has already been used."
        : "This link is no longer valid.";
  return <State ok={false} title="Could not verify" message={reason} />;
}

function State({ ok, title, message }: { ok: boolean; title: string; message: string }) {
  return (
    <div className="text-center">
      <div
        className={
          "mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 " +
          (ok ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")
        }
      >
        {ok ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">{message}</p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Log in</Button>
        </Link>
      </div>
    </div>
  );
}
