"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      title="Print this week's schedule"
    >
      <Printer className="h-4 w-4" /> Print
    </Button>
  );
}
