"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveProfileAction } from "../actions";

export function ProfileForm({ initialName }: { initialName: string }) {
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
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name">Display name</Label>
        <Input id="name" name="name" required defaultValue={initialName} maxLength={80} />
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
