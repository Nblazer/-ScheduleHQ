"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { changePasswordAction } from "../actions";

export function PasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, null);
  const toast = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Password updated.");
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          name="next"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Change password
    </Button>
  );
}
