"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProfileDetailsAction, type ProfileDetails } from "./profile-actions";

export type ProfileSeed = {
  id: string;
  name: string;
};

export function ProfileDialog({
  seed,
  onClose,
}: {
  seed: ProfileSeed;
  onClose: () => void;
}) {
  const [details, setDetails] = React.useState<ProfileDetails | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getProfileDetailsAction(seed.id);
      if (cancelled) return;
      if (r.ok) setDetails(r.details);
      else setError(r.error);
    })();
    return () => {
      cancelled = true;
    };
  }, [seed.id]);

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader title={details?.name ?? seed.name} description="Workspace profile" />
      <DialogBody className="space-y-5">
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : !details ? (
          <Skeleton />
        ) : (
          <Body details={details} />
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function Body({ details: d }: { details: ProfileDetails }) {
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/15 text-primary text-2xl font-bold flex items-center justify-center shrink-0">
          {d.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="text-lg font-semibold flex items-center gap-2 flex-wrap">
            {d.name}
            <Badge variant={d.role === "OWNER" ? "primary" : "secondary"}>
              {d.role.charAt(0) + d.role.slice(1).toLowerCase()}
            </Badge>
            {!d.active && <Badge variant="danger">Inactive</Badge>}
            {d.emailVerified && (
              <span title="Email verified" className="text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Joined this workspace{" "}
            {new Date(d.joinedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        <ContactRow icon={Mail} label="Email" value={d.email} href={`mailto:${d.email}`} />
        {d.phone ? (
          <ContactRow
            icon={Phone}
            label="Phone"
            value={d.phone}
            href={`tel:${d.phone.replace(/[^+0-9]/g, "")}`}
          />
        ) : null}
        <ContactRow icon={Building2} label="Workspaces" value={`${d.totalWorkspaces} total`} />
      </div>

      {d.canSeeRate && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Pay & this week
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              icon={DollarSign}
              label="Rate"
              value={d.rateCents != null ? `$${(d.rateCents / 100).toFixed(2)}/hr` : "—"}
            />
            <Stat
              icon={Clock}
              label="This week"
              value={d.weekHoursMinutes != null ? formatHours(d.weekHoursMinutes) : "—"}
              sub={d.weekShifts != null ? `${d.weekShifts} shift${d.weekShifts === 1 ? "" : "s"}` : undefined}
            />
            <Stat
              icon={CalendarIcon}
              label="Earnings"
              value={d.weekEarningsCents != null ? `$${(d.weekEarningsCents / 100).toFixed(2)}` : "—"}
              sub={d.rateCents == null ? "Set a rate to see" : undefined}
            />
          </div>
          {d.paymentProfile ? (
            <div className="text-xs text-muted-foreground border-t border-border pt-2 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Pay via:</span>
              <span className="font-medium text-foreground break-all">{d.paymentProfile}</span>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="block hover:bg-muted/50 transition">
        {inner}
      </a>
    );
  }
  return inner;
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="font-semibold text-base">{value}</div>
      {sub ? <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div> : null}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted/70 rounded w-1/2" />
        </div>
      </div>
      <div className="h-24 bg-muted rounded-lg" />
      <div className="h-24 bg-muted rounded-lg" />
    </div>
  );
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
