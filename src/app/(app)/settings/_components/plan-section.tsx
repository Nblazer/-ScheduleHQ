"use client";

import * as React from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import type { Plan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { fmtLimit, PLAN_LIMITS, PLAN_LABEL, PLAN_PRICE, PLAN_TAGLINE } from "@/lib/plan";

const FEATURES: Record<Plan, string[]> = {
  FREE: [
    "1 workspace",
    "Up to 3 people in your business",
    "Schedule, announcements, reports, resources",
    "Personal calendar + reminders",
    "Email or copy-link invites",
  ],
  BASIC: [
    "Up to 2 workspaces",
    "Up to 5 people per business",
    "Everything in Free",
    "Priority during early access",
  ],
  PRO: [
    "Unlimited workspaces",
    "Unlimited people per business",
    "Everything in Basic",
    "First access to new features",
  ],
};

const ICONS: Record<Plan, React.ComponentType<{ className?: string }>> = {
  FREE: Sparkles,
  BASIC: Zap,
  PRO: Crown,
};

export function PlanSection({
  currentPlan,
  ownedWorkspaces,
  activeMembersInCurrentOrg,
}: {
  currentPlan: Plan;
  ownedWorkspaces: number;
  activeMembersInCurrentOrg: number;
}) {
  const toast = useToast();
  const limits = PLAN_LIMITS[currentPlan];

  const upgrade = (target: Plan) => {
    toast.info(
      `Payments aren't wired up yet. ${PLAN_LABEL[target]} would be ${PLAN_PRICE[target]}/mo when it launches.`,
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Current plan
          </div>
          <div className="text-xl font-bold flex items-center gap-2">
            {PLAN_LABEL[currentPlan]}
            <Badge variant="primary">{PLAN_PRICE[currentPlan]}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {ownedWorkspaces} of {fmtLimit(limits.maxWorkspaces)} workspaces · this workspace
            has {activeMembersInCurrentOrg} of {fmtLimit(limits.maxMembersPerWorkspace)} members
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {(["FREE", "BASIC", "PRO"] as Plan[]).map((p) => (
          <PlanCard
            key={p}
            plan={p}
            current={currentPlan === p}
            onPick={() => upgrade(p)}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Pricing is set; secure payment processing is on the way. Today everyone is on the
        Free plan limits — when payments launch, anyone who needs the higher tiers can
        upgrade in this exact spot.
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  current,
  onPick,
}: {
  plan: Plan;
  current: boolean;
  onPick: () => void;
}) {
  const Icon = ICONS[plan];
  const featured = plan === "BASIC";
  return (
    <div
      className={cn(
        "rounded-xl border p-5 flex flex-col gap-3 relative",
        current
          ? "border-primary ring-2 ring-primary/40 bg-card"
          : featured
            ? "border-primary/40 bg-card"
            : "border-border bg-card",
      )}
    >
      {featured && !current && (
        <Badge variant="primary" className="absolute -top-2 right-3">
          Most popular
        </Badge>
      )}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="font-semibold">{PLAN_LABEL[plan]}</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{PLAN_PRICE[plan]}</div>
        <div className="text-xs text-muted-foreground">{plan === "FREE" ? "forever" : "/ month"}</div>
      </div>
      <div className="text-sm text-muted-foreground">{PLAN_TAGLINE[plan]}</div>
      <ul className="space-y-1.5 text-sm">
        {FEATURES[plan].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2">
        {current ? (
          <Button variant="outline" className="w-full" disabled>
            Your plan
          </Button>
        ) : plan === "FREE" ? (
          <Button variant="outline" className="w-full" disabled>
            Free tier
          </Button>
        ) : (
          <Button className="w-full" onClick={onPick}>
            Upgrade to {PLAN_LABEL[plan]}
          </Button>
        )}
      </div>
    </div>
  );
}
