"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgOption } from "@/lib/session";
import { switchOrgAction } from "./org-actions";

function OrgMark({ logo, name }: { logo: string | null; name: string }) {
  if (logo) {
    return (
      <span className="h-7 w-7 rounded-md overflow-hidden bg-muted ring-1 ring-border flex items-center justify-center shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className="h-7 w-7 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function OrgSwitcher({
  orgs,
  currentOrgId,
  currentOrgName,
  currentRole,
}: {
  orgs: OrgOption[];
  currentOrgId: string;
  currentOrgName: string;
  currentRole: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
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

  const solo = orgs.length <= 1;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !solo && setOpen((v) => !v)}
        disabled={solo || pending}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg p-2 transition text-left",
          !solo && "hover:bg-muted",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-sm truncate">{currentOrgName}</span>
          <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">
            {currentRole.toLowerCase()}
          </span>
        </span>
        {!solo && <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {open && !solo && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border bg-card shadow-lg z-50 py-1 max-h-72 overflow-y-auto scrollbar-thin">
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            Switch workspace
          </div>
          {orgs.map((o) => {
            const isCurrent = o.organizationId === currentOrgId;
            return (
              <button
                key={o.organizationId}
                disabled={pending || isCurrent}
                onClick={() => {
                  setOpen(false);
                  start(async () => {
                    await switchOrgAction(o.organizationId);
                  });
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition",
                  isCurrent && "bg-muted",
                )}
              >
                <OrgMark logo={o.logoDataUrl} name={o.organizationName} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{o.organizationName}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    {o.role.toLowerCase()}
                  </div>
                </div>
                {isCurrent && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
