import Link from "next/link";
import { BookOpen, FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { EmptyState } from "@/components/ui/empty";
import { NewResourcePageButton } from "./_components/new-page-button";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const user = (await getSessionUser())!;
  const canManage = hasRole(user, "MANAGER");

  const pages = await prisma.resourcePage.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, icon: true, updatedAt: true, body: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-sm text-muted-foreground">
            Training videos, handbooks, links — anything your team needs to reference.
          </p>
        </div>
        {canManage ? <NewResourcePageButton /> : null}
      </div>

      {pages.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resource pages yet"
          description={
            canManage
              ? "Create your first page to share training videos, documents, or important links with your team."
              : "Your managers haven't added any resources yet."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/resources/${p.id}`}
              className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-lg shrink-0">
                  {p.icon ?? <FileText className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Updated {new Date(p.updatedAt).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {p.body.slice(0, 140) || "Empty page"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
