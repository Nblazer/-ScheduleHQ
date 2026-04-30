"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import type { Role } from "@prisma/client";
import {
  Plus,
  UserMinus,
  UserPlus,
  UserX,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
  DollarSign,
} from "lucide-react";
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
  removeMemberAction,
  setMemberWageAction,
  type InviteActionResult,
} from "../actions";
import { ProfileDialog, type ProfileSeed } from "../../_components/profile-dialog";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  hourlyRateCents: number | null;
};

type Invite = {
  id: string;
  email: string;
  name: string;
  role: Role;
  token: string;
  expiresAt: string;
};

const RANK: Record<Role, number> = { OWNER: 4, ADMIN: 3, MANAGER: 2, EMPLOYEE: 1 };

export function TeamView({
  currentUserId,
  currentRole,
  assignableRoles,
  members,
  invites,
  resendConfigured,
}: {
  currentUserId: string;
  currentRole: Role;
  assignableRoles: Role[];
  members: Member[];
  invites: Invite[];
  resendConfigured: boolean;
}) {
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [shareDialog, setShareDialog] = React.useState<{
    link: string;
    name: string;
    email: string;
    alreadyHasAccount?: boolean;
  } | null>(null);
  const [wageDialog, setWageDialog] = React.useState<Member | null>(null);
  const [profileDialog, setProfileDialog] = React.useState<ProfileSeed | null>(null);

  return (
    <>
      {!resendConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-amber-200">Email isn't configured yet</div>
            <div className="text-amber-200/80 mt-1">
              Invites will still work — we'll show you a link to copy and share
              (text, Slack, in person). To enable auto-email, set{" "}
              <code className="bg-amber-500/20 px-1 rounded">RESEND_API_KEY</code>{" "}
              and <code className="bg-amber-500/20 px-1 rounded">EMAIL_FROM</code> in Vercel.
            </div>
          </div>
        </div>
      )}

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
                <PendingInviteRow
                  key={i.id}
                  invite={i}
                  onShare={(link) =>
                    setShareDialog({ link, name: i.name, email: i.email })
                  }
                />
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
                onSetWage={() => setWageDialog(m)}
                onViewProfile={() => setProfileDialog({ id: m.id, name: m.name })}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {inviteOpen && (
        <InviteDialog
          assignable={assignableRoles}
          onClose={() => setInviteOpen(false)}
          onInviteCreated={(result) => {
            setShareDialog({
              link: result.inviteLink,
              name: result.name,
              email: result.email,
              alreadyHasAccount: result.alreadyHasAccount,
            });
          }}
        />
      )}
      {shareDialog && (
        <ShareInviteDialog
          {...shareDialog}
          onClose={() => setShareDialog(null)}
        />
      )}
      {wageDialog && (
        <WageDialog member={wageDialog} onClose={() => setWageDialog(null)} />
      )}
      {profileDialog && (
        <ProfileDialog seed={profileDialog} onClose={() => setProfileDialog(null)} />
      )}
    </>
  );
}

