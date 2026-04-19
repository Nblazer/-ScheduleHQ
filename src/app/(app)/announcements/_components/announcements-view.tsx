"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  togglePinAction,
} from "../actions";

type Item = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  authorName: string;
};

export function AnnouncementsView({ canPost, items }: { canPost: boolean; items: Item[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      {canPost && (
        <div className="flex justify-end -mt-1">
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((a) => (
          <AnnouncementItem key={a.id} item={a} canPost={canPost} />
        ))}
      </div>

      {open && <NewAnnouncementDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function AnnouncementItem({ item, canPost }: { item: Item; canPost: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();

  return (
    <Card className={item.pinned ? "border-amber-500/40 bg-amber-500/[0.03]" : ""}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {item.pinned && <Badge variant="warning">Pinned</Badge>}
              <h3 className="font-semibold text-base">{item.title}</h3>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              {item.authorName} · {new Date(item.createdAt).toLocaleString()}
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{item.body}</div>
          </div>
          {canPost && (
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() =>
                  start(async () => {
                    const r = await togglePinAction(item.id);
                    if (r.ok) router.refresh();
                    else toast.error(r.error);
                  })
                }
                disabled={pending}
                title={item.pinned ? "Unpin" : "Pin"}
                className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                {item.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
              <button
                onClick={() =>
                  start(async () => {
                    if (!confirm("Delete this announcement?")) return;
                    const r = await deleteAnnouncementAction(item.id);
                    if (r.ok) {
                      toast.success("Announcement deleted.");
                      router.refresh();
                    } else toast.error(r.error);
                  })
                }
                disabled={pending}
                title="Delete"
                className="rounded-md p-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NewAnnouncementDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(createAnnouncementAction, null);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Announcement posted.");
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose]);

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader title="New announcement" description="Share an update with your whole team." />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required maxLength={120} placeholder="Inspection day Thursday" />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" required rows={6} maxLength={4000} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="pinned" className="h-4 w-4 rounded border-border" /> Pin to top
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="emailBlast" className="h-4 w-4 rounded border-border" /> Also email everyone
            </label>
          </div>
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Post announcement
    </Button>
  );
}
