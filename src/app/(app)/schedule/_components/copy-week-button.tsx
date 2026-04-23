"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { copyWeekAction } from "../actions";

export function CopyWeekButton({ weekStartISO }: { weekStartISO: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() =>
        start(async () => {
          if (
            !confirm(
              "Copy every shift and day note from this week into next week?\n\nExisting shifts in the target week are kept — duplicates are skipped.",
            )
          )
            return;
          const r = await copyWeekAction(weekStartISO);
          if (r.ok) {
            toast.success("Copied to next week.");
            router.push(
              `/schedule?week=${nextWeekKey(weekStartISO)}`,
            );
            router.refresh();
          } else toast.error(r.error);
        })
      }
      title="Duplicate this week's shifts into next week"
    >
      <Copy className="h-4 w-4" /> Copy to next week
    </Button>
  );
}

function nextWeekKey(weekStartISO: string) {
  const d = new Date(weekStartISO);
  d.setUTCDate(d.getUTCDate() + 7);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
