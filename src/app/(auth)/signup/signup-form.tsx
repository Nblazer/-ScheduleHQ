"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signupAction } from "../actions";

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, null);
  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="orgName">Business name</Label>
        <Input
          id="orgName"
          name="orgName"
          placeholder="e.g. Dunkin' — Main St"
          required
          maxLength={80}
        />
      </div>
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" placeholder="Jamie Ortiz" required maxLength={80} autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground mt-1">At least 8 characters.</p>
      </div>
      {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
      <SubmitButton />
      <p className="text-xs text-muted-foreground text-center pt-2">
        By creating an account you agree to receive transactional email related to your workspace.
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Create workspace
    </Button>
  );
}
