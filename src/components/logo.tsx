import Image from "next/image";
import { cn } from "@/lib/utils";
import logoMark from "./logo-mark.png";

// Size in CSS pixels. The default (40) gives next/image enough headroom
// to request a sharp source (it'll fetch the 96px srcset variant on
// 2× retina, vs the previous 32px which looked muddy on detailed logos).
export function LogoMark({
  className = "",
  src,
  alt,
  size = 40,
}: {
  className?: string;
  src?: string | null;
  alt?: string;
  size?: number;
}) {
  // Org-uploaded logo overrides the default ScheduleHQ mark.
  if (src) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md overflow-hidden bg-muted ring-1 ring-border",
          className,
        )}
        style={{ width: size, height: size }}
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
        "inline-flex items-center justify-center rounded-md overflow-hidden",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoMark}
        alt={alt ?? "ScheduleHQ"}
        width={size}
        height={size}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}
