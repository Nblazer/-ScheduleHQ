"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { acceptInviteForExistingAction } from "./existing-actions";

// For invitees who already have a ScheduleHQ account — no password input needed.
export function AcceptInviteForExistingUser({ token }: { token: string }) {
  const [error, setError] = React.useState<string | null>(null);
  const toast = useToast();

  async function formAction(formData: FormData) {
    const r = await acceptInviteForExistingAction(formData);
    if (r && !r.ok) {
      setError(r.error);
      toast.error(r.error);
    }
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      {error ? <FieldError>{error}</FieldError> : null}
      <p className="text-xs text-muted-foreground">
        If you aren't logged in, you'll be asked to log in first — then the workspace is added to your
        sidebar automatically.
      </p>
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
