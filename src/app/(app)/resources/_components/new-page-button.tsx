"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { createResourcePageAction } from "../actions";

export function NewResourcePageButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New page
      </Button>
      {open && <NewPageDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function NewPageDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState(createResourcePageAction, null);
  // On success, the server action redirects into the new page; no client-side close needed.

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader
        title="New resource page"
        description="A space for anything — training videos, links, notes. You can edit after creation."
      />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Input id="icon" name="icon" maxLength={8} placeholder="📚" className="w-20 text-center text-lg" />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required maxLength={120} placeholder="e.g. Training Videos" autoFocus />
            </div>
          </div>
          <div>
            <Label htmlFor="body">Content (optional — you can fill this in later)</Label>
            <Textarea
              id="body"
              name="body"
              rows={6}
              maxLength={20000}
              placeholder="Paste YouTube links to embed videos. Paste any other link and it becomes clickable. Plain text works too."
            />
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
    <Button type="submit" loading={pending}>
      Create page
    </Button>
  );
}
