"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null);
  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="mb-1.5">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline mb-1.5"
            tabIndex={-1}
          >
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Log in
    </Button>
  );
}
