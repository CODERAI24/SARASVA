import { useMemo, useEffect } from "react";
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
import { notificationsService } from "@/services/notifications.service.js";
import { cn }                  from "@/lib/utils.js";
import {
  ShieldCheck, ShieldAlert, CalendarCheck,
  Target, ListChecks, BookOpen, ArrowRight,
  CheckCircle2, Circle, Plus, Clock, Flame, CheckCheck,
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

/* ── Radial gauge for overall attendance ──────────────────────────── */
function OverallGauge({ percent, zone }) {
  const data = [{ value: percent, fill: zone === "safe" ? "#10b981" : "#f43f5e" }];
  return (
    <div className="relative flex flex-col items-center justify-center">
      <RadialBarChart
        width={156} height={156}
        cx={78} cy={78}
        innerRadius={52} outerRadius={70}
        startAngle={225} endAngle={-45}
        data={data}
        barSize={14}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={8}
          background={{ fill: "hsl(var(--muted))" }}
          angleAxisId={0}
        />
      </RadialBarChart>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold leading-none">{percent}%</span>
        <ZoneBadge zone={zone} />
      </div>
    </div>
  );
}

/* ── Target panel: subjects that need more attendance ─────────────── */
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

/* ── Status colours for attendance buttons ────────────────────────── */
const ATT_BTNS = [
  { key: "present",   label: "P", activeBg: "bg-emerald-500", activeRing: "ring-emerald-400" },
  { key: "absent",    label: "A", activeBg: "bg-rose-500",    activeRing: "ring-rose-400"    },
  { key: "cancelled", label: "C", activeBg: "bg-amber-400",   activeRing: "ring-amber-300"   },
];

/* ── Today attendance panel — inline marking ──────────────────────── */
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

      {today.map(({ subject, markedStatus }) => (
        <div
          key={subject.id}
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
        >
          {/* Subject name */}
          <span className="flex-1 text-sm font-medium truncate">{subject.name}</span>

          {/* Mark buttons — P / A / C */}
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

/* ── Dashboard Tasks Banner — hero section at top ─────────────────── */
function DashboardTasksBanner({ tasks, toggle }) {
  const now = new Date();
  const overdue  = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now);
  const highPri  = tasks.filter((t) => !t.completed && t.priority === "high" && !overdue.find((o) => o.id === t.id));
  const upcoming = [...overdue, ...highPri].slice(0, 4);
  const pending  = tasks.filter((t) => !t.completed);

  const allClear = pending.length === 0;

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
            const isOverdue = task.dueDate && new Date(task.dueDate) < now;
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5 hover:bg-white/90 transition-colors"
              >
                <button
                  onClick={() => toggle(task.id, task.completed)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Circle size={17} />
                </button>
                <span className="flex-1 text-sm font-medium truncate">{task.title}</span>
                <span className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                  isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                )}>
                  {isOverdue ? "overdue" : "high"}
                </span>
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

/* ── Page ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { overall, subjects = [] } = useAttendanceSummary();
  const { today = [], date, day, mark, marking } = useAttendanceToday();
  const { tasks = [], toggle }    = useTasks({ archived: false });
  const { exams = [] }            = useExams();

  const pendingTasks  = tasks.filter((t) => !t.completed).length;
  const riskCount     = subjects.filter((s) => s.zone === "risk").length;
  const activeExams   = exams.filter((e) => !e.archived).length;
  const unmarkedToday = today.filter((t) => !t.alreadyMarked).length;

  /* Fire daily notifications once data loads */
  useEffect(() => {
    if (!user || subjects.length === 0) return;
    notificationsService.checkAndAlert(user, subjects, tasks);
  }, [user, subjects, tasks]);

  /* Bar chart data */
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

      {/* ── TASKS BANNER (top priority) ────────────────────────────── */}
      <DashboardTasksBanner tasks={tasks} toggle={toggle} />

      {/* ── TODAY'S ATTENDANCE ──────────────────────────────────────── */}
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

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Overall Attendance"
          value={`${safePercent}%`}
          sub={<ZoneBadge zone={safeZone} />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          to="/attendance"
        />
        <StatCard
          icon={Target}
          label="Subjects at Risk"
          value={riskCount}
          sub={riskCount > 0 ? "Need attention" : "All safe"}
          iconBg={riskCount > 0 ? "bg-rose-50" : "bg-emerald-50"}
          iconColor={riskCount > 0 ? "text-rose-600" : "text-emerald-600"}
          to="/attendance"
        />
        <StatCard
          icon={ListChecks}
          label="Pending Tasks"
          value={pendingTasks}
          sub={pendingTasks > 0
            ? `${tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length} overdue`
            : "All clear"}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          to="/tasks"
        />
        <StatCard
          icon={BookOpen}
          label="Active Exams"
          value={activeExams}
          sub={`${unmarkedToday} class${unmarkedToday !== 1 ? "es" : ""} unmarked today`}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          to="/exams"
        />
      </div>

      {/* Main grid: Gauge + Target | Bar chart */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Left: Gauge + Target subjects */}
        <div className="space-y-4 lg:col-span-2">

          {/* Overall gauge */}
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

          {/* Target panel */}
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

        {/* Right: Bar chart */}
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
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine
                  y={75}
                  stroke="#f59e0b"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: "75%", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
                />
                <Tooltip content={<AttTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.zone === "safe" ? "#10b981" : "#f43f5e"}
                      fillOpacity={0.82}
                    />
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
