import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks.js";

const PRIORITY_DOT  = { high: "bg-rose-500",    medium: "bg-amber-400",  low: "bg-emerald-500" };
const PRIORITY_TEXT = { high: "text-rose-600",   medium: "text-amber-600", low: "text-emerald-600" };
const PRIORITY_BG   = { high: "bg-rose-50 dark:bg-rose-950/30",
                        medium: "bg-amber-50 dark:bg-amber-950/30",
                        low: "bg-emerald-50 dark:bg-emerald-950/30" };

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n) { return String(n).padStart(2, "0"); }

function toDateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function CalendarPage() {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [year,         setYear]         = useState(today.getFullYear());
  const [month,        setMonth]        = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { tasks } = useTasks({ archived: false });
  const navigate  = useNavigate();

  /* ── Task map: "YYYY-MM-DD" → tasks[] ────────────────────────── */
  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.dueDate) continue;
      (map[t.dueDate] ??= []).push(t);
    }
    return map;
  }, [tasks]);

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

  /* ── Helpers for selected date label ─────────────────────────── */
  function formatSelectedDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Page title */}
      <h1 className="text-xl font-bold">Task Calendar</h1>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 hover:bg-accent transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold">{MONTH_NAMES[month]} {year}</span>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 hover:bg-accent transition-colors"
        >
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
        {/* Leading empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e${i}`} className="bg-background/60 aspect-square" />
        ))}

        {/* Day cells */}
        {days.map(({ d, dateStr }) => {
          const dayTasks  = tasksByDate[dateStr] ?? [];
          const isToday   = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const priorities = [...new Set(dayTasks.map(t => t.priority))].slice(0, 3);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`flex min-h-[52px] flex-col items-center bg-background pb-1.5 pt-1 transition-colors hover:bg-accent ${
                isSelected ? "ring-2 ring-inset ring-primary bg-primary/5" : ""
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : isSelected
                    ? "font-bold"
                    : ""
                }`}
              >
                {d}
              </span>
              {priorities.length > 0 && (
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {priorities.map(p => (
                    <span key={p} className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[p] ?? "bg-muted"}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Priority legend */}
      <div className="flex justify-center gap-5">
        {Object.entries(PRIORITY_DOT).map(([p, color]) => (
          <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </div>
        ))}
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="rounded-xl border border-border bg-card p-4">
          {/* Panel header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{formatSelectedDate(selectedDate)}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => navigate("/tasks")}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              <Plus size={12} />
              Add Task
            </button>
          </div>

          {/* Task list */}
          {selectedTasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No tasks due on this day.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-start gap-2.5 rounded-lg p-2.5 ${PRIORITY_BG[task.priority] ?? ""} ${
                    task.completed ? "opacity-50" : ""
                  }`}
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-muted"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium leading-snug ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
                    )}
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_TEXT[task.priority] ?? ""}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.completed && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">Done</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
