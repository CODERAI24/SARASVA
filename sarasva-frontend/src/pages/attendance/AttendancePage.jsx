import { useState, useMemo, useCallback } from "react";
import { useAttendanceToday, useAttendanceSummary, useAttendanceLog } from "@/hooks/useAttendance.js";
import { useTimetable } from "@/hooks/useTimetable.js";
import { useSubjects } from "@/hooks/useSubjects.js";
import { attendanceService, DAYS } from "@/services/attendance.service.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { cn } from "@/lib/utils.js";
import {
  CalendarCheck, ShieldCheck, ShieldAlert, TrendingUp,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";

/* ── Zone badge ───────────────────────────────────────────────────── */
function ZoneBadge({ zone }) {
  const safe = zone === "safe";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
      safe ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    )}>
      {safe ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
      {safe ? "SAFE" : "RISK"}
    </span>
  );
}

/* ── Progress bar ─────────────────────────────────────────────────── */
function ProgressBar({ percent }) {
  const safe = percent >= 75;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", safe ? "bg-green-500" : "bg-red-400")}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

/* ── Status chip ──────────────────────────────────────────────────── */
function StatusChip({ status }) {
  if (!status) return null;
  const map = {
    present:   "bg-green-100 text-green-800",
    absent:    "bg-red-100 text-red-800",
    cancelled: "bg-yellow-100 text-yellow-800",
    extra:     "bg-blue-100 text-blue-800",
  };
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", map[status] ?? "bg-muted text-muted-foreground")}>
      {status.toUpperCase()}
    </span>
  );
}

