import Image from "next/image";
import { cn } from "@/lib/utils";
import logoMark from "./logo-mark.png";

export function LogoMark({
  className = "",
  src,
  alt,
}: {
  className?: string;
  src?: string | null;
  alt?: string;
}) {
  // Org-uploaded logo takes precedence over the ScheduleHQ default mark.
  if (src) {
    return (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md overflow-hidden bg-muted ring-1 ring-border",
          className,
        )}
      >
        {/* Data URLs aren't optimized by next/image; plain img is correct here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? "Workspace logo"} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md overflow-hidden",
        className,
      )}
    >
      <Image
        src={logoMark}
        alt={alt ?? "ScheduleHQ"}
        width={28}
        height={28}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}
