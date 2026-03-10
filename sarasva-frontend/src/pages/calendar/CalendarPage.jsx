import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, BookOpen, CalendarDays, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTasks }    from "@/hooks/useTasks.js";
import { useExams }    from "@/hooks/useExams.js";
import { useTimetable } from "@/hooks/useTimetable.js";
import { useSubjects }  from "@/hooks/useSubjects.js";
import { cn }           from "@/lib/utils.js";

const PRIORITY_DOT  = { high: "bg-rose-500",    medium: "bg-amber-400",  low: "bg-emerald-500" };
const PRIORITY_TEXT = { high: "text-rose-600",   medium: "text-amber-600", low: "text-emerald-600" };
const PRIORITY_BG   = { high: "bg-rose-50",      medium: "bg-amber-50",    low: "bg-emerald-50"   };

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const WEEK_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function pad(n) { return String(n).padStart(2, "0"); }
function toDateStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export default function CalendarPage() {
  const today    = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [year,         setYear]         = useState(today.getFullYear());
  const [month,        setMonth]        = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { tasks }      = useTasks({ archived: false });
  const { exams }      = useExams();
  const { timetables } = useTimetable();
  const { subjects }   = useSubjects({ archived: false });
  const navigate       = useNavigate();

  /* ── Task map: "YYYY-MM-DD" → tasks[] ────────────────────────── */
  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.dueDate) continue;
      (map[t.dueDate] ??= []).push(t);
    }
    return map;
  }, [tasks]);

  /* ── Exam date map: "YYYY-MM-DD" → exam names[] ──────────────── */
  const examsByDate = useMemo(() => {
    const map = {};
    for (const e of exams) {
      if (!e.examDate || e.archived) continue;
      (map[e.examDate] ??= []).push(e.name);
    }
    return map;
  }, [exams]);

  /* ── Timetable slots for a given date ────────────────────────── */
  function slotsForDate(dateStr) {
    const d   = new Date(dateStr + "T12:00:00");
    const day = WEEK_DAYS[d.getDay()];
    const activeTTs = timetables.filter((tt) => tt.active && !tt.archived);
    return activeTTs
      .flatMap((tt) => tt.slots.filter((s) => s.day === day))
      .map((s) => ({ ...s, subject: subjects.find((sub) => sub.id === s.subjectId) }))
      .filter((s) => s.subject)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  }

  /* ── Calendar grid ───────────────────────────────────────────── */
  const { days, firstDow } = useMemo(() => {
    const firstDay    = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow    = firstDay.getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      d:       i + 1,
      dateStr: toDateStr(year, month, i + 1),
    }));
    return { days, firstDow };
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : [];
  const selectedExams = selectedDate ? (examsByDate[selectedDate] ?? []) : [];
  const selectedSlots = selectedDate ? slotsForDate(selectedDate) : [];

  function formatSelectedDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Calendar</h1>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day-name headers */}
      <div className="grid grid-cols-7">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e${i}`} className="bg-background/60 aspect-square" />
        ))}
        {days.map(({ d, dateStr }) => {
          const dayTasks  = tasksByDate[dateStr] ?? [];
          const hasExam   = !!(examsByDate[dateStr]?.length);
          const isToday    = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const priorities = [...new Set(dayTasks.map(t => t.priority))].slice(0, 3);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={cn(
                "flex min-h-[52px] flex-col items-center bg-background pb-1.5 pt-1 transition-colors hover:bg-accent",
                isSelected && "ring-2 ring-inset ring-primary bg-primary/5"
              )}
            >
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                isToday ? "bg-primary text-primary-foreground" : isSelected ? "font-bold" : ""
              )}>
                {d}
              </span>
              <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                {priorities.map(p => (
                  <span key={p} className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[p] ?? "bg-muted")} />
                ))}
                {hasExam && (
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" title="Exam" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {Object.entries(PRIORITY_DOT).map(([p, color]) => (
          <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", color)} />
            {p.charAt(0).toUpperCase() + p.slice(1)} task
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          Exam
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{formatSelectedDate(selectedDate)}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}
                {selectedExams.length > 0 && ` · ${selectedExams.length} exam${selectedExams.length !== 1 ? "s" : ""}`}
                {selectedSlots.length > 0 && ` · ${selectedSlots.length} class${selectedSlots.length !== 1 ? "es" : ""}`}
              </p>
            </div>
            <button
              onClick={() => navigate("/tasks", { state: { prefillDate: selectedDate } })}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              <Plus size={12} /> Add Task
            </button>
          </div>

          {/* Exams on this day */}
          {selectedExams.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 flex items-center gap-1">
                <BookOpen size={11} /> Exams
              </p>
              {selectedExams.map((name, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-100 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                  <span className="text-sm font-medium text-violet-800">{name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timetable classes on this day */}
          {selectedSlots.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70 flex items-center gap-1">
                <Clock size={11} /> Classes
              </p>
              {selectedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2">
                  <CalendarDays size={13} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1">{slot.subject.name}</span>
                  {slot.startTime && (
                    <span className="text-xs font-mono text-muted-foreground">{slot.startTime}–{slot.endTime}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tasks on this day */}
          {selectedTasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tasks</p>
              <div className="flex flex-col gap-2">
                {selectedTasks.map(task => (
                  <div key={task.id}
                    className={cn("flex items-start gap-2.5 rounded-lg p-2.5", PRIORITY_BG[task.priority] ?? "",
                      task.completed && "opacity-50")}
                  >
                    <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority] ?? "bg-muted")} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium leading-snug", task.completed && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
                      )}
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wide", PRIORITY_TEXT[task.priority] ?? "")}>
                        {task.priority}
                      </span>
                    </div>
                    {task.completed && <span className="shrink-0 text-[10px] text-muted-foreground">Done</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTasks.length === 0 && selectedExams.length === 0 && selectedSlots.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Nothing scheduled for this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
