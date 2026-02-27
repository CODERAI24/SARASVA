import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Library, ClipboardList, Calendar, CalendarDays, Plus,
} from "lucide-react";
import { useSubjects } from "@/hooks/useSubjects.js";
import { useExams } from "@/hooks/useExams.js";

/**
 * Slide-in drawer triggered by the hamburger icon in the mobile header.
 * Provides: Add Subject, Add New Exam, Task Calendar, Manage Subjects, Schedule.
 */
export default function SideDrawer({ open, onClose }) {
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectName,   setSubjectName]   = useState("");
  const [subjectError,  setSubjectError]  = useState("");
  const [addingExam,    setAddingExam]    = useState(false);
  const [examName,      setExamName]      = useState("");

  const { create: createSubject } = useSubjects({ archived: false });
  const { create: createExam }    = useExams();
  const navigate = useNavigate();

  async function handleAddSubject(e) {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setSubjectError("");
    try {
      await createSubject(subjectName.trim());
      setSubjectName("");
      setAddingSubject(false);
    } catch (err) {
      setSubjectError(err.message);
    }
  }

  async function handleAddExam(e) {
    e.preventDefault();
    if (!examName.trim()) return;
    await createExam({ name: examName.trim() });
    setExamName("");
    setAddingExam(false);
  }

  function goTo(path) {
    navigate(path);
    onClose();
  }

  function toggleSubject() {
    setAddingSubject(v => !v);
    setAddingExam(false);
    setSubjectError("");
  }

  function toggleExam() {
    setAddingExam(v => !v);
    setAddingSubject(false);
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-base font-bold tracking-tight">Quick Actions</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions list */}
        <div className="flex flex-col gap-2 overflow-y-auto p-4 h-[calc(100%-61px)]">

          {/* ── Add Subject ─────────────────────────────── */}
          <div className="rounded-xl border border-border bg-background p-3">
            <button
              onClick={toggleSubject}
              className="flex w-full items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Library size={15} className="text-primary" />
              </div>
              <span className="flex-1 text-left text-sm font-medium">Add Subject</span>
              <Plus
                size={15}
                className={`text-primary transition-transform duration-200 ${addingSubject ? "rotate-45" : ""}`}
              />
            </button>

            {addingSubject && (
              <form onSubmit={handleAddSubject} className="mt-3 flex flex-col gap-2">
                <input
                  autoFocus
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {subjectError && (
                  <p className="text-xs text-destructive">{subjectError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingSubject(false); setSubjectName(""); }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Add New Exam ─────────────────────────────── */}
          <div className="rounded-xl border border-border bg-background p-3">
            <button
              onClick={toggleExam}
              className="flex w-full items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardList size={15} className="text-primary" />
              </div>
              <span className="flex-1 text-left text-sm font-medium">Add New Exam</span>
              <Plus
                size={15}
                className={`text-primary transition-transform duration-200 ${addingExam ? "rotate-45" : ""}`}
              />
            </button>

            {addingExam && (
              <form onSubmit={handleAddExam} className="mt-3 flex flex-col gap-2">
                <input
                  autoFocus
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. Mid-term 2026"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingExam(false); setExamName(""); }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Divider ─────────────────────────────────── */}
          <div className="my-1 border-t border-border" />

          {/* ── Task Calendar ────────────────────────────── */}
          <button
            onClick={() => goTo("/calendar")}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Calendar size={15} className="text-primary" />
            </div>
            <span className="text-sm font-medium">Task Calendar</span>
          </button>

          {/* ── Manage Subjects ──────────────────────────── */}
          <button
            onClick={() => goTo("/subjects")}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Library size={15} className="text-primary" />
            </div>
            <span className="text-sm font-medium">Manage Subjects</span>
          </button>

          {/* ── Schedule / Timetable ─────────────────────── */}
          <button
            onClick={() => goTo("/timetable")}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays size={15} className="text-primary" />
            </div>
            <span className="text-sm font-medium">Schedule / Timetable</span>
          </button>

        </div>
      </div>
    </>
  );
}
