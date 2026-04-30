import { MessageCircle, Users, Hash, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Chat
          <Badge variant="primary">Coming soon</Badge>
        </h1>
        <p className="text-sm text-muted-foreground">
          Built-in messaging for your team. No more group texts no one can mute.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <Feature
            icon={Hash}
            title="Group chats"
            body="Spin up channels for your team — kitchen crew, openers, weekend shift, whatever. Pin messages, mute when you're off, leave anytime."
          />
          <Feature
            icon={Lock}
            title="Direct messages"
            body="Private one-to-one with anyone in your workspace. Perfect for swap requests with a quick note."
          />
          <Feature
            icon={Users}
            title="Block + report"
            body="If someone won't quit, block them on your end and they're hidden from your chat. Managers can step in if it's a workplace issue."
          />
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            We're shipping this in the next push. In the meantime: invite teammates,
            paste copy-link invites into iMessage / Discord / Snap, use shift-swap
            requests on the Schedule page to leave context-rich notes.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{body}</div>
      </div>
    </div>
  );
}
