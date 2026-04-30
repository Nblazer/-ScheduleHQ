"use client";

import * as React from "react";
import { Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileDialog, type ProfileSeed } from "../../_components/profile-dialog";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";
};

export function ContactsGrid({ members }: { members: Contact[] }) {
  const [open, setOpen] = React.useState<ProfileSeed | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpen({ id: m.id, name: m.name })}
            className="text-left rounded-xl border border-border bg-card p-5 flex items-start gap-3 hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-semibold shrink-0">
              {m.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-semibold truncate">{m.name}</div>
                <Badge variant={m.role === "OWNER" ? "primary" : "secondary"}>
                  {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 break-all">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {m.email}
              </div>
              {m.phone ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {m.phone}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic mt-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  No phone on file
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      {open && <ProfileDialog seed={open} onClose={() => setOpen(null)} />}
    </>
  );
}
