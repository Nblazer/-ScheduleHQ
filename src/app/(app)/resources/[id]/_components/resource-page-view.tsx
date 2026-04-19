"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { RichContent } from "../../_components/rich-content";
import { deleteResourcePageAction, updateResourcePageAction } from "../../actions";

type PageData = {
  id: string;
  title: string;
  icon: string | null;
  body: string;
  updatedAt: string;
};

export function ResourcePageView({
  canManage,
  initialEdit,
  page,
}: {
  canManage: boolean;
  initialEdit: boolean;
  page: PageData;
}) {
  const [editing, setEditing] = React.useState(initialEdit);
  const [current, setCurrent] = React.useState(page);

  if (editing) {
    return (
      <EditForm
        page={current}
        onCancel={() => setEditing(false)}
        onSaved={(updated) => {
          setCurrent(updated);
          setEditing(false);
        }}
      />
    );
  }
  return <ViewMode page={current} canManage={canManage} onEdit={() => setEditing(true)} />;
}

function ViewMode({
  page,
  canManage,
  onEdit,
}: {
  page: PageData;
  canManage: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-2xl shrink-0">
            {page.icon ?? <FileText className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Updated {new Date(page.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Delete page"
              title="Delete page"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!confirm(`Delete "${page.title}"?\n\nThis can't be undone.`)) return;
                  const r = await deleteResourcePageAction(page.id);
                  if (r.ok) {
                    toast.success("Page deleted.");
                    router.push("/resources");
                    router.refresh();
                  } else toast.error(r.error);
                })
              }
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <RichContent text={page.body} />
      </div>
    </>
  );
}

function EditForm({
  page,
  onCancel,
  onSaved,
}: {
  page: PageData;
  onCancel: () => void;
  onSaved: (updated: PageData) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = React.useState(page.title);
  const [icon, setIcon] = React.useState(page.icon ?? "");
  const [body, setBody] = React.useState(page.body);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const save = () =>
    start(async () => {
      setError(null);
      const r = await updateResourcePageAction(page.id, {
        title,
        icon: icon || null,
        body,
      });
      if (r.ok) {
        toast.success("Page saved.");
        onSaved({ ...page, title, icon: icon || null, body, updatedAt: new Date().toISOString() });
        router.refresh();
      } else {
        setError(r.error);
        toast.error(r.error);
      }
    });

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
        <div>
          <Label htmlFor="icon">Icon</Label>
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={8}
            placeholder="📚"
            className="w-20 text-center text-lg"
          />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="body">Content</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          maxLength={20000}
          placeholder="Paste a YouTube URL on its own line to embed the video.\nPaste other URLs and they become clickable.\n\nYou can leave blank lines between paragraphs."
          className="font-mono text-sm leading-relaxed"
        />
        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
          <span>Tip: YouTube links on their own line auto-embed as video players.</span>
          <span>{body.length}/20000</span>
        </div>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          <X className="h-4 w-4" /> Cancel
        </Button>
        <Button onClick={save} loading={pending}>
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}
