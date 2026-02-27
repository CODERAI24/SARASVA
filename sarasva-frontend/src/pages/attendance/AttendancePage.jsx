import { useAttendanceToday, useAttendanceSummary } from "@/hooks/useAttendance.js";
import { cn } from "@/lib/utils.js";
import { CalendarCheck, ShieldCheck, ShieldAlert, TrendingUp } from "lucide-react";

/* ── Zone badge ───────────────────────────────────────────────────── */
function ZoneBadge({ zone }) {
  const safe = zone === "safe";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
      safe
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
    )}>
      {safe
        ? <ShieldCheck size={12} />
        : <ShieldAlert size={12} />}
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
        className={cn(
          "h-full rounded-full transition-all",
          safe ? "bg-green-500" : "bg-red-400"
        )}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

/* ── Mark today section ───────────────────────────────────────────── */
function MarkToday({ date, day, today, marking, onMark }) {
  if (today.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No classes scheduled for today ({day}). <br />
        <span className="text-xs">Add a timetable or set one as active to see scheduled subjects.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">Today's Classes</h3>
        <p className="text-xs text-muted-foreground">{day}, {date}</p>
      </div>

      <div className="divide-y divide-border">
        {today.map(({ subject, markedStatus, alreadyMarked }) => (
          <div key={subject.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium">{subject.name}</span>

            {alreadyMarked ? (
              /* Already marked — show status chip */
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                markedStatus === "present"
                  ? "bg-green-100 text-green-800"
                  : markedStatus === "absent"
                    ? "bg-red-100 text-red-800"
                    : markedStatus === "cancelled"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
              )}>
                {markedStatus.toUpperCase()}
              </span>
            ) : (
              /* Not yet marked — show action buttons */
              <div className="flex flex-wrap gap-1.5">
                <button
                  disabled={marking === subject.id}
                  onClick={() => onMark(subject.id, "present")}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Present
                </button>
                <button
                  disabled={marking === subject.id}
                  onClick={() => onMark(subject.id, "absent")}
                  className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Absent
                </button>
                <button
                  disabled={marking === subject.id}
                  onClick={() => onMark(subject.id, "cancelled")}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  Cancelled
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
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
      {/* Overall card */}
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

      {/* Per-subject cards */}
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
              {zone === "safe" && (
                <span className="font-medium text-green-600">On track</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function AttendancePage() {
  const { date, day, today, error: todayErr, marking, mark } = useAttendanceToday();
  const { overall, subjects, refresh } = useAttendanceSummary();

  function handleMark(subjectId, status) {
    mark(subjectId, status);
    // Refresh summary to reflect the new mark
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

      {(todayErr) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {todayErr}
        </div>
      )}

      {/* Mark section */}
      <MarkToday
        date={date}
        day={day}
        today={today ?? []}
        marking={marking}
        onMark={handleMark}
      />

      {/* Summary / Intelligence */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Attendance Intelligence</h3>
        <Summary overall={overall ?? { percent: 0, present: 0, total: 0, zone: "risk" }} subjects={subjects ?? []} />
      </div>
    </div>
  );
}
