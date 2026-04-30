import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <LogoMark size={44} />
            <span className="text-lg">ScheduleHQ</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-10 max-w-3xl">
        <article className="prose-legal">{children}</article>

        <nav className="mt-16 pt-6 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition">
            Privacy policy
          </Link>
          <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition">
            Terms of service
          </Link>
          <Link href="/legal/cookies" className="text-muted-foreground hover:text-foreground transition">
            Cookies
          </Link>
        </nav>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container text-xs text-muted-foreground text-center">
          ScheduleHQ © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
