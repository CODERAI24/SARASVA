import { useState } from "react";
import { useExams }    from "@/hooks/useExams.js";
import { useSubjects } from "@/hooks/useSubjects.js";
import { useTasks }    from "@/hooks/useTasks.js";
import { cn }          from "@/lib/utils.js";
import {
  Plus, Trash2, ChevronDown, ChevronUp, ChevronRight,
  BookOpen, AlertTriangle, Pencil, Check, X,
  ArrowUp, ArrowDown, Calendar, BellRing, Repeat2,
} from "lucide-react";

/* ── Priority badge ──────────────────────────────────────────────── */
function PriorityBadge({ score }) {
  const level = score > 60 ? "high" : score > 30 ? "medium" : "low";
  return (
    <span className={cn(
      "rounded-full px-2 py-0.5 text-xs font-semibold",
      level === "high"   && "bg-red-100 text-red-800",
      level === "medium" && "bg-amber-100 text-amber-800",
      level === "low"    && "bg-green-100 text-green-800",
    )}>
      P{score}
    </span>
  );
}

/* ── Progress bar ─────────────────────────────────────────────────── */
function MiniProgress({ value, color = "bg-primary" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/* ── Chapter row ─────────────────────────────────────────────────── */
function ChapterRow({ chapter, examId, subjectId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:             chapter.name,
    theoryProgress:   chapter.theoryProgress,
    practiceProgress: chapter.practiceProgress,
    weightage:        chapter.weightage,
  });

  function commit() {
    onUpdate(examId, subjectId, chapter.id, {
      ...form,
      theoryProgress:   Number(form.theoryProgress),
      practiceProgress: Number(form.practiceProgress),
      weightage:        Number(form.weightage),
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg bg-muted/50 p-3 transition-all">
        <input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Chapter name"
        />
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "theoryProgress",   label: "Theory %"  },
            { key: "practiceProgress", label: "Practice %" },
            { key: "weightage",        label: "Weightage"  },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <input
                type="number"
                min={0}
                max={key === "weightage" ? 10 : 100}
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={commit} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Check size={12} /> Save
          </button>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
            <X size={12} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  const isDone = chapter.overallProgress >= 100;

  return (
    <div className={cn(
      "space-y-1.5 rounded-lg border bg-background p-3 transition-colors",
      isDone ? "border-green-200 bg-green-50/50" : "border-border"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDone && <Check size={13} className="text-green-600 shrink-0" />}
          <span className={cn("text-sm font-medium", isDone && "text-green-800")}>{chapter.name}</span>
          <PriorityBadge score={chapter.priorityScore} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(examId, subjectId, chapter.id)}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Theory</span><span>{chapter.theoryProgress}%</span>
          </div>
          <MiniProgress value={chapter.theoryProgress} color="bg-blue-400" />
        </div>
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Practice</span><span>{chapter.practiceProgress}%</span>
          </div>
          <MiniProgress value={chapter.practiceProgress} color="bg-violet-400" />
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall</span>
          <span className={cn("font-semibold", isDone ? "text-green-700" : "text-foreground")}>
            {chapter.overallProgress}%
          </span>
        </div>
        <MiniProgress
          value={chapter.overallProgress}
          color={chapter.overallProgress >= 100 ? "bg-green-500" : chapter.overallProgress >= 75 ? "bg-green-400" : "bg-amber-400"}
        />
      </div>
    </div>
  );
}

/* ── Chapter add form ─────────────────────────────────────────────── */
function AddChapterForm({ examId, subjectId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", theoryProgress: 0, practiceProgress: 0, weightage: 1 });
  const [err,  setErr]  = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Chapter name is required."); return; }
    onAdd(examId, subjectId, {
      name:             form.name.trim(),
      theoryProgress:   Number(form.theoryProgress),
      practiceProgress: Number(form.practiceProgress),
      weightage:        Number(form.weightage),
    });
    setForm({ name: "", theoryProgress: 0, practiceProgress: 0, weightage: 1 });
    setErr(""); setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus size={13} /> Add chapter
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <input
        autoFocus
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        placeholder="Chapter name"
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: "theoryProgress",   label: "Theory %",  max: 100 },
          { key: "practiceProgress", label: "Practice %", max: 100 },
          { key: "weightage",        label: "Weight",     max: 10  },
        ].map(({ key, label, max }) => (
          <div key={key} className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <input
              type="number" min={0} max={max}
              value={form[key]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus size={12} /> Add
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Spaced repetition modal ──────────────────────────────────────── */
function RepeatModal({ subjectName, onConfirm, onClose }) {
  const [days, setDays] = useState(7);
  const OPTIONS = [3, 7, 14, 21, 30];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-violet-100 p-2">
            <Repeat2 size={18} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Schedule a Review</h3>
            <p className="text-xs text-muted-foreground">{subjectName} — all chapters done!</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          When would you like a reminder to revise this subject?
        </p>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                days === d
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {d} days
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onConfirm(days)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            <BellRing size={14} /> Remind me in {days} days
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Subject block inside exam ────────────────────────────────────── */
function ExamSubjectBlock({
  examSubject, allSubjects, examId, isFirst, isLast,
  onRemoveSubject, onAddChapter, onUpdateChapter, onDeleteChapter,
  onMoveSubject, onSetDueDate, onAddRepeatReminder,
}) {
  const subject     = allSubjects.find((s) => s.id === examSubject.subjectId);
  const subjectName = subject?.name ?? "Unknown";
  const [showRepeat, setShowRepeat] = useState(false);
  const [editDue,    setEditDue]    = useState(false);
  const [dueInput,   setDueInput]   = useState(examSubject.dueDate ?? "");

  const allDone = examSubject.chapters.length > 0 &&
    examSubject.chapters.every((c) => c.overallProgress >= 100);

  // Overall progress of this subject block
  const totalProgress = examSubject.chapters.length === 0 ? 0 :
    Math.round(examSubject.chapters.reduce((sum, c) => sum + c.overallProgress, 0) / examSubject.chapters.length);

  function handleConfirmRepeat(days) {
    onAddRepeatReminder(subjectName, days);
    setShowRepeat(false);
  }

  function saveDue() {
    onSetDueDate(examId, examSubject.subjectId, dueInput);
    setEditDue(false);
  }

  return (
    <>
      {showRepeat && (
        <RepeatModal
          subjectName={subjectName}
          onConfirm={handleConfirmRepeat}
          onClose={() => setShowRepeat(false)}
        />
      )}

      <div className="space-y-2 rounded-xl border border-border bg-card/50 p-4 transition-all duration-200">
        {/* Subject header */}
        <div className="flex items-center gap-2">
          {/* Move up/down */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={() => onMoveSubject(examId, examSubject.subjectId, "up")}
              disabled={isFirst}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-20 transition-colors"
              title="Move up"
            >
              <ArrowUp size={13} />
            </button>
            <button
              onClick={() => onMoveSubject(examId, examSubject.subjectId, "down")}
              disabled={isLast}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-20 transition-colors"
              title="Move down"
            >
              <ArrowDown size={13} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold">{subjectName}</h4>
              {allDone && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Complete ✓
                </span>
              )}
              {examSubject.dueDate && !allDone && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  <Calendar size={9} />
                  Due {new Date(examSubject.dueDate + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            {examSubject.chapters.length > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500",
                      totalProgress >= 100 ? "bg-green-500" : totalProgress >= 60 ? "bg-amber-400" : "bg-primary"
                    )}
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{totalProgress}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Set due date */}
            <button
              onClick={() => setEditDue((v) => !v)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Set study deadline"
            >
              <Calendar size={13} />
            </button>
            {/* Repeat reminder (shows when all done) */}
            {allDone && (
              <button
                onClick={() => setShowRepeat(true)}
                className="rounded p-1 text-violet-500 hover:bg-violet-50 transition-colors"
                title="Schedule revision reminder"
              >
                <Repeat2 size={13} />
              </button>
            )}
            <button
              onClick={() => onRemoveSubject(examId, examSubject.subjectId)}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Remove subject from exam"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Due date editor */}
        {editDue && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Calendar size={13} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              value={dueInput}
              onChange={(e) => setDueInput(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button onClick={saveDue} className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Set
            </button>
            <button onClick={() => { setDueInput(""); onSetDueDate(examId, examSubject.subjectId, ""); setEditDue(false); }}
              className="text-xs text-destructive hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Chapters */}
        <div className="space-y-2">
          {examSubject.chapters.length === 0 ? (
            <p className="text-xs text-muted-foreground">No chapters yet.</p>
          ) : (
            examSubject.chapters.map((ch) => (
              <ChapterRow
                key={ch.id}
                chapter={ch}
                examId={examId}
                subjectId={examSubject.subjectId}
                onUpdate={onUpdateChapter}
                onDelete={onDeleteChapter}
              />
            ))
          )}
          <AddChapterForm
            examId={examId}
            subjectId={examSubject.subjectId}
            onAdd={onAddChapter}
          />
        </div>

        {/* Suggest revision after all chapters complete */}
        {allDone && (
          <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
            <Repeat2 size={13} className="text-violet-600 shrink-0" />
            <p className="flex-1 text-xs text-violet-800 font-medium">All chapters complete! Schedule a revision?</p>
            <button
              onClick={() => setShowRepeat(true)}
              className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
            >
              Remind me
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Exam card ────────────────────────────────────────────────────── */
function ExamCard({
  exam, allSubjects, onArchive, onAddSubject, onRemoveSubject,
  onAddChapter, onUpdateChapter, onDeleteChapter,
  onMoveSubject, onSetDueDate, onUpdate, onAddRepeatReminder,
}) {
  const [open,       setOpen]       = useState(false);
  const [subjectSel, setSubjectSel] = useState("");
  const [editHeader, setEditHeader] = useState(false);
  const [editName,   setEditName]   = useState(exam.name);
  const [editDate,   setEditDate]   = useState(exam.examDate ?? "");

  const addedIds  = exam.subjects.map((s) => s.subjectId);
  const available = allSubjects.filter((s) => !addedIds.includes(s.id));

  // Days until exam
  const daysLeft = exam.examDate
    ? Math.ceil((new Date(exam.examDate + "T12:00:00") - new Date()) / 86400000)
    : null;

  function handleAddSubject() {
    if (!subjectSel) return;
    // Find selected subject's existing chapters to auto-import
    const subject = allSubjects.find((s) => s.id === subjectSel);
    onAddSubject(exam.id, subjectSel, subject?.chapters ?? []);
    setSubjectSel("");
  }

  function saveHeader() {
    if (editName.trim()) {
      onUpdate(exam.id, { name: editName.trim(), examDate: editDate || null });
    }
    setEditHeader(false);
  }

  // "Needs Attention" chapters
  const attention = exam.subjects.flatMap((s) =>
    s.chapters
      .filter((c) => c.priorityScore > 40)
      .map((c) => ({
        subject:  allSubjects.find((x) => x.id === s.subjectId)?.name ?? "Unknown",
        chapter:  c.name,
        score:    c.priorityScore,
      }))
  ).sort((a, b) => b.score - a.score);

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-card transition-shadow",
      daysLeft !== null && daysLeft <= 3
        ? "border-rose-300"
        : daysLeft !== null && daysLeft <= 7
          ? "border-amber-200"
          : "border-border"
    )}>
      {/* Header */}
      {editHeader ? (
        <div className="space-y-2 border-b border-border px-4 py-3">
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Exam name"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Exam Date:</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveHeader} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Check size={12} /> Save
            </button>
            <button onClick={() => setEditHeader(false)} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{exam.name}</span>
              <span className="text-xs text-muted-foreground">
                {exam.subjects.length} subject{exam.subjects.length !== 1 ? "s" : ""}
              </span>
              {exam.examDate && (
                <span className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  daysLeft !== null && daysLeft <= 3
                    ? "bg-rose-100 text-rose-700"
                    : daysLeft !== null && daysLeft <= 7
                      ? "bg-amber-100 text-amber-700"
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
            <button
              onClick={() => { setEditName(exam.name); setEditDate(exam.examDate ?? ""); setEditHeader(true); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Edit exam"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => { if (confirm("Archive this exam?")) onArchive(exam.id); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Archive exam"
            >
              <Trash2 size={15} />
            </button>
            <button onClick={() => setOpen((p) => !p)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
              {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: open ? "3000px" : "0px" }}
      >
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">

          {/* Needs Attention */}
          {attention.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <AlertTriangle size={13} /> Needs Attention
              </div>
              <ul className="space-y-1">
                {attention.slice(0, 5).map((a, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-amber-900">
                    <span>{a.subject} → {a.chapter}</span>
                    <PriorityBadge score={a.score} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add subject */}
          {available.length > 0 && (
            <div className="flex gap-2">
              <select
                value={subjectSel}
                onChange={(e) => setSubjectSel(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Add a subject —</option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{(s.chapters ?? []).length > 0 ? ` (${s.chapters.length} chapters)` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddSubject}
                disabled={!subjectSel}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          )}
          {available.length > 0 && subjectSel && (allSubjects.find((s) => s.id === subjectSel)?.chapters ?? []).length > 0 && (
            <p className="text-xs text-primary -mt-2">
              Chapters from this subject will be auto-imported.
            </p>
          )}

          {/* Subject blocks */}
          {exam.subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects added yet.</p>
          ) : (
            exam.subjects.map((s, idx) => (
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function ExamsPage() {
  const {
    exams, create, archive, update,
    addSubject, removeSubject, moveSubject, setSubjectDueDate,
    addChapter, updateChapter, deleteChapter,
  } = useExams();
  const { subjects } = useSubjects({ archived: false });
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
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    const dueDateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Exam Preparation</h2>
        <p className="text-sm text-muted-foreground">
          Track theory and practice progress per chapter. Arrange subjects in study order.
        </p>
      </div>

      {subjects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add subjects first from the <strong>Subjects</strong> page.
        </div>
      )}

      {/* Create exam */}
      {showCreate ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Exam name (e.g. "Mid Sem 1")'
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Calendar size={12} /> Exam Date (optional):
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus size={15} /> Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus size={15} /> Create New Exam
        </button>
      )}

      {/* Exam list */}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
