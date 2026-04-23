"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveProfileAction } from "../actions";

export function ProfileForm({
  initialName,
  initialPhone,
  initialPaymentProfile,
}: {
  initialName: string;
  initialPhone: string | null;
  initialPaymentProfile: string | null;
}) {
  const [state, formAction] = useFormState(saveProfileAction, null);
  const toast = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Profile saved.");
      router.refresh();
    }
  }, [state, router, toast]);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="name">Display name</Label>
        <Input id="name" name="name" required defaultValue={initialName} maxLength={80} />
      </div>
      <div>
        <Label htmlFor="phone">Phone (visible to teammates in Contacts)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialPhone ?? ""}
          maxLength={40}
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <Label htmlFor="paymentProfile">Payment profile (how your manager pays you)</Label>
        <Input
          id="paymentProfile"
          name="paymentProfile"
          defaultValue={initialPaymentProfile ?? ""}
          maxLength={120}
          placeholder="@venmo-handle · paypal.me/you · Cash App $you"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Whatever your manager uses to send your pay. Only managers of your workspaces see it.
        </p>
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
      Save profile
    </Button>
  );
}
