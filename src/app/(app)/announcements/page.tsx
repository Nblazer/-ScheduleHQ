import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { Megaphone } from "lucide-react";
import { EmptyState } from "@/components/ui/empty";
import { AnnouncementsView } from "./_components/announcements-view";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const user = (await getSessionUser())!;
  const canPost = hasRole(user, "MANAGER");

  const announcements = await prisma.announcement.findMany({
    where: { organizationId: user.organizationId },
    include: { postedBy: { select: { name: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Company-wide updates from your managers.
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description={
            canPost
              ? "Share company-wide updates, reminders, or inspection-day notices."
              : "Your managers haven't posted anything yet."
          }
          action={null}
        />
      ) : null}

      <AnnouncementsView
        canPost={canPost}
        items={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          pinned: a.pinned,
          createdAt: a.createdAt.toISOString(),
          authorName: a.postedBy.name,
        }))}
      />
    </div>
  );
}
