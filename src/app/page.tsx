import Link from "next/link";
import {
  CalendarDays,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
  Inbox,
  ArrowRight,
  Palette,
  Zap,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/logo";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <Hero />
      <LogoStrip />
      <FeatureGrid />
      <ScreenshotPreview />
      <Roles />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <LogoMark size={44} />
          <span className="text-lg">ScheduleHQ</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#roles" className="hover:text-foreground transition">Roles</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] pointer-events-none" />
      <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <Badge variant="primary" className="mb-6">
            <Sparkles className="h-3 w-3" /> Free forever for small teams
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gradient leading-[1.05]">
            Scheduling that runs as tight as your team.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            Build shift schedules, post announcements, and keep your whole team on the same page — whether
            you run a Dunkin', a retail floor, or a crew of contractors. Professional, free, and ready in minutes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="min-w-[180px]">
                Create your workspace <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="min-w-[180px]">
                I already have an account
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            No credit card. Email confirmation in 10 seconds. You stay in control.
          </p>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-sm">
        <span className="uppercase tracking-widest text-xs">Built for</span>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 font-medium">
          <span>Coffee shops</span>
          <span>Quick-service restaurants</span>
          <span>Retail</span>
          <span>Fitness studios</span>
          <span>Contractors</span>
          <span>Non-profits</span>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: CalendarDays,
    title: "Shift scheduling",
    body: "Drag-free week view. Assign shifts to employees, set positions, attach per-shift notes.",
  },
  {
    icon: Sparkles,
    title: "Day notes",
    body: "Tag a day as Milk machine cleaning, Inventory, or Inspection — your whole team sees it.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    body: "Post team-wide updates, pin critical ones. Optional email blast when it matters.",
  },
  {
    icon: Inbox,
    title: "Employee reports",
    body: "Staff file reports with priority levels. Managers see the queue, acknowledge, resolve.",
  },
  {
    icon: Users,
    title: "Role management",
    body: "Owner → Admin → Manager → Employee. Invite teammates by email, promote or demote anytime.",
  },
  {
    icon: Palette,
    title: "Your look",
    body: "Pick a preset and accent. Every user can theme their own view; owners set the workspace default.",
  },
  {
    icon: ShieldCheck,
    title: "Email verification",
    body: "Every account confirmed by email. Session-based auth, bcrypt-hashed passwords, HTTPS-only cookies.",
  },
  {
    icon: Zap,
    title: "Fast, free, familiar",
    body: "Built on Next.js. Deploys to Vercel at zero cost. Mobile app on the roadmap.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    body: "Single-tenant data isolation per workspace. No ads, no analytics reselling, no subscription wall.",
  },
];

function FeatureGrid() {
  return (
    <section id="features" className="container py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Badge variant="outline" className="mb-4">Features</Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Everything a shift-based team needs.
        </h2>
        <p className="mt-4 text-muted-foreground">
          No feature walls. No "pro" plan hiding the basics. It's all here.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/25 transition">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScreenshotPreview() {
  return (
    <section className="container pb-24">
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="border-b border-border px-4 py-3 flex items-center gap-2 bg-muted/30">
          <span className="h-3 w-3 rounded-full bg-rose-500/60" />
          <span className="h-3 w-3 rounded-full bg-amber-500/60" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
          <span className="ml-3 text-xs text-muted-foreground">schedulehq.app / schedule</span>
        </div>
        <div className="grid md:grid-cols-[220px_1fr]">
          <aside className="hidden md:block border-r border-border p-4 text-sm">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Workspace</div>
            <div className="font-semibold mb-5">Dunkin · Main St</div>
            <nav className="space-y-1 text-muted-foreground">
              <div className="rounded-md px-2 py-1.5 bg-primary/15 text-primary flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Schedule
              </div>
              <div className="px-2 py-1.5 flex items-center gap-2"><Megaphone className="h-4 w-4" /> Announcements</div>
              <div className="px-2 py-1.5 flex items-center gap-2"><Inbox className="h-4 w-4" /> Reports</div>
              <div className="px-2 py-1.5 flex items-center gap-2"><Users className="h-4 w-4" /> Team</div>
            </nav>
          </aside>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs text-muted-foreground">Week of Apr 20</div>
                <div className="text-xl font-semibold">Schedule</div>
              </div>
              <Button size="sm">+ New shift</Button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                <div key={d} className="rounded-lg border border-border bg-background/50 p-2 min-h-[110px]">
                  <div className="font-medium text-muted-foreground mb-2">{d}</div>
                  {i === 1 && (
                    <div className="rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-1 mb-1.5 text-[11px]">
                      Milk machine clean
                    </div>
                  )}
                  {i === 3 && (
                    <div className="rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 px-2 py-1 mb-1.5 text-[11px]">
                      Inspection
                    </div>
                  )}
                  <div className="space-y-1">
                    <Shift name="Alex" time="6a–2p" />
                    {(i === 2 || i === 4) && <Shift name="Jordan" time="2p–9p" />}
                    {i === 5 && <Shift name="Sam" time="10a–6p" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Shift({ name, time }: { name: string; time: string }) {
  return (
    <div className="rounded-md bg-primary/15 border border-primary/30 text-primary px-2 py-1 text-[11px]">
      <div className="font-semibold">{name}</div>
      <div className="opacity-80">{time}</div>
    </div>
  );
}

function Roles() {
  const tiers = [
    { name: "Owner", perks: ["Creates workspace", "Full access", "Can promote admins"] },
    { name: "Admin", perks: ["Manage managers", "Billing & settings", "All operational power"] },
    { name: "Manager", perks: ["Builds schedules", "Posts announcements", "Handles reports"] },
    { name: "Employee", perks: ["Views own schedule", "Files reports", "Gets announcements"] },
  ];
  return (
    <section id="roles" className="container py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Badge variant="outline" className="mb-4">Roles</Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          A clear hierarchy. Zero confusion.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Each role has the exact permissions it needs — no more, no less.
        </p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {tiers.map((t, i) => (
          <div
            key={t.name}
            className="rounded-xl border border-border bg-card p-6 relative overflow-hidden"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Level {i + 1}</div>
            <div className="text-lg font-semibold mb-4">{t.name}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {t.perks.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="pricing" className="container py-24">
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-10 md:p-16 text-center">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative">
          <Badge variant="primary" className="mb-4">Free · No card required</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Your whole team, organized in 10 minutes.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Sign up, confirm your email, invite your crew. That's it. Upgrade to mobile when we launch the app.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-auto">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="font-medium">ScheduleHQ</span>
          <span className="opacity-60">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-x-5 gap-y-1 flex-wrap justify-center">
          <Link href="/login" className="hover:text-foreground transition">Log in</Link>
          <Link href="/signup" className="hover:text-foreground transition">Sign up</Link>
          <span className="opacity-30 hidden md:inline">·</span>
          <Link href="/legal/privacy" className="hover:text-foreground transition">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition">Terms</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
