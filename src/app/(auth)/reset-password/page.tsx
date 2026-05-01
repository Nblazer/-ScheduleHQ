import Link from "next/link";
import { XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "./reset-form";

export const metadata = { title: "Set new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) return <Invalid message="This reset link is missing its token." />;

  const record = await prisma.passwordReset.findUnique({ where: { token } });
  if (!record) {
    return <Invalid message="This reset link is invalid or has already been used." />;
  }
  if (record.usedAt) {
    return <Invalid message="This reset link has already been used. Request a new one." />;
  }
  if (record.expiresAt < new Date()) {
    return <Invalid message="This reset link has expired. Request a new one." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Pick something at least 8 characters. We&apos;ll log you out of every device when
        you save — you&apos;ll need to sign back in on each.
      </p>
      <ResetPasswordForm token={token} />
    </div>
  );
}

function Invalid({ message }: { message: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-rose-500/15 text-rose-400">
        <XCircle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold">Reset link unavailable</h1>
      <p className="text-muted-foreground mt-2">{message}</p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Link href="/forgot-password">
          <Button>Request a new link</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Back to log in</Button>
        </Link>
      </div>
    </div>
  );
}
