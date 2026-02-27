import { useState } from "react";
import { useTimetable } from "@/hooks/useTimetable.js";
import { useSubjects }  from "@/hooks/useSubjects.js";
import { cn }           from "@/lib/utils.js";
import {
  Plus, Trash2, Zap, ChevronDown, ChevronUp, CalendarDays,
} from "lucide-react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/* ── Slot form (inside a timetable card) ─────────────────────────── */
function SlotForm({ timetableId, subjects, onAdd }) {
  const [form, setForm] = useState({
    day: "Monday", subjectId: "", startTime: "09:00", endTime: "10:00",
  });
  const [err, setErr] = useState("");

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectId) { setErr("Select a subject."); return; }
    if (form.startTime >= form.endTime) { setErr("End time must be after start time."); return; }
    onAdd(timetableId, form);
    setForm((p) => ({ ...p, subjectId: "" }));
    setErr("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg bg-muted/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add slot</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={form.day}
          onChange={(e) => set("day", e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {DAYS.map((d) => <option key={d}>{d}</option>)}
        </select>

        <select
          value={form.subjectId}
          onChange={(e) => set("subjectId", e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— Subject —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input
          type="time" value={form.startTime}
          onChange={(e) => set("startTime", e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="time" value={form.endTime}
          onChange={(e) => set("endTime", e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {err && <p className="text-xs text-destructive">{err}</p>}

      <button
        type="submit"
        className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        <Plus size={13} /> Add slot
      </button>
    </form>
  );
}

/* ── Slot row ─────────────────────────────────────────────────────── */
function SlotRow({ slot, subjects, onDelete }) {
  const subject = subjects.find((s) => s.id === slot.subjectId);
  return (
    <div className="flex items-center justify-between border-b border-border px-1 py-2 last:border-0">
      <div className="flex items-center gap-3 text-sm">
        <span className="w-24 font-medium text-muted-foreground">{slot.day}</span>
        <span className="font-medium">{subject?.name ?? "Unknown"}</span>
        <span className="text-xs text-muted-foreground">
          {slot.startTime} – {slot.endTime}
        </span>
      </div>
      <button
        onClick={() => onDelete(slot.id)}
        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Remove slot"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ── Timetable card ───────────────────────────────────────────────── */
function TimetableCard({ tt, subjects, onActivate, onArchive, onAddSlot, onDeleteSlot }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-card transition-all",
      tt.active ? "border-primary shadow-sm" : "border-border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{tt.name}</span>
          {tt.active && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Active
            </span>
          )}
          <span className="text-xs text-muted-foreground">{tt.slots.length} slot{tt.slots.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex items-center gap-1">
          {!tt.active && (
            <button
              onClick={() => onActivate(tt.id)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <Zap size={13} /> Activate
            </button>
          )}
          <button
            onClick={() => onArchive(tt.id)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Archive"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setOpen((p) => !p)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
          {tt.slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No slots yet.</p>
          ) : (
            DAYS.map((day) => {
              const daySlots = tt.slots.filter((s) => s.day === day);
              return daySlots.length > 0 ? (
                <div key={day}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</p>
                  {daySlots.map((slot) => (
                    <SlotRow
                      key={slot.id}
                      slot={slot}
                      subjects={subjects}
                      onDelete={(slotId) => onDeleteSlot(tt.id, slotId)}
                    />
                  ))}
                </div>
              ) : null;
            })
          )}
          <SlotForm timetableId={tt.id} subjects={subjects} onAdd={onAddSlot} />
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function TimetablePage() {
  const { timetables, create, activate, archive, addSlot, deleteSlot } = useTimetable();
  const { subjects } = useSubjects({ archived: false });
  const [newName, setNewName] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    create({ name });
    setNewName("");
  }

  function handleArchive(id) {
    if (confirm("Archive this timetable?")) archive(id);
  }

  const visible = timetables.filter((t) => !t.archived);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Timetable</h2>
        <p className="text-sm text-muted-foreground">
          Create timetables and add class slots. Only one timetable is active at a time.
        </p>
      </div>

      {subjects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add subjects first from the <strong>Subjects</strong> page before creating slots.
        </div>
      )}

      {/* Create */}
      <div className="rounded-xl border border-border bg-card p-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='e.g. "Sem 4 Regular"'
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus size={15} /> Create
          </button>
        </form>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <CalendarDays size={36} className="opacity-30" />
          <p className="text-sm">No timetables yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((tt) => (
            <TimetableCard
              key={tt.id}
              tt={tt}
              subjects={subjects}
              onActivate={activate}
              onArchive={handleArchive}
              onAddSlot={addSlot}
              onDeleteSlot={deleteSlot}
            />
          ))}
        </div>
      )}
    </div>
  );
}
