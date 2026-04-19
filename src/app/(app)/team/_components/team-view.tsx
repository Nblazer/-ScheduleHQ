"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import type { Role } from "@prisma/client";
import { Plus, UserMinus, UserPlus, UserX, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  inviteAction,
  changeRoleAction,
  setActiveAction,
  revokeInviteAction,
} from "../actions";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
};

type Invite = {
  id: string;
  email: string;
  name: string;
  role: Role;
  expiresAt: string;
};

const RANK: Record<Role, number> = { OWNER: 4, ADMIN: 3, MANAGER: 2, EMPLOYEE: 1 };

export function TeamView({
  currentUserId,
  currentRole,
  assignableRoles,
  members,
  invites,
}: {
  currentUserId: string;
  currentRole: Role;
  assignableRoles: Role[];
  members: Member[];
  invites: Invite[];
}) {
  const [inviteOpen, setInviteOpen] = React.useState(false);

  return (
    <>
      <div className="flex justify-end -mt-1">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite teammate
        </Button>
      </div>

      {invites.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" /> Pending invitations
            </h2>
            <div className="divide-y divide-border">
              {invites.map((i) => (
                <PendingInviteRow key={i.id} invite={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-semibold mb-3 text-sm">Members</h2>
          <div className="divide-y divide-border">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                currentUserId={currentUserId}
                currentRole={currentRole}
                assignableRoles={assignableRoles}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {inviteOpen && <InviteDialog assignable={assignableRoles} onClose={() => setInviteOpen(false)} />}
    </>
  );
}

function MemberRow({
  member,
  currentUserId,
  currentRole,
  assignableRoles,
}: {
  member: Member;
  currentUserId: string;
  currentRole: Role;
  assignableRoles: Role[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const isSelf = member.id === currentUserId;
  const canManageTarget = RANK[currentRole] > RANK[member.role] && !isSelf;
  const canChangeRole = canManageTarget && assignableRoles.length > 0;

  return (
    <div className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-sm shrink-0">
          {member.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-medium flex items-center gap-2 flex-wrap">
            <span>{member.name}</span>
            {isSelf && <Badge variant="outline">You</Badge>}
            {!member.active && <Badge variant="danger">Deactivated</Badge>}
            {!member.emailVerified && member.active && <Badge variant="warning">Unverified</Badge>}
          </div>
          <div className="text-xs text-muted-foreground truncate">{member.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canChangeRole ? (
          <Select
            value={member.role}
            disabled={pending}
            onChange={(e) =>
              start(async () => {
                const r = await changeRoleAction(member.id, e.target.value as Role);
                if (r.ok) {
                  toast.success("Role updated.");
                  router.refresh();
                } else toast.error(r.error);
              })
            }
            className="h-8 w-36"
          >
            <option value={member.role}>{roleLabel(member.role)}</option>
            {assignableRoles
              .filter((r) => r !== member.role)
              .map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
          </Select>
        ) : (
          <Badge variant={member.role === "OWNER" ? "primary" : "secondary"}>
            {roleLabel(member.role)}
          </Badge>
        )}

        {canManageTarget && (
          <Button
            size="sm"
            variant={member.active ? "outline" : "secondary"}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await setActiveAction(member.id, !member.active);
                if (r.ok) {
                  toast.success(member.active ? "User deactivated." : "User reactivated.");
                  router.refresh();
                } else toast.error(r.error);
              })
            }
          >
            {member.active ? (
              <>
                <UserMinus className="h-3.5 w-3.5" /> Deactivate
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" /> Reactivate
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function PendingInviteRow({ invite }: { invite: Invite }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{invite.name}</div>
        <div className="text-xs text-muted-foreground">
          {invite.email} · {roleLabel(invite.role)} · expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString()}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await revokeInviteAction(invite.id);
            if (r.ok) {
              toast.success("Invite revoked.");
              router.refresh();
            } else toast.error(r.error);
          })
        }
      >
        <UserX className="h-3.5 w-3.5" /> Revoke
      </Button>
    </div>
  );
}

function InviteDialog({ assignable, onClose }: { assignable: Role[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(inviteAction, null);
  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Invitation sent.");
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose]);

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader title="Invite teammate" description="They'll get an email to accept and set a password." />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required maxLength={80} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="EMPLOYEE">
              {assignable.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
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
      Send invitation
    </Button>
  );
}

function roleLabel(r: Role) {
  return r.charAt(0) + r.slice(1).toLowerCase();
}
