import { prisma } from "@/lib/db";
import { XCircle } from "lucide-react";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "Accept invite" };

export default async function InvitePage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  if (!token) return <Invalid message="This invite link is missing its token." />;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });
  if (!invite) return <Invalid message="We couldn't find that invite. It may have been revoked." />;
  if (invite.acceptedAt) return <Invalid message="This invite has already been used." />;
  if (invite.expiresAt < new Date()) return <Invalid message="This invite has expired. Ask your manager to re-send it." />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Join {invite.organization.name}</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        You've been invited as <span className="text-foreground font-medium">{invite.role.toLowerCase()}</span>.
        Set a password to finish creating your account.
      </p>
      <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">
        <div className="text-muted-foreground">Your account</div>
        <div className="font-medium">{invite.name}</div>
        <div className="text-muted-foreground text-xs mt-0.5">{invite.email}</div>
      </div>
      <AcceptInviteForm token={invite.token} />
    </div>
  );
}

function Invalid({ message }: { message: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-rose-500/15 text-rose-400">
        <XCircle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold">Invite unavailable</h1>
      <p className="text-muted-foreground mt-2">{message}</p>
    </div>
  );
}
