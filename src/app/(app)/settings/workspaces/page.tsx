import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { WorkspaceLifecycle } from "../_components/workspace-lifecycle";

export const metadata = { title: "Workspaces · Settings" };

export default async function WorkspacesSettingsPage() {
  const user = (await getSessionUser())!;
  const isOwner = user.role === "OWNER";

  const otherMembers = await prisma.membership.findMany({
    where: {
      organizationId: user.organizationId,
      active: true,
      userId: { not: user.id },
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your workspaces</CardTitle>
          <CardDescription>Every business you're a member of, and your role in each.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {user.orgs.map((o) => {
              const active = o.organizationId === user.organizationId;
              return (
                <li key={o.organizationId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      {o.logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.logoDataUrl} alt={o.organizationName} className="h-full w-full object-contain rounded-md" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium truncate flex items-center gap-2 flex-wrap">
                        {o.organizationName}
                        {active && <Badge variant="primary">Active</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        {o.role.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage</CardTitle>
          <CardDescription>
            Add another workspace, leave the active one, transfer ownership, or delete (Owner-only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceLifecycle
            isOwner={isOwner}
            orgName={user.organizationName}
            otherMembers={otherMembers.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              role: m.role,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