/* ── Mark buttons ─────────────────────────────────────────────────── */
function MarkButtons({ subjectId, marking, onMark, disabled }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[
        { key: "present",   label: "Present",   cls: "bg-green-600 hover:bg-green-700 text-white" },
        { key: "absent",    label: "Absent",    cls: "bg-red-500 hover:bg-red-600 text-white" },
        { key: "cancelled", label: "Cancelled", cls: "border border-border text-muted-foreground hover:bg-accent" },
      ].map(({ key, label, cls }) => (
        <button
          key={key}
          disabled={marking === subjectId || disabled}
          onClick={() => onMark(subjectId, key)}
          className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50", cls)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── Mark Today section — grouped by timetable ────────────────────── */
function MarkToday({ date, day, today, marking, onMark }) {
  if (today.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No classes scheduled for today ({day}).<br />
        <span className="text-xs">Add a timetable or set one as active to see scheduled subjects.</span>
      </div>
    );
  }

  // Group by timetable (null timetableName = no active timetable)
  const groups = useMemo(() => {
    const map = new Map();
    today.forEach((item) => {
      const key = item.timetableId ?? "__none__";
      if (!map.has(key)) map.set(key, { name: item.timetableName, items: [] });
      map.get(key).items.push(item);
    });
    return [...map.values()];
  }, [today]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">Today's Classes</h3>
        <p className="text-xs text-muted-foreground">{day}, {date}</p>
      </div>

      <div>
        {groups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "border-t border-border")}>
            {group.name && (
              <div className="px-4 pt-3 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/70 bg-primary/5 rounded-full px-2 py-0.5">
                  {group.name}
                </span>
              </div>
            )}
            <div className="divide-y divide-border">
              {group.items.map(({ subject, markedStatus, alreadyMarked, uniqueKey, slot }) => (
                <div
                  key={uniqueKey}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="text-sm font-medium">{subject.name}</span>
                    {slot?.startTime && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {slot.startTime}–{slot.endTime}
                      </span>
                    )}
                  </div>

                  {alreadyMarked ? (
                    <div className="flex items-center gap-2">
                      <StatusChip status={markedStatus} />
                      <button
                        onClick={() => onMark(subject.id, markedStatus === "present" ? "absent" : "present")}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline"
                      >
                        change
                      </button>
                    </div>
                  ) : (
                    <MarkButtons subjectId={subject.id} marking={marking} onMark={onMark} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Monthly Calendar ─────────────────────────────────────────────── */

/** Returns YYYY-MM-DD for a Date object using LOCAL time (avoids UTC shift for IST users). */
function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Dominant status color for a day's records */
function dayColor(records) {
  if (!records || records.length === 0) return null;
  const count = { present: 0, absent: 0, cancelled: 0 };
  records.forEach((r) => { if (count[r.status] !== undefined) count[r.status]++; });
  const max = Math.max(count.present, count.absent, count.cancelled);
  if (max === 0) return null;
  if (count.present === max) return "present";
  if (count.absent  === max) return "absent";
  return "cancelled";
}

const DAY_COLORS = {
  present:   "bg-green-400",
  absent:    "bg-red-400",
  cancelled: "bg-yellow-400",
};
const DAY_BG = {
  present:   "bg-green-50 border-green-200",
  absent:    "bg-red-50 border-red-200",
  cancelled: "bg-yellow-50 border-yellow-200",
};

function AttendanceCalendar({ allRecords, timetables, subjects, onRetroMark }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selected,  setSelected]  = useState(null); // "YYYY-MM-DD"

  /* Build record map: date → records[] */
  const recordsByDate = useMemo(() => {
    const map = {};
    allRecords.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [allRecords]);

  /* Calendar grid */
  const calDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last  = new Date(viewYear, viewMonth + 1, 0);
    // Start grid on Monday
    const startDow = (first.getDay() + 6) % 7; // Mon=0
    const grid = [];
    for (let i = 0; i < startDow; i++) grid.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      grid.push(new Date(viewYear, viewMonth, d));
    }
    // Pad to full weeks
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelected(null);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-IN", {
    month: "long", year: "numeric",
  });
  const todayStr = dateStr(today);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold text-sm">Monthly Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded p-1 hover:bg-accent transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium min-w-[130px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="rounded p-1 hover:bg-accent transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {calDays.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />;
          const ds     = dateStr(day);
          const recs   = recordsByDate[ds];
          const col    = dayColor(recs);
          const isToday   = ds === todayStr;
          const isSel     = ds === selected;
          const isFuture  = ds > todayStr;

          return (
            <button
              key={ds}
              disabled={isFuture}
              onClick={() => setSelected(isSel ? null : ds)}
              className={cn(
                "aspect-square flex flex-col items-center justify-center gap-0.5 text-xs transition-all duration-150 border border-transparent",
                isFuture ? "opacity-30 cursor-default" : "cursor-pointer hover:bg-accent active:scale-95",
                isSel && "ring-2 ring-primary ring-inset",
                isToday && !isSel && "font-bold text-primary",
                col && !isSel && DAY_BG[col],
              )}
            >
              <span className={cn("text-xs", isToday && "underline underline-offset-2")}>{day.getDate()}</span>
              {col && (
                <span className={cn("h-1.5 w-1.5 rounded-full", DAY_COLORS[col])} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-border text-xs text-muted-foreground">
        {[["present","green","Present"],["absent","red","Absent"],["cancelled","yellow","Cancelled"]].map(([k,c,l]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", DAY_COLORS[k])} /> {l}
          </span>
        ))}
      </div>

      {/* Retro mark panel */}
      {selected && (
        <RetroMarkPanel
          date={selected}
          timetables={timetables}
          subjects={subjects}
          existingRecords={recordsByDate[selected] ?? []}
          onMark={onRetroMark}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ── Retro mark panel (shown below calendar when a date is clicked) ── */
function RetroMarkPanel({ date, timetables, subjects, existingRecords, onMark, onClose }) {
  const [selectedTT, setSelectedTT] = useState(null);
  const [marking,    setMarking]    = useState(null);

  const parsedDate = new Date(date + "T12:00:00");
  const dayName    = DAYS[parsedDate.getDay()];
  const displayDate = parsedDate.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
  });

  // Active timetables valid for this date
  const validTTs = timetables.filter(
    (tt) => tt.active && !tt.archived && (!tt.startDate || tt.startDate <= date)
  );

  const activeTT = validTTs.find((tt) => tt.id === selectedTT) ?? validTTs[0] ?? null;

  const scheduledSubjects = useMemo(() => {
    if (!activeTT) {
      // No timetable active — show all subjects
      return subjects.map((s) => ({ subject: s, slot: null }));
    }
    const slots = (activeTT.slots ?? [])
      .filter((s) => s.day === dayName)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
    return slots.map((slot) => {
      const subject = subjects.find((s) => s.id === slot.subjectId);
      return subject ? { subject, slot } : null;
    }).filter(Boolean);
  }, [activeTT, dayName, subjects]);

  const markedMap = useMemo(() => {
    const m = {};
    existingRecords.forEach((r) => { m[r.subjectId] = r.status; });
    return m;
  }, [existingRecords]);

  async function handleMark(subjectId, status) {
    setMarking(subjectId);
    try {
      await onMark(subjectId, status, date);
    } finally {
      setMarking(null);
    }
  }

  return (
    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{displayDate}</p>
          <p className="text-xs text-muted-foreground">Mark attendance for this date</p>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-accent transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Timetable selector (if multiple valid TTs) */}
      {validTTs.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground self-center">Timetable:</span>
          {validTTs.map((tt) => (
            <button
              key={tt.id}
              onClick={() => setSelectedTT(tt.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                (selectedTT ?? validTTs[0]?.id) === tt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {tt.name}
            </button>
          ))}
        </div>
      )}

      {/* Subjects for this day */}
      {scheduledSubjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">
          No classes scheduled for {dayName} in this timetable.
        </p>
      ) : (
        <div className="space-y-2">
          {scheduledSubjects.map(({ subject, slot }) => {
            const existing = markedMap[subject.id];
            return (
              <div key={subject.id} className="flex flex-col gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-sm font-medium">{subject.name}</span>
                  {slot?.startTime && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {slot.startTime}–{slot.endTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {existing && <StatusChip status={existing} />}
                  <MarkButtons
                    subjectId={subject.id}
                    marking={marking}
                    onMark={handleMark}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Summary section ──────────────────────────────────────────────── */
function Summary({ overall, subjects }) {
  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No attendance data yet. Start marking your classes above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" />
            <span className="text-sm font-semibold">Overall Attendance</span>
          </div>
          <ZoneBadge zone={overall.zone} />
        </div>
        <ProgressBar percent={overall.percent} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {overall.present} present / {overall.total} total — {overall.percent}%
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        <div className="px-4 py-2.5">
          <h3 className="text-sm font-semibold">Subject-wise Intelligence</h3>
        </div>
        {subjects.map(({ subject, percent, present, total, zone, classesNeededFor75 }) => (
          <div key={subject.id} className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{subject.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{percent}%</span>
                <ZoneBadge zone={zone} />
              </div>
            </div>
            <ProgressBar percent={percent} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{present} present / {total} total</span>
              {zone === "risk" && classesNeededFor75 > 0 && (
                <span className="font-medium text-red-600">
                  Need {classesNeededFor75} consecutive present class{classesNeededFor75 !== 1 ? "es" : ""} to reach 75%
                </span>
              )}
              {zone === "safe" && <span className="font-medium text-green-600">On track</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function AttendancePage() {
  const { user } = useAuth();
  const { date, day, today, error: todayErr, marking, mark } = useAttendanceToday();
  const { overall, subjects, refresh } = useAttendanceSummary();
  const { records: allRecords } = useAttendanceLog();
  const { timetables } = useTimetable();
  const { subjects: subjectList } = useSubjects({ archived: false });

  function handleMark(subjectId, status) {
    mark(subjectId, status);
    setTimeout(refresh, 50);
  }

  async function handleRetroMark(subjectId, status, date) {
    if (!user) return;
    await attendanceService.mark(user.id, { subjectId, status, date });
    setTimeout(refresh, 50);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarCheck size={24} className="text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="text-sm text-muted-foreground">Mark today's classes and track your progress.</p>
        </div>
      </div>

      {todayErr && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {todayErr}
        </div>
      )}

      {/* Mark today */}
      <MarkToday
        date={date}
        day={day}
        today={today ?? []}
        marking={marking}
        onMark={handleMark}
      />

      {/* Monthly Calendar */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Monthly View</h3>
        <AttendanceCalendar
          allRecords={allRecords}
          timetables={timetables}
          subjects={subjectList}
          onRetroMark={handleRetroMark}
        />
      </div>

      {/* Summary / Intelligence */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Attendance Intelligence</h3>
        <Summary
          overall={overall ?? { percent: 0, present: 0, total: 0, zone: "risk" }}
          subjects={subjects ?? []}
        />
      </div>
    </div>
  );
}
