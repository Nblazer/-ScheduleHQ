"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "../actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(acceptInviteAction, null);
  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">Create a password</Label>
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
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Accept invitation
    </Button>
  );
}
