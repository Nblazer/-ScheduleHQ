"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { deleteAccountAction } from "../actions";

export function DeleteAccount({ blockers }: { blockers: { orgId: string; orgName: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const blocked = blockers.length > 0;

  return (
    <>
      {blocked ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-amber-200">Can't delete yet</div>
              <div className="text-amber-200/80 mt-1">
                You're the only owner of{" "}
                <span className="font-medium">
                  {blockers.map((b) => b.orgName).join(", ")}
                </span>
                . Promote another member to Owner first, or the workspace would be
                orphaned.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="text-sm">
          <div className="font-medium">Delete account</div>
          <div className="text-muted-foreground mt-1">
            Permanently removes your account from every workspace you're in. Past shifts
            you were assigned to are deleted. Records you authored are reassigned to the
            remaining Owner. This can't be undone.
          </div>
        </div>
        <Button variant="destructive" onClick={() => setOpen(true)} disabled={blocked}>
          <Trash2 className="h-4 w-4" /> Delete account
        </Button>
      </div>

      {open && <ConfirmDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function ConfirmDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState(deleteAccountAction, null);
  return (
    <Dialog open onClose={onClose}>
      <DialogHeader title="Delete your account?" description="This is permanent." />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="password">Confirm with your password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <div>
            <Label htmlFor="confirm">
              Type <code className="font-mono bg-muted px-1 rounded">DELETE</code> to confirm
            </Label>
            <Input id="confirm" name="confirm" required autoComplete="off" placeholder="DELETE" />
          </div>
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Submit />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" loading={pending}>
      Permanently delete
    </Button>
  );
}