function MemberRow({
  member,
  currentUserId,
  currentRole,
  assignableRoles,
  onSetWage,
  onViewProfile,
}: {
  member: Member;
  currentUserId: string;
  currentRole: Role;
  assignableRoles: Role[];
  onSetWage: () => void;
  onViewProfile: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const isSelf = member.id === currentUserId;
  const canManageTarget = RANK[currentRole] > RANK[member.role] && !isSelf;
  const canChangeRole = canManageTarget && assignableRoles.length > 0;

  return (
    <div className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <button
        type="button"
        onClick={onViewProfile}
        className="flex items-center gap-3 min-w-0 text-left rounded-md px-1.5 py-1 -ml-1.5 hover:bg-muted transition"
        title="View profile"
      >
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
      </button>

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

        <Button
          size="sm"
          variant="outline"
          onClick={onSetWage}
          title={member.hourlyRateCents != null ? `${formatRate(member.hourlyRateCents)}/hr` : "Set hourly rate"}
        >
          <DollarSign className="h-3.5 w-3.5" />
          {member.hourlyRateCents != null ? formatRate(member.hourlyRateCents) : "Set pay"}
        </Button>

        {canManageTarget && (
          <>
            <Button
              size="sm"
              variant={member.active ? "outline" : "secondary"}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await setActiveAction(member.id, !member.active);
                  if (r.ok) {
                    toast.success(member.active ? "Member deactivated." : "Member reactivated.");
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
            <Button
              size="icon"
              variant="ghost"
              disabled={pending}
              title="Remove from workspace"
              aria-label={`Remove ${member.name}`}
              onClick={() =>
                start(async () => {
                  if (
                    !confirm(
                      `Remove ${member.name} from the workspace?\n\nThey'll lose access immediately. To come back, they'd need a new invite. Records they created stay.`,
                    )
                  )
                    return;
                  const r = await removeMemberAction(member.id);
                  if (r.ok) {
                    toast.success(`${member.name} removed.`);
                    router.refresh();
                  } else toast.error(r.error);
                })
              }
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function PendingInviteRow({
  invite,
  onShare,
}: {
  invite: Invite;
  onShare: (link: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const link = `${window.location.origin}/invite?token=${invite.token}`;

  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{invite.name}</div>
        <div className="text-xs text-muted-foreground">
          {invite.email} · {roleLabel(invite.role)} · expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => onShare(link)}>
          <Copy className="h-3.5 w-3.5" /> Copy link
        </Button>
        <Button
          size="sm"
          variant="ghost"
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
    </div>
  );
}

function InviteDialog({
  assignable,
  onClose,
  onInviteCreated,
}: {
  assignable: Role[];
  onClose: () => void;
  onInviteCreated: (r: InviteActionResult & { ok: true }) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(inviteAction, null);
  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Invitation sent.");
      router.refresh();
      onInviteCreated(state);
      onClose();
    }
  }, [state, router, toast, onClose, onInviteCreated]);

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader
        title="Invite teammate"
        description="They'll get an email with a link. Nothing happens until they accept — no auto-join."
      />
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

function ShareInviteDialog({
  link,
  name,
  email,
  alreadyHasAccount,
  onClose,
}: {
  link: string;
  name: string;
  email: string;
  alreadyHasAccount?: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press to copy manually.");
    }
  };

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader
        title={`Invite link for ${name}`}
        description={`Share this with ${email} however you like — text, email, in person. It's valid for 7 days.`}
      />
      <DialogBody className="space-y-4">
        {alreadyHasAccount ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
            <div className="font-medium">They already have a ScheduleHQ account.</div>
            <div className="text-muted-foreground mt-1">
              When they click this link, they'll be asked to log in and click{" "}
              <span className="font-medium">Accept</span>. The new workspace then appears
              in their sidebar switcher. Nothing happens until they accept.
            </div>
          </div>
        ) : null}
        <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs break-all select-all">
          {link}
        </div>
        <Button onClick={copy} className="w-full">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Send invite
    </Button>
  );
}

function roleLabel(r: Role) {
  return r.charAt(0) + r.slice(1).toLowerCase();
}

function formatRate(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function WageDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const [dollars, setDollars] = React.useState(
    member.hourlyRateCents != null ? (member.hourlyRateCents / 100).toFixed(2) : "",
  );

  const save = () =>
    start(async () => {
      const trimmed = dollars.trim();
      if (trimmed === "") {
        const r = await setMemberWageAction(member.id, null);
        if (r.ok) {
          toast.success("Pay rate cleared.");
          router.refresh();
          onClose();
        } else toast.error(r.error);
        return;
      }
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Enter a valid dollar amount.");
        return;
      }
      const cents = Math.round(n * 100);
      const r = await setMemberWageAction(member.id, cents);
      if (r.ok) {
        toast.success(`${member.name}: ${formatRate(cents)}/hr`);
        router.refresh();
        onClose();
      } else toast.error(r.error);
    });

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader
        title={`Pay rate for ${member.name}`}
        description="Dollars per hour. Only this employee and managers+ see the rate."
      />
      <DialogBody>
        <Label htmlFor="rate">Hourly rate (USD)</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="rate"
              value={dollars}
              onChange={(e) => setDollars(e.target.value)}
              type="number"
              step="0.25"
              min="0"
              max="1000"
              inputMode="decimal"
              placeholder="15.00"
              className="pl-7"
              autoFocus
            />
          </div>
          <span className="text-sm text-muted-foreground">/ hr</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Leave blank to clear the rate.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={save} loading={pending}>
          Save rate
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
