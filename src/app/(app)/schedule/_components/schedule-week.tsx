"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, Trash2, StickyNote, Repeat, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input, Label, FieldError, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  createShiftAction,
  createDayNoteAction,
  deleteShiftAction,
  deleteDayNoteAction,
} from "../actions";
import { requestSwapAction } from "../swap-actions";
import type { DeleteScope } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Employee = { id: string; name: string; role: string };
type Shift = {
  id: string;
  employeeId: string;
  employeeName: string;
  startsAt: string;
  endsAt: string;
  position: string | null;
  notes: string | null;
  seriesId: string | null;
};
type DayNote = {
  id: string;
  date: string;
  title: string;
  body: string | null;
  color: string;
  seriesId: string | null;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const NOTE_COLORS: Record<string, string> = {
  blue: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/40",
};

type DeleteTarget =
  | { kind: "shift"; id: string; seriesId: string | null; label: string }
  | { kind: "note"; id: string; seriesId: string | null; label: string };

export function ScheduleWeek({
  canManage,
  currentUserId,
  weekStartISO,
  employees,
  shifts,
  dayNotes,
}: {
  canManage: boolean;
  currentUserId: string;
  weekStartISO: string;
  employees: Employee[];
  shifts: Shift[];
  dayNotes: DayNote[];
}) {
  const weekStart = new Date(weekStartISO);
  const [shiftDialog, setShiftDialog] = React.useState<{ date: Date } | null>(null);
  const [noteDialog, setNoteDialog] = React.useState<{ date: Date } | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteTarget | null>(null);
  const [swapDialog, setSwapDialog] = React.useState<Shift | null>(null);

  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStartISO],
  );

  const shiftsByDay = React.useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const k = dayKey(new Date(s.startsAt));
      const arr = map.get(k) ?? [];
      arr.push(s);
      map.set(k, arr);
    }
    return map;
  }, [shifts]);

  const notesByDay = React.useMemo(() => {
    const map = new Map<string, DayNote[]>();
    for (const n of dayNotes) {
      const k = dayKey(new Date(n.date));
      const arr = map.get(k) ?? [];
      arr.push(n);
      map.set(k, arr);
    }
    return map;
  }, [dayNotes]);

  return (
    <>
      <div className="schedule-week-grid grid grid-cols-1 md:grid-cols-7 gap-2 rounded-xl border border-border bg-card p-2">
        {days.map((d) => {
          const k = dayKey(d);
          const todayKey = dayKey(new Date());
          const isToday = k === todayKey;
          const dayShifts = shiftsByDay.get(k) ?? [];
          const dayNotesList = notesByDay.get(k) ?? [];
          return (
            <div
              key={k}
              className={cn(
                "schedule-day min-h-[220px] rounded-lg border border-border/60 p-2.5 flex flex-col gap-1.5",
                isToday && "border-primary/60 bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {DAYS[d.getUTCDay()]}
                  </div>
                  <div className={cn("font-semibold text-sm", isToday && "text-primary")}>
                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setNoteDialog({ date: d })}
                      className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Add day note"
                      title="Add day note"
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShiftDialog({ date: d })}
                      className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Add shift"
                      title="Add shift"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {dayNotesList.map((n) => (
                  <DayNoteChip
                    key={n.id}
                    note={n}
                    canManage={canManage}
                    onRequestDelete={(target) => setDeleteDialog(target)}
                  />
                ))}
              </div>
              <div className="space-y-1">
                {dayShifts.length === 0 && dayNotesList.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/60 italic pt-2">No shifts</div>
                ) : null}
                {dayShifts.map((s) => (
                  <ShiftChip
                    key={s.id}
                    shift={s}
                    canManage={canManage}
                    isMine={s.employeeId === currentUserId}
                    onRequestDelete={(target) => setDeleteDialog(target)}
                    onRequestSwap={(shift) => setSwapDialog(shift)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {shiftDialog && (
        <ShiftDialog
          date={shiftDialog.date}
          employees={employees}
          onClose={() => setShiftDialog(null)}
        />
      )}
      {noteDialog && <NoteDialog date={noteDialog.date} onClose={() => setNoteDialog(null)} />}
      {deleteDialog && (
        <DeleteScopeDialog target={deleteDialog} onClose={() => setDeleteDialog(null)} />
      )}
      {swapDialog && (
        <SwapDialog
          myShift={swapDialog}
          teammates={employees.filter((e) => e.id !== currentUserId)}
          allShifts={shifts}
          onClose={() => setSwapDialog(null)}
        />
      )}
    </>
  );
}

function ShiftChip({
  shift,
  canManage,
  isMine,
  onRequestDelete,
  onRequestSwap,
}: {
  shift: Shift;
  canManage: boolean;
  isMine: boolean;
  onRequestDelete: (target: DeleteTarget) => void;
  onRequestSwap: (shift: Shift) => void;
}) {
  const start1 = new Date(shift.startsAt);
  const end1 = new Date(shift.endsAt);
  const isFuture = start1.getTime() > Date.now();

  return (
    <div
      className={cn(
        "group rounded-md border px-2 py-1.5 text-[11px] relative",
        isMine
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
          : "bg-primary/15 border-primary/30 text-primary",
      )}
    >
      <div className="font-semibold flex items-center justify-between gap-2">
        <span className="truncate flex items-center gap-1">
          {shift.seriesId ? <Repeat className="h-3 w-3 opacity-70" /> : null}
          {isMine ? "You" : shift.employeeName}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {isMine && isFuture && (
            <button
              onClick={() => onRequestSwap(shift)}
              className="hover:brightness-125"
              aria-label="Request swap"
              title="Request swap / cover"
            >
              <ArrowLeftRight className="h-3 w-3" />
            </button>
          )}
          {canManage && (
            <button
              onClick={() =>
                onRequestDelete({
                  kind: "shift",
                  id: shift.id,
                  seriesId: shift.seriesId,
                  label: shift.employeeName,
                })
              }
              className="hover:text-rose-300"
              aria-label="Delete shift"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="opacity-80">
        {fmtTime(start1)} – {fmtTime(end1)}
      </div>
      {shift.position ? <div className="opacity-70 truncate">{shift.position}</div> : null}
    </div>
  );
}

function DayNoteChip({
  note,
  canManage,
  onRequestDelete,
}: {
  note: DayNote;
  canManage: boolean;
  onRequestDelete: (target: DeleteTarget) => void;
}) {
  const cls = NOTE_COLORS[note.color] ?? NOTE_COLORS.blue;

  return (
    <div className={cn("group rounded-md border px-2 py-1.5 text-[11px] relative", cls)}>
      <div className="font-semibold flex items-center justify-between gap-2">
        <span className="truncate flex items-center gap-1">
          {note.seriesId ? <Repeat className="h-3 w-3 opacity-70" /> : null}
          {note.title}
        </span>
        {canManage && (
          <button
            onClick={() =>
              onRequestDelete({
                kind: "note",
                id: note.id,
                seriesId: note.seriesId,
                label: note.title,
              })
            }
            className="opacity-0 group-hover:opacity-100 transition hover:brightness-125"
            aria-label="Delete day note"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {note.body ? <div className="opacity-80 mt-0.5 line-clamp-2">{note.body}</div> : null}
    </div>
  );
}

function DeleteScopeDialog({
  target,
  onClose,
}: {
  target: DeleteTarget;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = React.useTransition();

  const run = (scope: DeleteScope) =>
    start(async () => {
      const r =
        target.kind === "shift"
          ? await deleteShiftAction(target.id, scope)
          : await deleteDayNoteAction(target.id, scope);
      if (r.ok) {
        toast.success(
          scope === "single"
            ? "Deleted."
            : scope === "future"
              ? "Deleted this and future occurrences."
              : "Deleted entire series.",
        );
        router.refresh();
        onClose();
      } else toast.error(r.error);
    });

  const kindLabel = target.kind === "shift" ? "shift" : "day note";

  // Non-recurring: simple confirm.
  if (!target.seriesId) {
    return (
      <Dialog open onClose={onClose}>
        <DialogHeader
          title={`Delete ${kindLabel}?`}
          description={target.label}
        />
        <DialogBody>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => run("single")} loading={pending}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }

  // Recurring: three-way choice.
  return (
    <Dialog open onClose={onClose}>
      <DialogHeader
        title={`Delete recurring ${kindLabel}`}
        description={target.label}
      />
      <DialogBody className="space-y-2">
        <ScopeButton
          label="Just this one"
          desc="Only the occurrence you clicked. The rest of the series stays."
          onClick={() => run("single")}
          disabled={pending}
        />
        <ScopeButton
          label="This and all future"
          desc="Keeps past occurrences, deletes this one and everything after."
          onClick={() => run("future")}
          disabled={pending}
        />
        <ScopeButton
          label="Entire series"
          desc="Removes every occurrence, past and future."
          danger
          onClick={() => run("series")}
          disabled={pending}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function ScopeButton({
  label,
  desc,
  danger,
  onClick,
  disabled,
}: {
  label: string;
  desc: string;
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none",
        danger
          ? "border-destructive/40 hover:border-destructive bg-destructive/5"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className={cn("font-medium text-sm", danger && "text-destructive")}>{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
    </button>
  );
}

function ShiftDialog({
  date,
  employees,
  onClose,
}: {
  date: Date;
  employees: Employee[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(createShiftAction, null);
  const [recurring, setRecurring] = React.useState(false);
  const [weeks, setWeeks] = React.useState(4);
  const [days, setDays] = React.useState<number[]>([date.getUTCDay()]);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success(recurring ? "Shifts added." : "Shift added.");
      router.refresh();
      onClose();
    }
  }, [state, router, onClose, toast, recurring]);

  const dateStr = date.toISOString().slice(0, 10);
  const recurrencePayload = recurring
    ? JSON.stringify({ frequency: "WEEKLY", daysOfWeek: days, weeks })
    : "";

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader
        title="New shift"
        description={date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })}
      />
      <form action={formAction}>
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="employeeId">Employee</Label>
            <Select id="employeeId" name="employeeId" required>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role.toLowerCase()})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startsAt">Starts</Label>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={`${dateStr}T09:00`}
              />
            </div>
            <div>
              <Label htmlFor="endsAt">Ends</Label>
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                required
                defaultValue={`${dateStr}T17:00`}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="position">Position (optional)</Label>
            <Input id="position" name="position" placeholder="e.g. Drive-thru" maxLength={80} />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={2} maxLength={500} />
          </div>

          <RecurrenceFields
            enabled={recurring}
            onEnabledChange={setRecurring}
            days={days}
            onDaysChange={setDays}
            weeks={weeks}
            onWeeksChange={setWeeks}
            originalDow={date.getUTCDay()}
          />
          <input type="hidden" name="recurrence" value={recurrencePayload} />

          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton label={recurring ? `Add ${days.length * weeks} shifts` : "Add shift"} />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function NoteDialog({ date, onClose }: { date: Date; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(createDayNoteAction, null);
  const [recurring, setRecurring] = React.useState(false);
  const [weeks, setWeeks] = React.useState(4);
  const [days, setDays] = React.useState<number[]>([date.getUTCDay()]);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success(recurring ? "Day notes added." : "Day note added.");
      router.refresh();
      onClose();
    }
  }, [state, router, onClose, toast, recurring]);

  const dateStr = date.toISOString().slice(0, 10);
  const recurrencePayload = recurring
    ? JSON.stringify({ frequency: "WEEKLY", daysOfWeek: days, weeks })
    : "";

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader
        title="Day note"
        description={date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })}
      />
      <form action={formAction}>
        <input type="hidden" name="date" value={dateStr} />
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Milk machine cleaning" maxLength={120} required />
          </div>
          <div>
            <Label htmlFor="body">Details (optional)</Label>
            <Textarea id="body" name="body" rows={3} maxLength={1000} />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Select id="color" name="color" defaultValue="blue">
              <option value="blue">Blue — routine</option>
              <option value="amber">Amber — attention</option>
              <option value="emerald">Emerald — milestone</option>
              <option value="rose">Rose — critical</option>
              <option value="violet">Violet — event</option>
            </Select>
          </div>

          <RecurrenceFields
            enabled={recurring}
            onEnabledChange={setRecurring}
            days={days}
            onDaysChange={setDays}
            weeks={weeks}
            onWeeksChange={setWeeks}
            originalDow={date.getUTCDay()}
          />
          <input type="hidden" name="recurrence" value={recurrencePayload} />

          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton label={recurring ? `Add ${days.length * weeks} notes` : "Add note"} />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function RecurrenceFields({
  enabled,
  onEnabledChange,
  days,
  onDaysChange,
  weeks,
  onWeeksChange,
  originalDow,
}: {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  days: number[];
  onDaysChange: (v: number[]) => void;
  weeks: number;
  onWeeksChange: (v: number) => void;
  originalDow: number;
}) {
  const toggleDay = (d: number) => {
    onDaysChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());
  };
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">Repeat weekly</span>
      </label>
      {enabled && (
        <>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Days of week</div>
            <div className="flex flex-wrap gap-1">
              {DAYS_FULL.map((label, i) => {
                const active = days.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "h-8 px-2.5 rounded-md border text-xs transition",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {DAYS[i]}
                  </button>
                );
              })}
            </div>
            {days.length === 0 && (
              <p className="text-xs text-destructive mt-1">Pick at least one day.</p>
            )}
            {!days.includes(originalDow) && (
              <p className="text-xs text-muted-foreground mt-1">
                First occurrence will be on the next selected day at or after the chosen date.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">for</span>
            <Input
              type="number"
              min={1}
              max={26}
              value={weeks}
              onChange={(e) => onWeeksChange(Math.max(1, Math.min(26, Number(e.target.value) || 1)))}
              className="h-8 w-20"
            />
            <span className="text-muted-foreground">weeks (max 26)</span>
          </div>
        </>
      )}
    </div>
  );
}

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={disabled}>
      {label}
    </Button>
  );
}

function SwapDialog({
  myShift,
  teammates,
  allShifts,
  onClose,
}: {
  myShift: Shift;
  teammates: Employee[];
  allShifts: Shift[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(requestSwapAction, null);
  const [targetUserId, setTargetUserId] = React.useState<string>(teammates[0]?.id ?? "");
  const [mode, setMode] = React.useState<"give" | "swap">("give");
  const [targetShiftId, setTargetShiftId] = React.useState<string>("");

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Swap request sent.");
      router.refresh();
      onClose();
    }
  }, [state, router, toast, onClose]);

  const myStart = new Date(myShift.startsAt);
  const myEnd = new Date(myShift.endsAt);

  // Shifts the selected teammate owns, in this week view.
  const theirShifts = allShifts.filter(
    (s) => s.employeeId === targetUserId && new Date(s.startsAt).getTime() > Date.now(),
  );

  React.useEffect(() => {
    // Reset target shift when teammate changes.
    setTargetShiftId("");
  }, [targetUserId]);

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader
        title="Request swap / cover"
        description="Your teammate gets a notification in the bell and can accept or decline."
      />
      <form action={formAction}>
        <input type="hidden" name="requesterShiftId" value={myShift.id} />
        <input type="hidden" name="targetUserId" value={targetUserId} />
        {mode === "swap" && targetShiftId ? (
          <input type="hidden" name="targetShiftId" value={targetShiftId} />
        ) : null}
        <DialogBody className="space-y-4">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm">
            <div className="text-xs text-emerald-300/80 uppercase tracking-wider mb-1">
              Your shift
            </div>
            <div className="font-medium">
              {myStart.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}{" "}
              · {fmtTime(myStart)} – {fmtTime(myEnd)}
              {myShift.position ? ` · ${myShift.position}` : ""}
            </div>
          </div>

          {teammates.length === 0 ? (
            <p className="text-sm text-destructive">
              There's nobody else in this workspace to swap with.
            </p>
          ) : (
            <>
              <div>
                <Label htmlFor="swap-target">Ask</Label>
                <Select
                  id="swap-target"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required
                >
                  {teammates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role.toLowerCase()})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>What are you asking for?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("give")}
                    className={cn(
                      "rounded-lg border p-3 text-left transition",
                      mode === "give"
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="font-medium text-sm">Cover for me</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      They take this shift, you take nothing in return.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("swap")}
                    disabled={theirShifts.length === 0}
                    className={cn(
                      "rounded-lg border p-3 text-left transition disabled:opacity-40 disabled:pointer-events-none",
                      mode === "swap"
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="font-medium text-sm">Swap shifts</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {theirShifts.length === 0
                        ? "They have no future shifts this week."
                        : "Pick one of their shifts to trade for."}
                    </div>
                  </button>
                </div>
              </div>

              {mode === "swap" && theirShifts.length > 0 && (
                <div>
                  <Label htmlFor="swap-their-shift">Their shift to trade for</Label>
                  <Select
                    id="swap-their-shift"
                    value={targetShiftId}
                    onChange={(e) => setTargetShiftId(e.target.value)}
                    required
                  >
                    <option value="">Pick one…</option>
                    {theirShifts.map((s) => {
                      const st = new Date(s.startsAt);
                      const en = new Date(s.endsAt);
                      return (
                        <option key={s.id} value={s.id}>
                          {st.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · {fmtTime(st)}–{fmtTime(en)}
                          {s.position ? ` · ${s.position}` : ""}
                        </option>
                      );
                    })}
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="swap-note">Note (optional)</Label>
                <Textarea
                  id="swap-note"
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. I have a doctor's appointment that morning — can you cover?"
                />
              </div>
            </>
          )}
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton
            label="Send request"
            disabled={teammates.length === 0 || (mode === "swap" && !targetShiftId)}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
