import { useMemo } from "react";
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
import { cn }                  from "@/lib/utils.js";
import {
  ShieldCheck, ShieldAlert, CalendarCheck,
  Target, ListChecks, BookOpen, ArrowRight,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────────────── */
function ZoneBadge({ zone }) {
  const safe = zone === "safe";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
      safe ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    )}>
      {safe ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
      {safe ? "SAFE" : "RISK"}
    </span>
  );
}

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, iconColor = "text-primary", to }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
      <div className={cn("mt-0.5 rounded-lg bg-primary/10 p-2", iconColor)}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{d.name}</p>
      <p>{d.percent}% attendance</p>
      <p className="text-muted-foreground">{d.present} present / {d.total} total</p>
      {d.zone === "risk" && d.classesNeededFor75 > 0 && (
        <p className="mt-1 font-medium text-red-600">Need {d.classesNeededFor75} more to reach 75%</p>
      )}
    </div>
  );
}

/* ── Radial gauge for overall attendance ──────────────────────────── */
function OverallGauge({ percent, zone }) {
  const data = [{ value: percent, fill: zone === "safe" ? "#22c55e" : "#ef4444" }];
  return (
    <div className="relative flex flex-col items-center justify-center">
      <RadialBarChart
        width={160} height={160}
        cx={80} cy={80}
        innerRadius={54} outerRadius={72}
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
      {/* Centre text */}
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
        <ShieldCheck size={28} className="text-green-500 opacity-70" />
        <p>All subjects are above 75%!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {risk.map((s) => (
        <div key={s.subject.id} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-red-900">{s.subject.name}</span>
            <span className="text-xs font-bold text-red-700">{s.percent}%</span>
          </div>
          {/* Mini progress bar */}
          <div className="my-1.5 h-1.5 w-full overflow-hidden rounded-full bg-red-200">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${s.percent}%` }}
            />
          </div>
          <p className="text-xs text-red-700">
            Attend <strong>{s.classesNeededFor75}</strong> consecutive class{s.classesNeededFor75 !== 1 ? "es" : ""} to reach 75%
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Today panel ──────────────────────────────────────────────────── */
function TodayPanel({ today = [], date, day }) {
  const unmarked = today.filter((t) => !t.alreadyMarked);
  const marked   = today.filter((t) =>  t.alreadyMarked);

  if (today.length === 0) {
    return <p className="py-3 text-center text-sm text-muted-foreground">No classes scheduled for today ({day}).</p>;
  }

  return (
    <div className="space-y-1.5">
      {unmarked.length > 0 && (
        <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-md px-2 py-1">
          {unmarked.length} class{unmarked.length !== 1 ? "es" : ""} not yet marked
        </p>
      )}
      {today.map(({ subject, markedStatus, alreadyMarked }) => (
        <div key={subject.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50">
          <span className="text-sm">{subject.name}</span>
          {alreadyMarked ? (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              markedStatus === "present"   && "bg-green-100 text-green-800",
              markedStatus === "absent"    && "bg-red-100 text-red-800",
              markedStatus === "cancelled" && "bg-yellow-100 text-yellow-800",
              markedStatus === "extra"     && "bg-blue-100 text-blue-800",
            )}>
              {markedStatus}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              unmarked
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Tasks panel ──────────────────────────────────────────────────── */
function TasksPanel({ tasks }) {
  const overdue  = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
  const high     = tasks.filter((t) => !t.completed && t.priority === "high" && !overdue.find((o) => o.id === t.id));
  const upcoming = [...overdue, ...high].slice(0, 5);

  if (tasks.filter((t) => !t.completed).length === 0) {
    return <p className="py-3 text-center text-sm text-muted-foreground">No pending tasks.</p>;
  }

  return (
    <div className="space-y-1.5">
      {upcoming.length > 0 ? upcoming.map((task) => {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
        return (
          <div key={task.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50">
            <span className="text-sm truncate max-w-[70%]">{task.title}</span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              isOverdue           ? "bg-red-100 text-red-800"
              : task.priority === "high" ? "bg-red-100 text-red-800"
              : "bg-amber-100 text-amber-800"
            )}>
              {isOverdue ? "overdue" : task.priority}
            </span>
          </div>
        );
      }) : (
        <p className="text-sm text-muted-foreground px-2">
          {tasks.filter((t) => !t.completed).length} pending task{tasks.filter((t) => !t.completed).length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { overall, subjects = [] } = useAttendanceSummary();
  const { today = [], date, day } = useAttendanceToday();
  const { tasks = [] }            = useTasks({ archived: false });
  const { exams = [] }            = useExams();

  const pendingTasks  = tasks.filter((t) => !t.completed).length;
  const riskCount     = subjects.filter((s) => s.zone === "risk").length;
  const activeExams   = exams.filter((e) => !e.archived).length;
  const unmarkedToday = today.filter((t) => !t.alreadyMarked).length;

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

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}
        </p>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Overall Attendance"
          value={`${safePercent}%`}
          sub={<ZoneBadge zone={safeZone} />}
          to="/attendance"
        />
        <StatCard
          icon={Target}
          label="Subjects at Risk"
          value={riskCount}
          sub={riskCount > 0 ? "Need attention" : "All safe"}
          iconColor={riskCount > 0 ? "text-red-600" : "text-green-600"}
          to="/attendance"
        />
        <StatCard
          icon={ListChecks}
          label="Pending Tasks"
          value={pendingTasks}
          sub={pendingTasks > 0 ? `${tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length} overdue` : "All clear"}
          to="/tasks"
        />
        <StatCard
          icon={BookOpen}
          label="Active Exams"
          value={activeExams}
          sub={`${unmarkedToday} class${unmarkedToday !== 1 ? "es" : ""} unmarked today`}
          to="/exams"
        />
      </div>

      {/* Main grid: Gauge + Target | Bar chart */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Left: Gauge + Target subjects */}
        <div className="space-y-4 lg:col-span-2">

          {/* Overall gauge */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Overall Attendance</h3>
            <div className="flex items-center gap-4">
              <OverallGauge percent={safePercent} zone={safeZone} />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Present</span>
                  <span className="font-medium">{overall?.present ?? 0}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{overall?.total ?? 0}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Absent</span>
                  <span className="font-medium">{(overall?.total ?? 0) - (overall?.present ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Target panel */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Target — Below 75%</h3>
              <Link to="/attendance" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
                Details <ArrowRight size={11} />
              </Link>
            </div>
            <TargetPanel subjects={subjects} />
          </div>
        </div>

        {/* Right: Bar chart */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
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
                {/* 75% threshold reference line */}
                <ReferenceLine
                  y={75}
                  stroke="#f59e0b"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: "75%", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
                />
                <Tooltip content={<AttTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.zone === "safe" ? "#22c55e" : "#ef4444"}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" /> ≥ 75% (Safe)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> &lt; 75% (Risk)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 bg-amber-400 border-t border-dashed border-amber-400" /> 75% threshold
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Today's classes | Pending tasks */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Today */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Today's Classes</h3>
              <p className="text-xs text-muted-foreground">{day}, {date}</p>
            </div>
            <Link to="/attendance" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
              Mark <ArrowRight size={11} />
            </Link>
          </div>
          <TodayPanel today={today} date={date} day={day} />
        </div>

        {/* Tasks */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Urgent Tasks</h3>
              <p className="text-xs text-muted-foreground">Overdue + high priority</p>
            </div>
            <Link to="/tasks" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
              All tasks <ArrowRight size={11} />
            </Link>
          </div>
          <TasksPanel tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
