"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { resendVerificationAction } from "@/app/(auth)/actions";

export function VerifyBanner({ email }: { email: string }) {
  const toast = useToast();
  const [pending, start] = React.useTransition();

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <Mail className="h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm">
        <strong>Verify your email.</strong> We sent a confirmation link to{" "}
        <span className="font-medium">{email}</span>. Some features stay locked until you confirm.
      </div>
      <Button
        size="sm"
        variant="outline"
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await resendVerificationAction();
            if (res.ok) toast.success("Verification email sent.");
            else toast.error(res.error);
          })
        }
      >
        Resend email
      </Button>
    </div>
  );
}
