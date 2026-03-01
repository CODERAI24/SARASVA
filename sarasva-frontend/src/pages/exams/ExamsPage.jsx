import { useState } from "react";
import { useExams }    from "@/hooks/useExams.js";
import { useSubjects } from "@/hooks/useSubjects.js";
import { useTasks }    from "@/hooks/useTasks.js";
import { cn }          from "@/lib/utils.js";
import {
  Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Check, X, Pencil,
  ArrowUp, ArrowDown, Calendar, BellRing, Repeat2, StickyNote, AlertTriangle,
} from "lucide-react";

/* ── Mini progress bar ──────────────────────────────────────────────── */
function MiniProgress({ value, color = "bg-primary" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

/* ── Inline note field ──────────────────────────────────────────────── */
function NoteField({ value, placeholder, onSave, buttonLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value ?? "");

  function save() { onSave(draft.trim()); setEditing(false); }
  function cancel() { setDraft(value ?? ""); setEditing(false); }

  if (editing) {
    return (
      <div className="flex gap-1 items-start">
        <textarea
          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
          placeholder={placeholder}
          className="flex-1 resize-none rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex flex-col gap-1">
          <button onClick={save}   className="rounded p-1 text-green-600 hover:bg-green-50 transition-colors"><Check size={13} /></button>
          <button onClick={cancel} className="rounded p-1 text-muted-foreground hover:bg-accent transition-colors"><X size={13} /></button>
        </div>
      </div>
    );
  }
  if (value) {
    return (
      <p
        className="text-xs text-amber-800 italic leading-snug cursor-pointer hover:text-amber-900 bg-amber-50 border border-amber-100 rounded px-2 py-1.5"
        onClick={() => { setDraft(value); setEditing(true); }}
      >{value}</p>
    );
  }
  return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
      <StickyNote size={11} /> {buttonLabel}
    </button>
  );
}

/* ── Chapter row ────────────────────────────────────────────────────── */
function ChapterRow({ chapter, examId, subjectId, onUpdate, onDelete }) {
  function toggleTheory() { onUpdate(examId, subjectId, chapter.id, { theoryDone: !chapter.theoryDone }); }
  function addPractice()  { onUpdate(examId, subjectId, chapter.id, { practiceCount: (chapter.practiceCount ?? 0) + 1 }); }

  const done = chapter.theoryDone && (chapter.practiceCount ?? 0) > 0;

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2 transition-colors",
      done ? "border-green-200 bg-green-50/40" : "border-border bg-background"
    )}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-sm font-medium flex-1 leading-snug", done && "text-green-800")}>
          {done && <Check size={11} className="inline mr-1 text-green-600" />}
          {chapter.name}
        </span>
        <button onClick={() => onDelete(examId, subjectId, chapter.id)}
          className="rounded p-0.5 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0">
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={toggleTheory}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
            chapter.theoryDone
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-border text-muted-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          )}>
          {chapter.theoryDone ? <Check size={11} /> : <BookOpen size={11} />}
          {chapter.theoryDone ? "Studied" : "Mark Studied"}
        </button>

        <button onClick={addPractice}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
            (chapter.practiceCount ?? 0) > 0
              ? "border-violet-200 bg-violet-50 text-violet-700"
              : "border-border text-muted-foreground hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
          )}>
          <Plus size={11} />
          Practice{(chapter.practiceCount ?? 0) > 0 ? ` (${chapter.practiceCount}x)` : ""}
        </button>
      </div>

      <NoteField
        value={chapter.notes}
        placeholder="Add a note about where you left off…"
        onSave={(notes) => onUpdate(examId, subjectId, chapter.id, { notes })}
        buttonLabel="+ Note"
      />
    </div>
  );
}

/* ── Add chapter form ───────────────────────────────────────────────── */
function AddChapterForm({ examId, subjectId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(examId, subjectId, { name: name.trim() });
    setName(""); setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Plus size={13} /> Add chapter
      </button>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Chapter name…"
        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <button type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">Add</button>
      <button type="button" onClick={() => { setOpen(false); setName(""); }}
        className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">Cancel</button>
    </form>
  );
}

