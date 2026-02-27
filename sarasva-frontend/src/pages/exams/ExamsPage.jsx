import { useState } from "react";
import { useExams }    from "@/hooks/useExams.js";
import { useSubjects } from "@/hooks/useSubjects.js";
import { cn }          from "@/lib/utils.js";
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  BookOpen, AlertTriangle, Pencil, Check, X,
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
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
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
      <div className="space-y-2 rounded-lg bg-muted/50 p-3">
        <input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Chapter name"
        />
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "theoryProgress",   label: "Theory %"   },
            { key: "practiceProgress", label: "Practice %"  },
            { key: "weightage",        label: "Weightage"   },
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
          <button onClick={commit} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            <Check size={12} /> Save
          </button>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">
            <X size={12} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{chapter.name}</span>
          <PriorityBadge score={chapter.priorityScore} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(examId, subjectId, chapter.id)}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress bars */}
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
          <span>Overall</span><span className="font-semibold text-foreground">{chapter.overallProgress}%</span>
        </div>
        <MiniProgress value={chapter.overallProgress} color={chapter.overallProgress >= 75 ? "bg-green-500" : "bg-amber-400"} />
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
    setErr("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
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
        <button type="submit" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
          <Plus size={12} /> Add
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Subject block inside exam ────────────────────────────────────── */
function ExamSubjectBlock({ examSubject, allSubjects, examId, onRemoveSubject, onAddChapter, onUpdateChapter, onDeleteChapter }) {
  const subjectName = allSubjects.find((s) => s.id === examSubject.subjectId)?.name ?? "Unknown";

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{subjectName}</h4>
        <button
          onClick={() => onRemoveSubject(examId, examSubject.subjectId)}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Remove subject from exam"
        >
          <X size={14} />
        </button>
      </div>

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
    </div>
  );
}

/* ── Exam card ────────────────────────────────────────────────────── */
function ExamCard({ exam, allSubjects, onArchive, onAddSubject, onRemoveSubject, onAddChapter, onUpdateChapter, onDeleteChapter }) {
  const [open,       setOpen]       = useState(false);
  const [subjectSel, setSubjectSel] = useState("");

  const addedIds    = exam.subjects.map((s) => s.subjectId);
  const available   = allSubjects.filter((s) => !addedIds.includes(s.id));

  function handleAddSubject() {
    if (!subjectSel) return;
    onAddSubject(exam.id, subjectSel);
    setSubjectSel("");
  }

  // "Needs Attention" chapters across all subjects in this exam
  const attention = exam.subjects.flatMap((s) =>
    s.chapters
      .filter((c) => c.priorityScore > 40)
      .map((c) => ({
        subject:  allSubjects.find((x) => x.id === s.subjectId)?.name ?? "Unknown",
        chapter:  c.name,
        score:    c.priorityScore,
        overall:  c.overallProgress,
      }))
  ).sort((a, b) => b.score - a.score);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{exam.name}</span>
          <span className="text-xs text-muted-foreground">
            {exam.subjects.length} subject{exam.subjects.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (confirm("Archive this exam?")) onArchive(exam.id); }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Archive exam"
          >
            <Trash2 size={15} />
          </button>
          <button onClick={() => setOpen((p) => !p)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
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
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddSubject}
                disabled={!subjectSel}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          )}

          {/* Subject blocks */}
          {exam.subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects added yet.</p>
          ) : (
            exam.subjects.map((s) => (
              <ExamSubjectBlock
                key={s.subjectId}
                examSubject={s}
                allSubjects={allSubjects}
                examId={exam.id}
                onRemoveSubject={onRemoveSubject}
                onAddChapter={onAddChapter}
                onUpdateChapter={onUpdateChapter}
                onDeleteChapter={onDeleteChapter}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function ExamsPage() {
  const {
    exams, create, archive,
    addSubject, removeSubject,
    addChapter, updateChapter, deleteChapter,
  } = useExams();
  const { subjects } = useSubjects({ archived: false });

  const [newName, setNewName] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    create({ name });
    setNewName("");
  }

  const active = exams.filter((e) => !e.archived);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Exam Preparation</h2>
        <p className="text-sm text-muted-foreground">
          Track theory and practice progress per chapter. High priority chapters are flagged automatically.
        </p>
      </div>

      {subjects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add subjects first from the <strong>Subjects</strong> page.
        </div>
      )}

      {/* Create exam */}
      <div className="rounded-xl border border-border bg-card p-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='Exam name (e.g. "Mid Sem 1")'
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
              onAddSubject={addSubject}
              onRemoveSubject={removeSubject}
              onAddChapter={addChapter}
              onUpdateChapter={updateChapter}
              onDeleteChapter={deleteChapter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
