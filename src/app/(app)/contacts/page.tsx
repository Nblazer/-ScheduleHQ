import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { ContactsGrid } from "./_components/contacts-grid";

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
          Everyone in <span className="font-medium">{user.organizationName}</span>. Click anyone
          to see their profile.
        </p>
      </div>

      <ContactsGrid
        members={members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          phone: m.user.phone,
          role: m.role,
        }))}
      />
    </div>
  );
}
