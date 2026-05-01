"use client";

import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, null);

  if (state?.ok) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-emerald-100">Check your email</div>
            <div className="text-emerald-200/80 mt-1 leading-relaxed">
              If an account exists for that address, a reset link is on its way. Open
              the email and click the button to set a new password — link expires in
              1 hour. Didn&apos;t get one? Check your spam folder, or try again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
      </div>
      {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Send reset link
    </Button>
  );
}