/* ── Spaced repetition modal ────────────────────────────────────────── */
function RepeatModal({ subjectName, onConfirm, onClose }) {
  const [days, setDays] = useState(7);
  const OPTIONS = [3, 7, 14, 21, 30];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-violet-100 p-2"><Repeat2 size={18} className="text-violet-600" /></div>
          <div>
            <h3 className="font-semibold text-sm">Schedule a Review</h3>
            <p className="text-xs text-muted-foreground">{subjectName} — all chapters done!</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">When should we remind you to revise?</p>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                days === d ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-accent"
              )}>{d} days</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onConfirm(days)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
            <BellRing size={14} /> Remind me in {days} days
          </button>
          <button onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">Skip</button>
        </div>
      </div>
    </div>
  );
}

/* ── Subject block inside exam ──────────────────────────────────────── */
function ExamSubjectBlock({
  examSubject, allSubjects, examId, isFirst, isLast,
  onRemoveSubject, onAddChapter, onUpdateChapter, onDeleteChapter,
  onMoveSubject, onSetDueDate, onAddRepeatReminder, onSetSubjectNotes,
}) {
  const subject     = allSubjects.find((s) => s.id === examSubject.subjectId);
  const subjectName = subject?.name ?? "Unknown";
  const [showRepeat, setShowRepeat] = useState(false);
  const [editDue,    setEditDue]    = useState(false);
  const [dueInput,   setDueInput]   = useState(examSubject.dueDate ?? "");

  const { theoryProgress, practiceProgress, overallProgress, allDone } = examSubject;

  function saveDue() { onSetDueDate(examId, examSubject.subjectId, dueInput); setEditDue(false); }

  return (
    <>
      {showRepeat && (
        <RepeatModal
          subjectName={subjectName}
          onConfirm={(days) => { onAddRepeatReminder(subjectName, days); setShowRepeat(false); }}
          onClose={() => setShowRepeat(false)}
        />
      )}

      <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4 transition-all">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => onMoveSubject(examId, examSubject.subjectId, "up")} disabled={isFirst}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-20 transition-colors">
              <ArrowUp size={13} />
            </button>
            <button onClick={() => onMoveSubject(examId, examSubject.subjectId, "down")} disabled={isLast}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-20 transition-colors">
              <ArrowDown size={13} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold">{subjectName}</h4>
              {allDone && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Complete</span>}
              {examSubject.dueDate && !allDone && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  <Calendar size={9} />
                  Due {new Date(examSubject.dueDate + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditDue((v) => !v)} title="Study deadline"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Calendar size={13} />
            </button>
            {allDone && (
              <button onClick={() => setShowRepeat(true)} title="Schedule revision"
                className="rounded p-1 text-violet-500 hover:bg-violet-50 transition-colors">
                <Repeat2 size={13} />
              </button>
            )}
            <button onClick={() => onRemoveSubject(examId, examSubject.subjectId)}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Due date editor */}
        {editDue && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Calendar size={13} className="text-muted-foreground shrink-0" />
            <input type="date" value={dueInput} onChange={(e) => setDueInput(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none" />
            <button onClick={saveDue}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">Set</button>
            <button onClick={() => { setDueInput(""); onSetDueDate(examId, examSubject.subjectId, ""); setEditDue(false); }}
              className="text-xs text-destructive hover:underline">Clear</button>
          </div>
        )}

        {/* Subject-level progress bars (only if chapters exist) */}
        {examSubject.chapters.length > 0 && (
          <div className="space-y-2 rounded-lg bg-muted/30 px-3 py-2.5">
            {[
              { label: "Theory",   value: theoryProgress,   color: "bg-blue-400" },
              { label: "Practice", value: practiceProgress, color: "bg-violet-400" },
              { label: "Overall",  value: overallProgress,
                color: overallProgress >= 100 ? "bg-green-500" : overallProgress >= 60 ? "bg-amber-400" : "bg-primary" },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-0.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span className={cn("font-semibold", label === "Overall" && value >= 100 && "text-green-700")}>{value}%</span>
                </div>
                <MiniProgress value={value} color={color} />
              </div>
            ))}
          </div>
        )}

        {/* Subject notes */}
        <NoteField
          value={examSubject.notes}
          placeholder="Add a study note for this subject…"
          onSave={(notes) => onSetSubjectNotes(examId, examSubject.subjectId, notes)}
          buttonLabel="+ Subject note"
        />

        {/* Chapters */}
        <div className="space-y-2">
          {examSubject.chapters.length === 0
            ? <p className="text-xs text-muted-foreground">No chapters yet. Add one below.</p>
            : examSubject.chapters.map((ch) => (
                <ChapterRow
                  key={ch.id} chapter={ch} examId={examId} subjectId={examSubject.subjectId}
                  onUpdate={onUpdateChapter} onDelete={onDeleteChapter}
                />
              ))
          }
          <AddChapterForm examId={examId} subjectId={examSubject.subjectId} onAdd={onAddChapter} />
        </div>

        {/* Spaced rep prompt */}
        {allDone && (
          <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
            <Repeat2 size={13} className="text-violet-600 shrink-0" />
            <p className="flex-1 text-xs text-violet-800 font-medium">All chapters complete! Schedule a revision?</p>
            <button onClick={() => setShowRepeat(true)}
              className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700 transition-colors">
              Remind me
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Exam card ──────────────────────────────────────────────────────── */
function ExamCard({
  exam, allSubjects, onArchive, onAddSubject, onRemoveSubject,
  onAddChapter, onUpdateChapter, onDeleteChapter,
  onMoveSubject, onSetDueDate, onUpdate, onAddRepeatReminder, onSetSubjectNotes,
}) {
  const [open,       setOpen]       = useState(false);
  const [subjectSel, setSubjectSel] = useState("");
  const [editHeader, setEditHeader] = useState(false);
  const [editName,   setEditName]   = useState(exam.name);
  const [editDate,   setEditDate]   = useState(exam.examDate ?? "");

  const addedIds  = exam.subjects.map((s) => s.subjectId);
  const available = allSubjects.filter((s) => !addedIds.includes(s.id));

  const daysLeft = exam.examDate
    ? Math.ceil((new Date(exam.examDate + "T12:00:00") - new Date()) / 86400000)
    : null;

  function handleAddSubject() {
    if (!subjectSel) return;
    const subject = allSubjects.find((s) => s.id === subjectSel);
    onAddSubject(exam.id, subjectSel, subject?.chapters ?? []);
    setSubjectSel("");
  }

  function saveHeader() {
    if (editName.trim()) onUpdate(exam.id, { name: editName.trim(), examDate: editDate || null });
    setEditHeader(false);
  }

  // Chapters not yet studied (theory not done)
  const attention = exam.subjects.flatMap((s) =>
    (s.chapters ?? [])
      .filter((c) => !c.theoryDone)
      .map((c) => ({
        subject: allSubjects.find((x) => x.id === s.subjectId)?.name ?? "Unknown",
        chapter: c.name,
      }))
  ).slice(0, 5);

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm",
      daysLeft !== null && daysLeft <= 3  ? "border-rose-300"
        : daysLeft !== null && daysLeft <= 7 ? "border-amber-200"
        : "border-border"
    )}>
      {/* Header */}
      {editHeader ? (
        <div className="space-y-2 border-b border-border px-4 py-3">
          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Exam name"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Calendar size={12} /> Exam Date:
            </label>
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveHeader}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
              <Check size={12} /> Save
            </button>
            <button onClick={() => setEditHeader(false)}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{exam.name}</span>
              <span className="text-xs text-muted-foreground">{exam.subjects.length} subject{exam.subjects.length !== 1 ? "s" : ""}</span>
              {exam.examDate && (
                <span className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  daysLeft !== null && daysLeft <= 3 ? "bg-rose-100 text-rose-700"
                    : daysLeft !== null && daysLeft <= 7 ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                )}>
                  <Calendar size={9} />
                  {new Date(exam.examDate + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {daysLeft !== null && daysLeft >= 0 && ` · ${daysLeft}d`}
                  {daysLeft !== null && daysLeft < 0 && " · past"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditName(exam.name); setEditDate(exam.examDate ?? ""); setEditHeader(true); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Edit">
              <Pencil size={14} />
            </button>
            <button onClick={() => { if (confirm("Archive this exam?")) onArchive(exam.id); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Archive">
              <Trash2 size={15} />
            </button>
            <button onClick={() => setOpen((p) => !p)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
              {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* Body — 99999px avoids height clipping with many subjects/chapters */}
      <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: open ? "99999px" : "0px" }}>
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">

          {attention.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <AlertTriangle size={13} /> Not Yet Studied
              </div>
              <ul className="space-y-1">
                {attention.map((a, i) => (
                  <li key={i} className="text-xs text-amber-900">
                    <span className="font-medium">{a.subject}</span> → {a.chapter}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add subject */}
          {available.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-2">
                <select value={subjectSel} onChange={(e) => setSubjectSel(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— Add a subject —</option>
                  {available.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{(s.chapters ?? []).length > 0 ? ` (${s.chapters.length} chapters)` : ""}
                    </option>
                  ))}
                </select>
                <button onClick={handleAddSubject} disabled={!subjectSel}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity">
                  <Plus size={13} /> Add
                </button>
              </div>
              {subjectSel && (allSubjects.find((s) => s.id === subjectSel)?.chapters ?? []).length > 0 && (
                <p className="text-xs text-primary">Chapters will be auto-imported.</p>
              )}
            </div>
          )}

          {exam.subjects.length === 0
            ? <p className="text-sm text-muted-foreground">No subjects added yet.</p>
            : exam.subjects.map((s, idx) => (
                <ExamSubjectBlock
                  key={s.subjectId}
                  examSubject={s}
                  allSubjects={allSubjects}
                  examId={exam.id}
                  isFirst={idx === 0}
                  isLast={idx === exam.subjects.length - 1}
                  onRemoveSubject={onRemoveSubject}
                  onAddChapter={onAddChapter}
                  onUpdateChapter={onUpdateChapter}
                  onDeleteChapter={onDeleteChapter}
                  onMoveSubject={onMoveSubject}
                  onSetDueDate={onSetDueDate}
                  onAddRepeatReminder={onAddRepeatReminder}
                  onSetSubjectNotes={onSetSubjectNotes}
                />
              ))
          }
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function ExamsPage() {
  const {
    exams, create, archive, update,
    addSubject, removeSubject, moveSubject, setSubjectDueDate, setSubjectNotes,
    addChapter, updateChapter, deleteChapter,
  } = useExams();
  const { subjects }           = useSubjects({ archived: false });
  const { create: createTask } = useTasks({ archived: false });

  const [newName,    setNewName]    = useState("");
  const [newDate,    setNewDate]    = useState("");
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    create({ name, examDate: newDate || null });
    setNewName(""); setNewDate(""); setShowCreate(false);
  }

  async function handleAddRepeatReminder(subjectName, days) {
    const due = new Date();
    due.setDate(due.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    const dueDateStr = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
    try {
      await createTask({
        title:       `Revise: ${subjectName}`,
        description: `Spaced repetition review — ${days} days after completing ${subjectName}`,
        dueDate:     dueDateStr,
        priority:    "medium",
      });
    } catch { /* non-critical */ }
  }

  const active = exams.filter((e) => !e.archived);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exam Preparation</h2>
        <p className="text-sm text-muted-foreground">
          Track chapter-by-chapter study progress. Arrange subjects in your study order.
        </p>
      </div>

      {subjects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add subjects first from the <strong>Subjects</strong> page — chapters will be auto-imported here.
        </div>
      )}

      {showCreate ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder='Exam name (e.g. "Mid Sem 1")'
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Calendar size={12} /> Exam Date (optional):
              </label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2">
              <button type="submit"
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                <Plus size={15} /> Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus size={15} /> Create New Exam
        </button>
      )}

      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <BookOpen size={36} className="opacity-30" />
          <p className="text-sm">No exams yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              allSubjects={subjects}
              onArchive={archive}
              onUpdate={(id, patch) => update(id, patch)}
              onAddSubject={addSubject}
              onRemoveSubject={removeSubject}
              onAddChapter={addChapter}
              onUpdateChapter={updateChapter}
              onDeleteChapter={deleteChapter}
              onMoveSubject={moveSubject}
              onSetDueDate={setSubjectDueDate}
              onAddRepeatReminder={handleAddRepeatReminder}
              onSetSubjectNotes={setSubjectNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
