import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/session";
import { ResourcePageView } from "./_components/resource-page-view";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return { title: "Resources" };
  const page = await prisma.resourcePage.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
    select: { title: true },
  });
  return { title: page?.title ?? "Resource" };
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string };
}) {
  const user = (await getSessionUser())!;
  const page = await prisma.resourcePage.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
  });
  if (!page) notFound();

  const canManage = hasRole(user, "MANAGER");
  const startInEditMode = canManage && searchParams.edit === "1";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/resources"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ChevronLeft className="h-4 w-4" /> All resources
      </Link>

      <ResourcePageView
        canManage={canManage}
        initialEdit={startInEditMode}
        page={{
          id: page.id,
          title: page.title,
          icon: page.icon,
          body: page.body,
          updatedAt: page.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
