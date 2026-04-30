import type { Plan } from "@prisma/client";

export type PlanLimits = {
  maxWorkspaces: number; // workspaces a user can OWN
  maxMembersPerWorkspace: number; // active members in a workspace owned by this plan
};

// Sentinel for "unlimited"; checks compare against Infinity.
const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { maxWorkspaces: 1, maxMembersPerWorkspace: 3 },
  BASIC: { maxWorkspaces: 2, maxMembersPerWorkspace: 5 },
  PRO: { maxWorkspaces: UNLIMITED, maxMembersPerWorkspace: UNLIMITED },
};

export const PLAN_LABEL: Record<Plan, string> = {
  FREE: "Free",
  BASIC: "Basic",
  PRO: "Pro",
};

// Display values for the marketing surfaces. Strings on purpose so we can
// show "Free" or the price without parsing.
export const PLAN_PRICE: Record<Plan, string> = {
  FREE: "$0",
  BASIC: "$6.99",
  PRO: "$9.99",
};

export const PLAN_TAGLINE: Record<Plan, string> = {
  FREE: "Get a real schedule running for a small crew.",
  BASIC: "Two locations, slightly bigger team.",
  PRO: "No limits. Run your whole company on it.",
};

export function planLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

// Format a limit for UI ("3" or "Unlimited").
export function fmtLimit(n: number): string {
  return Number.isFinite(n) ? String(n) : "Unlimited";
}

// While Stripe isn't wired up, plan limits would lock people out of features
// they can't pay to unlock. Flip this true once payments ship so caps start
// enforcing. Settings still shows the tiers as aspirational marketing.
//
// Override at runtime via env: set PAYMENTS_ENABLED=true on Vercel and
// redeploy to enable enforcement without changing code.
export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";

// Used by features that need to know if a limit applies. Returns null if
// the action is allowed; returns a friendly error string otherwise.
export function checkWorkspaceLimit(
  plan: Plan,
  ownedWorkspaceCount: number,
): string | null {
  if (!PAYMENTS_ENABLED) return null;
  const limit = PLAN_LIMITS[plan].maxWorkspaces;
  if (ownedWorkspaceCount >= limit) {
    return `Your ${PLAN_LABEL[plan]} plan allows ${fmtLimit(limit)} workspace${
      limit === 1 ? "" : "s"
    }. Upgrade to add more.`;
  }
  return null;
}

export function checkMemberLimit(
  ownerPlan: Plan,
  currentActiveMembers: number,
): string | null {
  if (!PAYMENTS_ENABLED) return null;
  const limit = PLAN_LIMITS[ownerPlan].maxMembersPerWorkspace;
  if (currentActiveMembers >= limit) {
    return `This workspace's owner is on the ${PLAN_LABEL[ownerPlan]} plan, capped at ${fmtLimit(
      limit,
    )} members. The Owner needs to upgrade before adding more.`;
  }
  return null;
}
