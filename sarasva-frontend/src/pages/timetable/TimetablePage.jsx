import { useState } from "react";
import { useTimetable } from "@/hooks/useTimetable.js";
import { useSubjects }  from "@/hooks/useSubjects.js";
import { cn }           from "@/lib/utils.js";
import {
  Plus, Trash2, Zap, ZapOff, ChevronDown, ChevronUp, CalendarDays,
  LayoutGrid, List, CalendarRange, Clock, Pencil, Check, AlertTriangle,
} from "lucide-react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const COLORS = [
  { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200"    },
  { bg: "bg-purple-100",  text: "text-purple-700",  border: "border-purple-200"  },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200"  },
  { bg: "bg-pink-100",    text: "text-pink-700",    border: "border-pink-200"    },
  { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200"    },
  { bg: "bg-yellow-100",  text: "text-yellow-700",  border: "border-yellow-200"  },
  { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200"    },
];

function subjectColor(subjectId, subjects) {
  const idx = subjects.findIndex((s) => s.id === subjectId);
  return COLORS[Math.max(idx, 0) % COLORS.length];
}

function todayName() {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
}

/** Returns true if [startTime, endTime) overlaps any existing slot on the same day (excluding excludeSlotId). */
function hasConflict(slots, day, startTime, endTime, excludeSlotId = null) {
  return slots.some((s) => {
    if (s.day !== day) return false;
    if (excludeSlotId && s.id === excludeSlotId) return false;
    if (!s.startTime || !s.endTime) return false;
    return startTime < s.endTime && endTime > s.startTime;
  });
}

/* ── Today's schedule ─────────────────────────────────────────────── */
function TodaySchedule({ timetables, subjects }) {
  const today  = todayName();
  const active = timetables.filter((t) => t.active && !t.archived);
  if (active.length === 0) return null;

  const slots = active
    .flatMap((tt) => tt.slots.filter((s) => s.day === today))
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-primary" />
        <p className="text-sm font-semibold">Today — {today}</p>
      </div>
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const sub = subjects.find((s) => s.id === slot.subjectId);
            const c   = subjectColor(slot.subjectId, subjects);
            return (
              <div key={slot.id} className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2", c.bg, c.border)}>
                <div>
                  <p className={cn("text-xs font-semibold", c.text)}>{sub?.name ?? "Unknown"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{slot.startTime} – {slot.endTime}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Day chips ────────────────────────────────────────────────────── */
function DayChips({ slots }) {
  const today     = todayName();
  const withSlots = DAYS.filter((d) => slots.some((s) => s.day === d));
  if (withSlots.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {withSlots.map((d) => (
        <span key={d} className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-medium",
          d === today ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>{d.slice(0, 3)}</span>
      ))}
    </div>
  );
}

/* ── Slot form — used for both Add and Edit ───────────────────────── */
function SlotForm({ timetableId, allSlots, subjects, onSubmit, initial, editingSlotId, onCancel }) {
  const [form, setForm] = useState(initial ?? { day: "Monday", subjectId: "", startTime: "09:00", endTime: "10:00" });
  const [err,  setErr]  = useState("");

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectId) { setErr("Select a subject."); return; }
    if (form.startTime >= form.endTime) { setErr("End time must be after start time."); return; }
    if (hasConflict(allSlots, form.day, form.startTime, form.endTime, editingSlotId)) {
      setErr("Time conflict with an existing slot on this day."); return;
    }
    onSubmit(timetableId, form);
    if (!editingSlotId) setForm((p) => ({ ...p, subjectId: "" }));
    setErr("");
  }

  return (
    <form onSubmit={handleSubmit}
      className={cn("rounded-lg border border-dashed bg-muted/30 p-4 space-y-3",
        editingSlotId ? "border-primary/40" : "border-border")}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {editingSlotId ? "Edit Slot" : "Add New Slot"}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Day", el: (
            <select value={form.day} onChange={(e) => set("day", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          )},
          { label: "Subject", el: (
            <select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">— Select —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )},
          { label: "From", el: (
            <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          )},
          { label: "To", el: (
            <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          )},
        ].map(({ label, el }) => (
          <div key={label} className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</label>
            {el}
          </div>
        ))}
      </div>
      {err && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle size={11} /> {err}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit"
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
          {editingSlotId ? <><Check size={13} /> Save</> : <><Plus size={13} /> Add Slot</>}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/* ── Slot pill ────────────────────────────────────────────────────── */
function SlotPill({ slot, allSlots, timetableId, subjects, onDelete, onEdit }) {
  const sub = subjects.find((s) => s.id === slot.subjectId);
  const c   = subjectColor(slot.subjectId, subjects);
  const [editing,    setEditing]    = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <SlotForm
        timetableId={timetableId}
        allSlots={allSlots}
        subjects={subjects}
        editingSlotId={slot.id}
        initial={{ day: slot.day, subjectId: slot.subjectId, startTime: slot.startTime ?? "", endTime: slot.endTime ?? "" }}
        onSubmit={(ttId, formData) => { onEdit(ttId, slot.id, formData); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-between rounded-lg border px-3 py-2", c.bg, c.border)}>
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[48px]">
          <p className="text-[10px] font-mono text-muted-foreground leading-tight">{slot.startTime}</p>
          <p className="text-[10px] font-mono text-muted-foreground leading-tight">{slot.endTime}</p>
        </div>
        <span className={cn("text-sm font-semibold", c.text)}>{sub?.name ?? "Unknown"}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors" title="Edit slot">
          <Pencil size={12} />
        </button>
        {confirming ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(slot.id)}
              className="rounded px-2 py-0.5 text-[10px] font-semibold bg-destructive text-destructive-foreground hover:opacity-90">
              Remove
            </button>
            <button onClick={() => setConfirming(false)}
              className="rounded px-2 py-0.5 text-[10px] border border-border text-muted-foreground hover:bg-muted">
              Keep
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Remove slot">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Table view ───────────────────────────────────────────────────── */
function TimetableTableView({ slots, subjects }) {
  if (slots.length === 0) return <p className="text-sm text-muted-foreground py-2">No slots yet.</p>;
  const activeDays = DAYS.filter((d) => slots.some((s) => s.day === d));
  const timeRanges = [...new Set(slots.map((s) => `${s.startTime ?? ""}–${s.endTime ?? ""}`))].sort();
  const today = todayName();

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-20">Time</th>
            {activeDays.map((d) => (
              <th key={d} className={cn("px-3 py-2.5 text-center font-semibold", d === today ? "text-primary" : "text-muted-foreground")}>
                {d.slice(0, 3)}{d === today && <span className="ml-1 text-[8px] align-super">●</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeRanges.map((tr, i) => {
            const [start, end] = tr.split("–");
            return (
              <tr key={tr} className={cn("border-b border-border last:border-0", i % 2 !== 0 && "bg-muted/20")}>
                <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                  <div>{start}</div><div className="text-[10px] opacity-60">{end}</div>
                </td>
                {activeDays.map((d) => {
                  const slot = slots.find((s) => s.day === d && `${s.startTime ?? ""}–${s.endTime ?? ""}` === tr);
                  const sub  = slot ? subjects.find((sub) => sub.id === slot.subjectId) : null;
                  const c    = slot ? subjectColor(slot.subjectId, subjects) : null;
                  return (
                    <td key={d} className="px-2 py-1.5 text-center">
                      {sub && c
                        ? <span className={cn("inline-block rounded-md px-2 py-1 text-[11px] font-semibold", c.bg, c.text)}>{sub.name}</span>
                        : <span className="text-muted-foreground/25">—</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Timetable card ───────────────────────────────────────────────── */
function TimetableCard({ tt, subjects, onActivate, onArchive, onAddSlot, onDeleteSlot, onEditSlot }) {
  const [open,       setOpen]       = useState(false);
  const [viewMode,   setViewMode]   = useState("table");
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card transition-shadow",
      tt.active ? "border-primary/50 shadow-sm shadow-primary/10" : "border-border")}>
      {tt.active && <div className="h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{tt.name}</span>
            {tt.active && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Active</span>}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{tt.slots.length} slot{tt.slots.length !== 1 ? "s" : ""}</span>
            {tt.startDate && (
              <span className="flex items-center gap-1">
                <CalendarRange size={10} />
                From {new Date(tt.startDate + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
          {tt.slots.length > 0 && <DayChips slots={tt.slots} />}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onActivate(tt.id)}
            className={cn("flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              tt.active ? "text-amber-600 hover:bg-amber-50" : "text-primary hover:bg-primary/10")}>
            {tt.active ? <><ZapOff size={13} /> Deactivate</> : <><Zap size={13} /> Activate</>}
          </button>

          {/* Inline archive confirm — no browser confirm() */}
          {confirming ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onArchive(tt.id); setConfirming(false); }}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-90">
                Archive
              </button>
              <button onClick={() => setConfirming(false)}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Archive">
              <Trash2 size={15} />
            </button>
          )}

          <button onClick={() => setOpen((p) => !p)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded body — CSS grid row trick for smooth open/close */}
      <div className="grid transition-all duration-300 ease-in-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
            {tt.slots.length > 0 && (
              <div className="flex gap-1 overflow-hidden rounded-lg border border-border text-xs w-fit">
                {["table","list"].map((m) => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={cn("flex items-center gap-1 px-2.5 py-1.5 capitalize transition-colors",
                      viewMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                    {m === "table" ? <LayoutGrid size={12} /> : <List size={12} />} {m}
                  </button>
                ))}
              </div>
            )}

            {tt.slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slots yet. Add one below.</p>
            ) : viewMode === "table" ? (
              <TimetableTableView slots={tt.slots} subjects={subjects} />
            ) : (
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const daySlots = tt.slots.filter((s) => s.day === day)
                    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
                  return daySlots.length > 0 ? (
                    <div key={day} className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
                      {daySlots.map((slot) => (
                        <SlotPill key={slot.id} slot={slot} allSlots={tt.slots} timetableId={tt.id} subjects={subjects}
                          onDelete={(slotId) => onDeleteSlot(tt.id, slotId)}
                          onEdit={(ttId, slotId, patch) => onEditSlot(ttId, slotId, patch)}
                        />
                      ))}
                    </div>
                  ) : null;
                })}
              </div>
            )}

            <SlotForm timetableId={tt.id} allSlots={tt.slots} subjects={subjects} onSubmit={onAddSlot} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function TimetablePage() {
  const { timetables, create, activate, archive, addSlot, deleteSlot, editSlot } = useTimetable();
  const { subjects } = useSubjects({ archived: false });
  const [newName,      setNewName]      = useState("");
  const [newStartDate, setNewStartDate] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    create({ name, startDate: newStartDate || null });
    setNewName(""); setNewStartDate("");
  }

  const visible     = timetables.filter((t) => !t.archived);
  const activeCount = visible.filter((t) => t.active).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Timetable</h2>
          <p className="text-sm text-muted-foreground">Up to 2 timetables can be active simultaneously.</p>
        </div>
        {visible.length > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{activeCount}/2</p>
            <p className="text-xs text-muted-foreground">active</p>
          </div>
        )}
      </div>

      <TodaySchedule timetables={visible} subjects={subjects} />

      {activeCount >= 2 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Both slots used. Activating another will deactivate the oldest active one.
        </div>
      )}
      {subjects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add subjects first from the <strong>Subjects</strong> page before creating slots.
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">New Timetable</p>
        <form onSubmit={handleCreate} className="space-y-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder='e.g. "Sem 4 Regular"'
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background" />
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CalendarRange size={11} /> Start date <span className="opacity-60">(optional)</span>
              </label>
              <input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit"
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Plus size={15} /> Create
            </button>
          </div>
        </form>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <CalendarDays size={40} className="opacity-20" />
          <p className="text-sm">No timetables yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((tt) => (
            <TimetableCard key={tt.id} tt={tt} subjects={subjects}
              onActivate={activate} onArchive={archive}
              onAddSlot={addSlot} onDeleteSlot={deleteSlot} onEditSlot={editSlot}
            />
          ))}
        </div>
      )}
    </div>
  );
}
