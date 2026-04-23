import { Mail, Phone, UserCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const user = (await getSessionUser())!;

  const members = await prisma.membership.findMany({
    where: { organizationId: user.organizationId, active: true },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Everyone in <span className="font-medium">{user.organizationName}</span>. Phone numbers are
          visible only if a teammate has added one in their profile.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-border bg-card p-5 flex items-start gap-3"
          >
            <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-semibold shrink-0">
              {m.user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-semibold truncate">{m.user.name}</div>
                <Badge variant={m.role === "OWNER" ? "primary" : "secondary"}>
                  {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                </Badge>
              </div>
              <a
                href={`mailto:${m.user.email}`}
                className="flex items-center gap-2 text-xs text-muted-foreground mt-2 hover:text-foreground transition break-all"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {m.user.email}
              </a>
              {m.user.phone ? (
                <a
                  href={`tel:${m.user.phone.replace(/[^+0-9]/g, "")}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground mt-1 hover:text-foreground transition"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {m.user.phone}
                </a>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic mt-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  No phone on file
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
