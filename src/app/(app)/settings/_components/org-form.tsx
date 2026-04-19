"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveOrgAction } from "../actions";

export function OrgForm({ initialName }: { initialName: string }) {
  const [state, formAction] = useFormState(saveOrgAction, null);
  const toast = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Workspace updated.");
      router.refresh();
    }
  }, [state, router, toast]);

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="orgName">Workspace name</Label>
        <Input id="orgName" name="orgName" required defaultValue={initialName} maxLength={80} />
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
      Save workspace
    </Button>
  );
}
