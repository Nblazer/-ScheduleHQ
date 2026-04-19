export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm shadow-sm shadow-primary/40 " +
        className
      }
    >
      S
    </span>
  );
}
