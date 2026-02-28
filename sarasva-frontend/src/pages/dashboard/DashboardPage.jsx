import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

import { useAuth }             from "@/hooks/useAuth.js";
import { useAttendanceSummary, useAttendanceToday } from "@/hooks/useAttendance.js";
import { useTasks }            from "@/hooks/useTasks.js";
import { useExams }            from "@/hooks/useExams.js";
import { useHabits }           from "@/hooks/useHabits.js";
import { useTimetable }        from "@/hooks/useTimetable.js";
import { useSubjects }         from "@/hooks/useSubjects.js";
import { useMotivationalQuote } from "@/hooks/useQuotes.js";
import { notificationsService } from "@/services/notifications.service.js";
import { tasksService }        from "@/services/tasks.service.js";
import { cn }                  from "@/lib/utils.js";
import {
  ShieldCheck, ShieldAlert, CalendarCheck,
  Target, ListChecks, BookOpen, ArrowRight,
  CheckCircle2, Circle, Plus, Clock, Flame, CheckCheck,
  Repeat2, Check, ChevronRight, Timer, Quote, Trash2,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────────────── */
function ZoneBadge({ zone }) {
  const safe = zone === "safe";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
      safe ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
    )}>
      {safe ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
      {safe ? "SAFE" : "RISK"}
    </span>
  );
}

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, iconBg = "bg-primary/10", iconColor = "text-primary", to }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 card-shadow hover:shadow-md transition-shadow">
      <div className={cn("mt-0.5 rounded-xl p-2.5", iconBg, iconColor)}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {sub && <div className="mt-1">{typeof sub === "string" ? <p className="text-xs text-muted-foreground">{sub}</p> : sub}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

/* ── Custom bar chart tooltip ─────────────────────────────────────── */
function AttTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">{d.name}</p>
      <p>{d.percent}% attendance</p>
      <p className="text-muted-foreground">{d.present} present / {d.total} total</p>
      {d.zone === "risk" && d.classesNeededFor75 > 0 && (
        <p className="mt-1 font-medium text-rose-600">Need {d.classesNeededFor75} more to reach 75%</p>
      )}
    </div>
  );
}

/* ── Radial gauge ─────────────────────────────────────────────────── */
function OverallGauge({ percent, zone }) {
  const data = [{ value: percent, fill: zone === "safe" ? "#10b981" : "#f43f5e" }];
  return (
    <div className="relative flex flex-col items-center justify-center">
      <RadialBarChart
        width={156} height={156} cx={78} cy={78}
        innerRadius={52} outerRadius={70}
        startAngle={225} endAngle={-45}
        data={data} barSize={14}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "hsl(var(--muted))" }} angleAxisId={0} />
      </RadialBarChart>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold leading-none">{percent}%</span>
        <ZoneBadge zone={zone} />
      </div>
    </div>
  );
}

