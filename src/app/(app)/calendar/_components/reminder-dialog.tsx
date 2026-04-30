"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  createReminderAction,
  deleteReminderAction,
  updateReminderAction,
} from "../actions";

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

type Reminder = {
  id: string;
  title: string;
  body: string | null;
  color: string;
  scheduledAt: string;
  recurrence: Recurrence;
  recurrenceUntil: string | null;
  notifyBeforeMinutes: number;
};

type Props =
  | { mode: "create"; defaultDateISO: string; onClose: () => void }
  | { mode: "edit"; reminder: Reminder; onClose: () => void };

const COLORS = [
  { id: "indigo", label: "Indigo", swatch: "bg-indigo-500" },
  { id: "violet", label: "Violet", swatch: "bg-violet-500" },
  { id: "emerald", label: "Emerald", swatch: "bg-emerald-500" },
  { id: "amber", label: "Amber", swatch: "bg-amber-500" },
  { id: "rose", label: "Rose", swatch: "bg-rose-500" },
  { id: "sky", label: "Sky", swatch: "bg-sky-500" },
];

const NOTIFY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "At time" },
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
  { value: 10080, label: "1 week before" },
];

function toLocalInput(iso: string) {
  const d = new Date(iso);
  // datetime-local needs YYYY-MM-DDTHH:mm in the browser's local zone.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ReminderDialog(props: Props) {
  if (props.mode === "create") {
    return <CreateDialog defaultDateISO={props.defaultDateISO} onClose={props.onClose} />;
  }
  return <EditDialog reminder={props.reminder} onClose={props.onClose} />;
}

