"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  Plus,
  LogOut,
  UserCog,
  Trash2,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  createWorkspaceAction,
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  transferOwnershipAction,
} from "../workspace-actions";

type Candidate = { id: string; name: string; role: string };

export function WorkspaceLifecycle({
  isOwner,
  orgName,
  otherMembers,
}: {
  isOwner: boolean;
  orgName: string;
  otherMembers: Candidate[];
}) {
  const [newOpen, setNewOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="text-sm">
            <div className="font-medium">Another business or location?</div>
            <div className="text-muted-foreground mt-1">
              Spin up a separate workspace. You'll be the Owner. Use the sidebar
              switcher to move between them anytime.
            </div>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New workspace
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap border-t border-border pt-4">
          <div className="text-sm">
            <div className="font-medium">Leave this workspace</div>
            <div className="text-muted-foreground mt-1">
              Remove yourself from <span className="font-medium">{orgName}</span>. Data
              you created stays.
            </div>
          </div>
          <LeaveButton />
        </div>

        {isOwner && (
          <>
            <div className="flex items-start justify-between gap-4 flex-wrap border-t border-border pt-4">
              <div className="text-sm">
                <div className="font-medium">Transfer ownership</div>
                <div className="text-muted-foreground mt-1">
                  Promote another member to Owner. You become Admin afterward (you can
                  Leave from there if you want out completely).
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setTransferOpen(true)}
                disabled={otherMembers.length === 0}
              >
                <UserCog className="h-4 w-4" /> Transfer ownership
              </Button>
            </div>

            <div className="flex items-start justify-between gap-4 flex-wrap border-t border-destructive/40 pt-4">
              <div className="text-sm">
                <div className="font-medium text-destructive">Delete workspace</div>
                <div className="text-muted-foreground mt-1">
                  Permanent. Removes every member, every shift, every announcement,
                  every report. No recovery.
                </div>
              </div>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete workspace
              </Button>
            </div>
          </>
        )}
      </div>

      {newOpen && <NewWorkspaceDialog onClose={() => setNewOpen(false)} />}
      {transferOpen && (
        <TransferDialog
          orgName={orgName}
          candidates={otherMembers}
          onClose={() => setTransferOpen(false)}
        />
      )}
      {deleteOpen && <DeleteDialog orgName={orgName} onClose={() => setDeleteOpen(false)} />}
    </>
  );
}

function LeaveButton() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          if (!confirm("Leave this workspace? You'll need a new invite to come back."))
            return;
          const r = await leaveWorkspaceAction();
          if (!r?.ok && r && "error" in r) toast.error(r.error);
          else {
            toast.success("Left workspace.");
            router.refresh();
          }
        })
      }
    >
      <LogOut className="h-4 w-4" /> Leave workspace
    </Button>
  );
}

function NewWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState(createWorkspaceAction, null);
  return (
    <Dialog open onClose={onClose}>
      <DialogHeader title="New workspace" description="You'll be the Owner." />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="orgName">Workspace name</Label>
            <Input
              id="orgName"
              name="orgName"
              required
              maxLength={80}
              autoFocus
              placeholder="e.g. Dunkin' — Elm St"
            />
          </div>
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Submit label="Create" />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function TransferDialog({
  orgName,
  candidates,
  onClose,
}: {
  orgName: string;
  candidates: Candidate[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const [target, setTarget] = React.useState(candidates[0]?.id ?? "");
  const [confirm, setConfirm] = React.useState("");
  const picked = candidates.find((c) => c.id === target);

  const run = () =>
    start(async () => {
      const r = await transferOwnershipAction(target);
      if (r.ok) {
        toast.success("Ownership transferred. You are now Admin.");
        router.refresh();
        onClose();
      } else toast.error(r.error);
    });

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader
        title="Transfer ownership"
        description={`You'll be demoted to Admin after the new Owner takes over.`}
      />
      <DialogBody className="space-y-4">
        <div>
          <Label htmlFor="target">New Owner</Label>
          <Select id="target" value={target} onChange={(e) => setTarget(e.target.value)}>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role.toLowerCase()})
              </option>
            ))}
          </Select>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            This can't be undone directly. The new Owner would have to transfer
            ownership back if you want it.
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">Type the workspace name to confirm</Label>
          <Input
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={orgName}
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          onClick={run}
          loading={pending}
          disabled={!picked || confirm !== orgName}
        >
          Transfer to {picked?.name ?? "…"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function DeleteDialog({ orgName, onClose }: { orgName: string; onClose: () => void }) {
  const [state, formAction] = useFormState(deleteWorkspaceAction, null);
  return (
    <Dialog open onClose={onClose}>
      <DialogHeader
        title={`Delete "${orgName}"?`}
        description="Everything goes: members, shifts, announcements, reports, resources. Forever."
      />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                This is permanent. There is no undo. Every member will lose access
                immediately.
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm">
              Type <code className="font-mono bg-muted px-1 rounded">{orgName}</code> to confirm
            </Label>
            <Input id="confirm" name="confirm" required autoComplete="off" />
          </div>
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <DeleteSubmit />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" loading={pending}>
      Permanently delete
    </Button>
  );
}