/* ── Target panel ─────────────────────────────────────────────────── */
function TargetPanel({ subjects }) {
  const risk = subjects
    .filter((s) => s.zone === "risk")
    .sort((a, b) => b.classesNeededFor75 - a.classesNeededFor75);

  if (risk.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-6 text-center text-sm text-muted-foreground">
        <ShieldCheck size={28} className="text-emerald-500 opacity-80" />
        <p>All subjects above 75%!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {risk.map((s) => (
        <div key={s.subject.id} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-rose-900">{s.subject.name}</span>
            <span className="text-xs font-bold text-rose-700">{s.percent}%</span>
          </div>
          <div className="my-1.5 h-1.5 w-full overflow-hidden rounded-full bg-rose-200">
            <div className="h-full rounded-full bg-rose-500" style={{ width: `${s.percent}%` }} />
          </div>
          <p className="text-xs text-rose-700">
            Attend <strong>{s.classesNeededFor75}</strong> consecutive class{s.classesNeededFor75 !== 1 ? "es" : ""} to reach 75%
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Exam Countdown Banner ────────────────────────────────────────── */
function ExamCountdownBanner({ exams }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only exams with a future (or today) examDate, sorted by nearest
  const upcoming = exams
    .filter((e) => !e.archived && e.examDate)
    .map((e) => {
      const examDay = new Date(e.examDate + "T00:00:00");
      const days = Math.ceil((examDay - today) / 86400000);
      return { ...e, daysLeft: days };
    })
    .filter((e) => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (upcoming.length === 0) return null;

  const nearest = upcoming[0];
  const isUrgent = nearest.daysLeft <= 3;
  const isWarning = nearest.daysLeft <= 7;

  return (
    <Link to="/exams">
      <div className={cn(
        "rounded-2xl border p-4 card-shadow transition-shadow hover:shadow-md",
        isUrgent
          ? "border-rose-300 bg-gradient-to-r from-rose-50 to-orange-50"
          : isWarning
            ? "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50"
            : "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
      )}>
        <div className="flex items-center gap-4">
          {/* Countdown display */}
          <div className={cn(
            "flex flex-col items-center justify-center rounded-2xl px-4 py-2 min-w-[72px] text-center",
            isUrgent ? "bg-rose-100" : isWarning ? "bg-amber-100" : "bg-blue-100"
          )}>
            <span className={cn(
              "text-3xl font-extrabold leading-none",
              isUrgent ? "text-rose-700" : isWarning ? "text-amber-700" : "text-blue-700"
            )}>
              {nearest.daysLeft}
            </span>
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wide mt-0.5",
              isUrgent ? "text-rose-600" : isWarning ? "text-amber-600" : "text-blue-600"
            )}>
              day{nearest.daysLeft !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Timer size={14} className={cn(
                isUrgent ? "text-rose-600" : isWarning ? "text-amber-600" : "text-blue-600"
              )} />
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                isUrgent ? "text-rose-600" : isWarning ? "text-amber-700" : "text-blue-600"
              )}>
                {isUrgent ? "Exam very soon!" : isWarning ? "Exam coming up" : "Upcoming exam"}
              </p>
            </div>
            <p className="mt-0.5 text-base font-bold truncate">{nearest.name}</p>
            <p className={cn(
              "text-xs",
              isUrgent ? "text-rose-600" : isWarning ? "text-amber-600" : "text-muted-foreground"
            )}>
              {new Date(nearest.examDate + "T12:00:00").toLocaleDateString("en-IN", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
            {nearest.subjects.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {nearest.subjects.length} subject{nearest.subjects.length !== 1 ? "s" : ""} · tap to prep
              </p>
            )}
          </div>

          {/* Other upcoming exams count */}
          {upcoming.length > 1 && (
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <span className="text-xs text-muted-foreground">+{upcoming.length - 1}</span>
              <span className="text-[10px] text-muted-foreground">more</span>
            </div>
          )}

          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

/* ── Attendance button config ─────────────────────────────────────── */
const ATT_BTNS = [
  { key: "present",   label: "P", activeBg: "bg-emerald-500", activeRing: "ring-emerald-400" },
  { key: "absent",    label: "A", activeBg: "bg-rose-500",    activeRing: "ring-rose-400"    },
  { key: "cancelled", label: "C", activeBg: "bg-amber-400",   activeRing: "ring-amber-300"   },
];

/* ── Today attendance panel ───────────────────────────────────────── */
function TodayPanel({ today = [], day, mark, marking }) {
  const unmarked = today.filter((t) => !t.alreadyMarked);

  if (today.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No classes scheduled today ({day}).
      </p>
    );
  }

  const allDone = unmarked.length === 0;

  return (
    <div className="space-y-2">
      {allDone ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
          <CheckCheck size={13} className="text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold text-emerald-700">All classes marked for today!</p>
        </div>
      ) : (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
          {unmarked.length} class{unmarked.length !== 1 ? "es" : ""} not yet marked
        </p>
      )}

      {today.map(({ subject, markedStatus, uniqueKey, timetableName }) => (
        <div
          key={uniqueKey ?? subject.id}
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{subject.name}</span>
            {timetableName && (
              <span className="ml-1.5 text-[10px] text-primary/60 font-medium">{timetableName}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {ATT_BTNS.map(({ key, label, activeBg, activeRing }) => {
              const isActive  = markedStatus === key;
              const isLoading = marking === subject.id;
              return (
                <button
                  key={key}
                  disabled={isLoading}
                  onClick={() => mark(subject.id, key)}
                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                  className={cn(
                    "h-7 w-7 rounded-full text-[11px] font-bold transition-all duration-150 select-none",
                    isActive
                      ? `${activeBg} text-white ring-2 ring-offset-1 ${activeRing} scale-110`
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading && marking === subject.id ? "…" : label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard Tasks Banner — with subtask expansion ─────────────── */
function DashboardTasksBanner({ tasks, toggle, toggleSubtask }) {
  const now = new Date();
  const overdue  = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now);
  const highPri  = tasks.filter((t) => !t.completed && t.priority === "high" && !overdue.find((o) => o.id === t.id));
  const upcoming = [...overdue, ...highPri].slice(0, 4);
  const pending  = tasks.filter((t) => !t.completed);
  const allClear = pending.length === 0;
  const [expandedIds, setExpandedIds] = useState(new Set());

  function toggleExpand(taskId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  return (
    <div className={cn(
      "rounded-2xl border p-5 card-shadow",
      allClear
        ? "border-emerald-200 bg-emerald-50"
        : overdue.length > 0
          ? "border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50"
          : "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
    )}>
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "rounded-xl p-2",
            allClear ? "bg-emerald-100" : overdue.length > 0 ? "bg-rose-100" : "bg-amber-100"
          )}>
            {allClear
              ? <CheckCircle2 size={18} className="text-emerald-600" />
              : overdue.length > 0
                ? <Flame size={18} className="text-rose-600" />
                : <Clock size={18} className="text-amber-600" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {allClear ? "All tasks complete!" : "Tasks"}
            </h3>
            {!allClear && (
              <p className="text-xs text-muted-foreground">
                {overdue.length > 0 && `${overdue.length} overdue · `}{pending.length} pending
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/tasks"
            className="flex items-center gap-1 rounded-lg bg-white/70 border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white transition-colors"
          >
            <Plus size={11} /> Add
          </Link>
          <Link
            to="/tasks"
            className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
          >
            All <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Task list */}
      {allClear ? (
        <p className="text-sm text-emerald-700 font-medium text-center py-1">
          You're all caught up! Great work.
        </p>
      ) : upcoming.length > 0 ? (
        <div className="space-y-1.5">
          {upcoming.map((task) => {
            const isOverdue  = task.dueDate && new Date(task.dueDate) < now;
            const subtasks   = task.subtasks ?? [];
            const isExpanded = expandedIds.has(task.id);
            const doneSub    = subtasks.filter((s) => s.completed).length;

            return (
              <div key={task.id}>
                <div className="flex items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5 hover:bg-white/90 transition-colors">
                  <button
                    onClick={() => toggle(task.id, task.completed)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Circle size={17} />
                  </button>

                  {/* Clickable title — expands subtasks, no underline */}
                  <button
                    className="flex-1 text-left text-sm font-medium truncate focus:outline-none"
                    onClick={() => subtasks.length > 0 && toggleExpand(task.id)}
                  >
                    {task.title}
                  </button>

                  {subtasks.length > 0 && (
                    <span className="shrink-0 text-[10px] text-muted-foreground font-medium">
                      {doneSub}/{subtasks.length}
                    </span>
                  )}
                  {subtasks.length > 0 && (
                    <ChevronRight
                      size={13}
                      className={cn(
                        "shrink-0 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )}
                    />
                  )}

                  <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                    isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {isOverdue ? "overdue" : "high"}
                  </span>
                </div>

                {/* Subtask expansion — smooth max-height transition */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isExpanded ? `${subtasks.length * 44 + 8}px` : "0px" }}
                >
                  <div className="ml-10 mt-1 space-y-0.5 pb-1">
                    {subtasks.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-1.5"
                      >
                        <button
                          onClick={() => toggleSubtask(task.id, s.id)}
                          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {s.completed
                            ? <CheckCircle2 size={14} className="text-primary" />
                            : <Circle size={14} />}
                        </button>
                        <span className={cn(
                          "text-xs",
                          s.completed && "line-through text-muted-foreground"
                        )}>
                          {s.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {pending.length > upcoming.length && (
            <Link to="/tasks" className="block text-center text-xs text-muted-foreground hover:text-primary pt-1">
              +{pending.length - upcoming.length} more tasks
            </Link>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground px-1">
          {pending.length} pending task{pending.length !== 1 ? "s" : ""} — no urgent ones right now.{" "}
          <Link to="/tasks" className="text-primary underline">View all</Link>
        </p>
      )}
    </div>
  );
}

/* ── Habit Tracker Panel ──────────────────────────────────────────── */
function HabitTrackerPanel() {
  const { habits, todayLogs, toggleToday } = useHabits();

  if (habits.length === 0) return null;

  const doneCount = habits.filter((h) => todayLogs[h.id]).length;
  const allDone   = doneCount === habits.length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Repeat2 size={14} className="text-violet-500" />
            Daily Habits
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doneCount}/{habits.length} completed today
          </p>
        </div>
        <Link to="/tasks" className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline">
          Manage <ArrowRight size={11} />
        </Link>
      </div>

      {allDone && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5">
          <CheckCheck size={13} className="text-violet-600 shrink-0" />
          <p className="text-xs font-semibold text-violet-700">All habits done for today!</p>
        </div>
      )}

      <div className="space-y-1.5">
        {habits.map((habit) => {
          const done = !!(todayLogs[habit.id]);
          return (
            <div
              key={habit.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <button
                onClick={() => toggleToday(habit.id)}
                className={cn(
                  "shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                  done
                    ? "bg-violet-500 border-violet-500 text-white scale-105"
                    : "border-muted-foreground/40 hover:border-violet-400"
                )}
              >
                {done && <Check size={12} />}
              </button>
              <span className={cn("flex-1 text-sm truncate", done && "line-through text-muted-foreground")}>
                {habit.name}
              </span>
              {done && (
                <span className="shrink-0 text-[10px] font-semibold text-violet-500">Done ✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Motivational Quote Card ─────────────────────────────────────── */
function QuoteCard({ quote }) {
  if (!quote) return null;
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5 p-4 card-shadow">
      <div className="flex gap-3">
        <Quote size={18} className="text-primary/40 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium leading-relaxed text-foreground italic">
            {quote.text}
          </p>
          {quote.author && (
            <p className="mt-1 text-xs text-muted-foreground">— {quote.author}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Task Cleanup Prompt ─────────────────────────────────────────── */
function TaskCleanupPrompt({ count, onAccept, onDismiss }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
      <Trash2 size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          {count} completed task{count !== 1 ? "s" : ""} older than 7 days
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Would you like to delete them to keep your task list clean?
        </p>
        <div className="flex gap-2 mt-2">
          <button onClick={onAccept}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors">
            Delete old tasks
          </button>
          <button onClick={onDismiss}
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
            Keep them
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { overall, subjects = [] } = useAttendanceSummary();
  const { today = [], date, day, mark, marking } = useAttendanceToday();
  const { tasks = [], toggle, toggleSubtask } = useTasks({ archived: false });
  const { exams = [] }            = useExams();
  const { timetables = [] }       = useTimetable();
  const { subjects: allSubjects = [] } = useSubjects();
  const quote                     = useMotivationalQuote();

  const pendingTasks  = tasks.filter((t) => !t.completed).length;
  const riskCount     = subjects.filter((s) => s.zone === "risk").length;
  const activeExams   = exams.filter((e) => !e.archived).length;
  const unmarkedToday = today.filter((t) => !t.alreadyMarked).length;

  /* ── 7-day task cleanup prompt ─────────────────────────────────── */
  const [staleTaskIds,    setStaleTaskIds]    = useState([]);
  const [showCleanup,     setShowCleanup]     = useState(false);

  useEffect(() => {
    if (!tasks.length) return;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const stale  = tasks.filter((t) => {
      if (!t.completed) return false;
      const ts = t.completedAt ?? t.updatedAt ?? t.createdAt ?? "";
      return ts && new Date(ts).getTime() < cutoff;
    });
    if (stale.length > 0) {
      setStaleTaskIds(stale.map((t) => t.id));
      // Only prompt once per session
      const key = "sarasva_cleanup_prompted";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setShowCleanup(true);
      }
    }
  }, [tasks]);

  async function handleCleanupAccept() {
    setShowCleanup(false);
    for (const id of staleTaskIds) {
      try { await tasksService.archive(user.id, id); } catch {}
    }
    setStaleTaskIds([]);
  }

  /* ── Notification scheduling ───────────────────────────────────── */
  useEffect(() => {
    if (!user || subjects.length === 0) return;
    notificationsService.checkAndAlert(user, subjects, tasks);
  }, [user, subjects, tasks]);

  useEffect(() => {
    // Schedule period notifications from active timetable slots
    const activeTTs = timetables.filter((t) => t.active);
    const allSlots  = activeTTs.flatMap((t) => t.slots ?? []);
    const subjMap   = Object.fromEntries(allSubjects.map((s) => [s.id, s.name]));
    notificationsService.schedulePeriodNotifications(allSlots, (id) => subjMap[id]);
  }, [timetables, allSubjects]);

  useEffect(() => {
    notificationsService.scheduleTaskReminders(tasks);
  }, [tasks]);

  const barData = useMemo(() =>
    subjects.map((s) => ({
      name:               s.subject.name.length > 10 ? s.subject.name.slice(0, 10) + "…" : s.subject.name,
      fullName:           s.subject.name,
      percent:            s.percent,
      present:            s.present,
      total:              s.total,
      zone:               s.zone,
      classesNeededFor75: s.classesNeededFor75,
    })),
  [subjects]);

  const safePercent = overall?.percent ?? 0;
  const safeZone    = overall?.zone    ?? "risk";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {greeting}, <span className="font-medium text-foreground">{user?.name?.split(" ")[0]}</span>
        </p>
      </div>

      {/* Motivational quote — changes every hour */}
      <QuoteCard quote={quote} />

      {/* Exam countdown — prominent, right below greeting */}
      <ExamCountdownBanner exams={exams} />

      {/* 7-day task cleanup prompt */}
      {showCleanup && staleTaskIds.length > 0 && (
        <TaskCleanupPrompt
          count={staleTaskIds.length}
          onAccept={handleCleanupAccept}
          onDismiss={() => setShowCleanup(false)}
        />
      )}

      {/* Tasks banner */}
      <DashboardTasksBanner tasks={tasks} toggle={toggle} toggleSubtask={toggleSubtask} />

      {/* Today's Attendance */}
      <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <CalendarCheck size={14} className="text-primary" />
              Today's Attendance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{day}, {date}</p>
          </div>
          <Link to="/attendance" className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline">
            Full view <ArrowRight size={11} />
          </Link>
        </div>
        <TodayPanel today={today} day={day} mark={mark} marking={marking} />
      </div>

      {/* Daily Habits (below attendance) */}
      <HabitTrackerPanel />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarCheck} label="Overall Attendance" value={`${safePercent}%`}
          sub={<ZoneBadge zone={safeZone} />}
          iconBg="bg-blue-50" iconColor="text-blue-600" to="/attendance"
        />
        <StatCard
          icon={Target} label="Subjects at Risk" value={riskCount}
          sub={riskCount > 0 ? "Need attention" : "All safe"}
          iconBg={riskCount > 0 ? "bg-rose-50" : "bg-emerald-50"}
          iconColor={riskCount > 0 ? "text-rose-600" : "text-emerald-600"}
          to="/attendance"
        />
        <StatCard
          icon={ListChecks} label="Pending Tasks" value={pendingTasks}
          sub={pendingTasks > 0
            ? `${tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length} overdue`
            : "All clear"}
          iconBg="bg-violet-50" iconColor="text-violet-600" to="/tasks"
        />
        <StatCard
          icon={BookOpen} label="Active Exams" value={activeExams}
          sub={`${unmarkedToday} class${unmarkedToday !== 1 ? "es" : ""} unmarked today`}
          iconBg="bg-amber-50" iconColor="text-amber-600" to="/exams"
        />
      </div>

      {/* Main grid: Gauge + Target | Bar chart */}
      <div className="grid gap-4 lg:grid-cols-5">

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
            <h3 className="mb-3 text-sm font-semibold">Overall Attendance</h3>
            <div className="flex items-center gap-4">
              <OverallGauge percent={safePercent} zone={safeZone} />
              <div className="space-y-1.5 text-sm">
                {[
                  ["Present", overall?.present ?? 0],
                  ["Total",   overall?.total   ?? 0],
                  ["Absent",  (overall?.total ?? 0) - (overall?.present ?? 0)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-6">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Below 75% Alert</h3>
              <Link to="/attendance" className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline">
                Details <ArrowRight size={11} />
              </Link>
            </div>
            <TargetPanel subjects={subjects} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 card-shadow lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold">Subject-wise Attendance</h3>
          {barData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No attendance data yet. Start marking classes.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1.5}
                  label={{ value: "75%", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }} />
                <Tooltip content={<AttTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.zone === "safe" ? "#10b981" : "#f43f5e"} fillOpacity={0.82} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> ≥ 75% Safe
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500" /> &lt; 75% Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 bg-amber-400" style={{ borderTop: "1px dashed #f59e0b" }} /> 75% line
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
