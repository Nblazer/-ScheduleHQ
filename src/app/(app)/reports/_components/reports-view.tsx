"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Inbox, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty";
import { useToast } from "@/components/ui/toast";
import { submitReportAction, respondReportAction } from "../actions";

type Item = {
  id: string;
  subject: string;
  body: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  submitterName: string;
  submitterEmail: string;
  assigneeName: string | null;
  managerResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
};

const PRIORITY_BADGE: Record<Item["priority"], "default" | "warning" | "danger"> = {
  LOW: "default",
  NORMAL: "default",
  HIGH: "warning",
  URGENT: "danger",
};

const STATUS_BADGE: Record<Item["status"], "primary" | "warning" | "success"> = {
  OPEN: "warning",
  ACKNOWLEDGED: "primary",
  RESOLVED: "success",
};

export function ReportsView({ canManage, items }: { canManage: boolean; items: Item[] }) {
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Item | null>(null);

  return (
    <>
      <div className="flex justify-end -mt-1">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New report
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={canManage ? "No reports yet" : "You haven't submitted any reports"}
          description={
            canManage
              ? "Your team hasn't reported anything yet."
              : "Spot an issue? File a quick report and your managers will see it."
          }
        />
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
            <Card
              key={r.id}
              onClick={() => setDetail(r)}
              className="cursor-pointer hover:border-primary/50 transition"
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                      <Badge variant={PRIORITY_BADGE[r.priority]}>{r.priority}</Badge>
                    </div>
                    <h3 className="font-semibold">{r.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.body}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {canManage ? r.submitterName : "You"} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                      {r.assigneeName ? ` · Assigned to ${r.assigneeName}` : ""}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {open && <NewReportDialog onClose={() => setOpen(false)} />}
      {detail && (
        <ReportDetailDialog
          canManage={canManage}
          item={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}

function NewReportDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(submitReportAction, null);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Report submitted.");
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose]);

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader title="File a report" description="Your managers will see this right away." />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required maxLength={120} placeholder="e.g. Freezer running warm" />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="NORMAL">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="body">Details</Label>
            <Textarea id="body" name="body" required rows={5} maxLength={4000} />
          </div>
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Submit label="Submit report" />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function ReportDetailDialog({
  canManage,
  item,
  onClose,
}: {
  canManage: boolean;
  item: Item;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const [status, setStatus] = React.useState<Item["status"]>(item.status);
  const [response, setResponse] = React.useState(item.managerResponse ?? "");

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader
        title={item.subject}
        description={`${item.submitterName} · ${new Date(item.createdAt).toLocaleString()}`}
      />
      <DialogBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_BADGE[item.status]}>{item.status}</Badge>
          <Badge variant={PRIORITY_BADGE[item.priority]}>{item.priority} priority</Badge>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm whitespace-pre-wrap leading-relaxed">
          {item.body}
        </div>

        {item.managerResponse ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
            <div className="text-xs text-muted-foreground mb-1">
              Manager response · {item.assigneeName ?? "Team"}
              {item.respondedAt ? ` · ${new Date(item.respondedAt).toLocaleString()}` : ""}
            </div>
            <div className="whitespace-pre-wrap">{item.managerResponse}</div>
          </div>
        ) : null}

        {canManage ? (
          <>
            <div>
              <Label>Response (optional)</Label>
              <Textarea
                rows={4}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                maxLength={4000}
                placeholder="Reply to the reporter…"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as Item["status"])}>
                <option value="OPEN">Open</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </Select>
            </div>
          </>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        {canManage && (
          <Button
            loading={pending}
            onClick={() =>
              start(async () => {
                const r = await respondReportAction(item.id, {
                  status,
                  response: response.trim() ? response.trim() : null,
                });
                if (r.ok) {
                  toast.success("Report updated.");
                  router.refresh();
                  onClose();
                } else toast.error(r.error);
              })
            }
          >
            Save
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}
