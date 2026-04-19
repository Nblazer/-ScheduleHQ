import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { ReportsView } from "./_components/reports-view";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = (await getSessionUser())!;
  const canManage = hasRole(user, "MANAGER");

  const reports = await prisma.report.findMany({
    where: {
      organizationId: user.organizationId,
      ...(canManage ? {} : { submitterId: user.id }),
    },
    include: {
      submitter: { select: { name: true, email: true } },
      assignee: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Issues and observations reported by your team."
              : "Report issues, incidents, or observations to your managers."}
          </p>
        </div>
      </div>

      <ReportsView
        canManage={canManage}
        items={reports.map((r) => ({
          id: r.id,
          subject: r.subject,
          body: r.body,
          priority: r.priority,
          status: r.status,
          submitterName: r.submitter.name,
          submitterEmail: r.submitter.email,
          assigneeName: r.assignee?.name ?? null,
          managerResponse: r.managerResponse,
          respondedAt: r.respondedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
