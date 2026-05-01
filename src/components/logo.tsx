import { cn } from "@/lib/utils";

const DEFAULT_LOGO_SRC = "/logo-mark.svg";

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
  // Org-uploaded logo (data URL) overrides the default ScheduleHQ mark.
  const finalSrc = src ?? DEFAULT_LOGO_SRC;
  const isOrgLogo = Boolean(src);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md overflow-hidden",
        isOrgLogo && "bg-muted ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* SVG sources (and data URLs) don't benefit from next/image optimization,
          so we use a plain img — and SVG stays vector-sharp at every size. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={alt ?? (isOrgLogo ? "Workspace logo" : "ScheduleHQ")}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
