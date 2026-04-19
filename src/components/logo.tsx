import { cn } from "@/lib/utils";

export function LogoMark({
  className = "",
  src,
  alt,
}: {
  className?: string;
  src?: string | null;
  alt?: string;
}) {
  if (src) {
    return (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md overflow-hidden bg-muted ring-1 ring-border",
          className,
        )}
      >
        {/* Data URLs can't be optimized by next/image, plain img is fine here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? "Workspace logo"} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm shadow-sm shadow-primary/40",
        className,
      )}
    >
      S
    </span>
  );
}