function CreateDialog({
  defaultDateISO,
  onClose,
}: {
  defaultDateISO: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(createReminderAction, null);
  const [color, setColor] = React.useState("indigo");
  const [recurrence, setRecurrence] = React.useState<Recurrence>("NONE");

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Reminder added.");
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose]);

  const initial = new Date(defaultDateISO);
  // Default to 9:00 AM on the chosen day if the time portion is midnight.
  if (initial.getHours() === 0 && initial.getMinutes() === 0) initial.setHours(9, 0, 0, 0);

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader title="New reminder" description="Tied to your account, not a workspace." />
      <form action={formAction}>
        <Body
          color={color}
          onColorChange={setColor}
          recurrence={recurrence}
          onRecurrenceChange={setRecurrence}
          defaults={{
            title: "",
            body: "",
            scheduledAtLocal: toLocalInput(initial.toISOString()),
            recurrenceUntil: "",
            notifyBeforeMinutes: 0,
          }}
        />
        {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Submit label="Add reminder" />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function EditDialog({
  reminder,
  onClose,
}: {
  reminder: Reminder;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();

  const [title, setTitle] = React.useState(reminder.title);
  const [body, setBody] = React.useState(reminder.body ?? "");
  const [color, setColor] = React.useState(reminder.color);
  const [scheduledAt, setScheduledAt] = React.useState(toLocalInput(reminder.scheduledAt));
  const [recurrence, setRecurrence] = React.useState<Recurrence>(reminder.recurrence);
  const [recurrenceUntil, setRecurrenceUntil] = React.useState(
    reminder.recurrenceUntil ? toDateInput(reminder.recurrenceUntil) : "",
  );
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = React.useState(
    reminder.notifyBeforeMinutes,
  );
  const [error, setError] = React.useState<string | null>(null);

  const save = () =>
    start(async () => {
      setError(null);
      const r = await updateReminderAction(reminder.id, {
        title,
        body: body.trim() || null,
        color,
        scheduledAt: new Date(scheduledAt),
        recurrence,
        recurrenceUntil:
          recurrence !== "NONE" && recurrenceUntil
            ? new Date(`${recurrenceUntil}T23:59:59`)
            : null,
        notifyBeforeMinutes,
      });
      if (r.ok) {
        toast.success("Reminder updated.");
        router.refresh();
        onClose();
      } else {
        setError(r.error);
        toast.error(r.error);
      }
    });

  const remove = () =>
    start(async () => {
      if (!confirm(`Delete "${reminder.title}"?`)) return;
      const r = await deleteReminderAction(reminder.id);
      if (r.ok) {
        toast.success("Reminder deleted.");
        router.refresh();
        onClose();
      } else toast.error(r.error);
    });

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader title="Edit reminder" />
      <Body
        color={color}
        onColorChange={setColor}
        recurrence={recurrence}
        onRecurrenceChange={setRecurrence}
        controlled={{
          title,
          onTitleChange: setTitle,
          body,
          onBodyChange: setBody,
          scheduledAtLocal: scheduledAt,
          onScheduledAtChange: setScheduledAt,
          recurrenceUntil,
          onRecurrenceUntilChange: setRecurrenceUntil,
          notifyBeforeMinutes,
          onNotifyChange: setNotifyBeforeMinutes,
        }}
      />
      {error ? <FieldError>{error}</FieldError> : null}
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={remove}
          disabled={pending}
          className="mr-auto text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={save} loading={pending}>
          <Save className="h-4 w-4" /> Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

type BodyProps = {
  color: string;
  onColorChange: (v: string) => void;
  recurrence: Recurrence;
  onRecurrenceChange: (v: Recurrence) => void;
  defaults?: {
    title: string;
    body: string;
    scheduledAtLocal: string;
    recurrenceUntil: string;
    notifyBeforeMinutes: number;
  };
  controlled?: {
    title: string;
    onTitleChange: (v: string) => void;
    body: string;
    onBodyChange: (v: string) => void;
    scheduledAtLocal: string;
    onScheduledAtChange: (v: string) => void;
    recurrenceUntil: string;
    onRecurrenceUntilChange: (v: string) => void;
    notifyBeforeMinutes: number;
    onNotifyChange: (v: number) => void;
  };
};

function Body({ color, onColorChange, recurrence, onRecurrenceChange, defaults, controlled }: BodyProps) {
  return (
    <DialogBody className="space-y-4">
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="recurrence" value={recurrence} />
      <div>
        <Label htmlFor="title">Title</Label>
        {controlled ? (
          <Input
            id="title"
            value={controlled.title}
            onChange={(e) => controlled.onTitleChange(e.target.value)}
            required
            maxLength={160}
            autoFocus
          />
        ) : (
          <Input
            id="title"
            name="title"
            required
            maxLength={160}
            defaultValue={defaults!.title}
            placeholder="e.g. Mom's birthday"
            autoFocus
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="scheduledAt">Date & time</Label>
          {controlled ? (
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={controlled.scheduledAtLocal}
              onChange={(e) => controlled.onScheduledAtChange(e.target.value)}
              required
            />
          ) : (
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              defaultValue={defaults!.scheduledAtLocal}
            />
          )}
        </div>
        <div>
          <Label htmlFor="notifyBeforeMinutes">Notify me</Label>
          {controlled ? (
            <Select
              id="notifyBeforeMinutes"
              value={String(controlled.notifyBeforeMinutes)}
              onChange={(e) => controlled.onNotifyChange(Number(e.target.value))}
            >
              {NOTIFY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          ) : (
            <Select
              id="notifyBeforeMinutes"
              name="notifyBeforeMinutes"
              defaultValue={String(defaults!.notifyBeforeMinutes)}
            >
              {NOTIFY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="recurrence">Repeat</Label>
        <Select
          id="recurrence"
          value={recurrence}
          onChange={(e) => onRecurrenceChange(e.target.value as Recurrence)}
        >
          <option value="NONE">Never</option>
          <option value="DAILY">Every day</option>
          <option value="WEEKLY">Every week</option>
          <option value="MONTHLY">Every month</option>
          <option value="YEARLY">Every year</option>
        </Select>
      </div>

      {recurrence !== "NONE" && (
        <div>
          <Label htmlFor="recurrenceUntil">Repeat until (optional)</Label>
          {controlled ? (
            <Input
              id="recurrenceUntil"
              type="date"
              value={controlled.recurrenceUntil}
              onChange={(e) => controlled.onRecurrenceUntilChange(e.target.value)}
            />
          ) : (
            <Input
              id="recurrenceUntil"
              name="recurrenceUntil"
              type="date"
              defaultValue={defaults!.recurrenceUntil}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">Leave blank to repeat forever.</p>
        </div>
      )}

      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onColorChange(c.id)}
              className={`h-8 px-3 rounded-md border flex items-center gap-2 transition ${
                color === c.id
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className={`h-3 w-3 rounded-full ${c.swatch}`} />
              <span className="text-xs">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="body">Notes (optional)</Label>
        {controlled ? (
          <Textarea
            id="body"
            value={controlled.body}
            onChange={(e) => controlled.onBodyChange(e.target.value)}
            rows={3}
            maxLength={2000}
          />
        ) : (
          <Textarea
            id="body"
            name="body"
            rows={3}
            maxLength={2000}
            defaultValue={defaults!.body}
            placeholder="Anything you want to remember about this."
          />
        )}
      </div>
    </DialogBody>
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
