"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  acceptNotificationInviteAction,
  declineNotificationInviteAction,
} from "./notifications-actions";

export type NotificationInvite = {
  id: string;
  token: string;
  orgName: string;
  role: string;
  inviterName: string | null;
  expiresAt: string;
};

export function NotificationBell({ invites }: { invites: NotificationInvite[] }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = invites.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition"
        aria-label={count > 0 ? `${count} notification${count === 1 ? "" : "s"}` : "Notifications"}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="font-semibold text-sm">Notifications</div>
            {count > 0 && (
              <div className="text-xs text-muted-foreground">
                {count} pending invite{count === 1 ? "" : "s"}
              </div>
            )}
          </div>

          {count === 0 ? (
            <div className="py-10 flex flex-col items-center text-center px-6">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Inbox className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">You're all caught up</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                New workspace invites will show up here.
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-border">
              {invites.map((inv) => (
                <InviteNotification key={inv.id} invite={inv} onDone={() => setOpen(false)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InviteNotification({
  invite,
  onDone,
}: {
  invite: NotificationInvite;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();

  const accept = () =>
    start(async () => {
      const r = await acceptNotificationInviteAction(invite.token);
      if (r.ok) {
        toast.success(`Joined ${invite.orgName}.`);
        router.refresh();
        onDone();
      } else toast.error(r.error);
    });

  const decline = () =>
    start(async () => {
      const r = await declineNotificationInviteAction(invite.token);
      if (r.ok) {
        toast.info("Invite declined.");
        router.refresh();
      } else toast.error(r.error);
    });

  return (
    <div className="p-4 space-y-3">
      <div>
        <div className="text-sm">
          <span className="font-semibold">
            {invite.inviterName ?? "Someone"}
          </span>{" "}
          invited you to{" "}
          <span className="font-semibold">{invite.orgName}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          As {invite.role.toLowerCase()} · expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={accept} loading={pending} className="flex-1">
          <Check className="h-3.5 w-3.5" /> Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={decline}
          disabled={pending}
          className="flex-1"
        >
          <X className="h-3.5 w-3.5" /> Decline
        </Button>
      </div>
    </div>
  );
}
