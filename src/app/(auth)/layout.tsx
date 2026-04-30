import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative h-full flex flex-col p-10">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <LogoMark size={44} />
            <span className="text-lg">ScheduleHQ</span>
          </Link>
          <div className="mt-auto max-w-md">
            <blockquote className="text-xl font-medium leading-relaxed text-foreground/90">
              "We build the week on Sunday night. Nobody texts asking when they work anymore."
            </blockquote>
            <div className="mt-4 text-sm text-muted-foreground">
              Shift manager, Dunkin' franchise
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-3 font-semibold">
              <LogoMark size={44} />
              <span className="text-lg">ScheduleHQ</span>
            </Link>
          </div>
          {children}
        </div>
        <div className="mt-10 text-xs text-muted-foreground flex items-center gap-x-4 gap-y-1 flex-wrap justify-center">
          <Link href="/legal/privacy" className="hover:text-foreground transition">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition">Terms</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition">Cookies</Link>
        </div>
      </div>
    </div>
  );
}
