import { getAppState, setAppState } from "../../storage/appState.js";

/* -------------------- Helpers -------------------- */

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function today() {
  return new Date().toISOString().split("T")[0];
}

function todayDayName() {
  return DAYS[new Date().getDay()];
}

function activeSubjects(state) {
  return (state.subjects || []).filter((s) => !s.archived);
}

function subjectName(state, id) {
  return state.subjects.find((s) => s.id === id)?.name || id;
}

function subjectsScheduledToday(state) {
  const timetables = state.timetables || [];
  const activeTT = timetables.find((t) => t.active);

  // If no timetable, allow all active subjects
  if (!activeTT) {
    return activeSubjects(state).map((s) => s.id);
  }

  const todayDay = todayDayName();

  return activeTT.slots
    .filter((slot) => slot.day === todayDay)
    .map((slot) => slot.subjectId);
}

/* ---------------- Attendance Calculations ---------------- */

function calculateSubjectStats(records, subjectId) {
  const subjectRecords = records.filter((r) => r.subjectId === subjectId);
  const total = subjectRecords.length;
  const present = subjectRecords.filter((r) => r.status === "present").length;
  const percent = total === 0 ? 0 : Math.round((present / total) * 100);

  return { total, present, percent };
}

function calculateOverallStats(records) {
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const percent = total === 0 ? 0 : Math.round((present / total) * 100);

  return { total, present, percent };
}

function zone(percent) {
  return percent >= 75 ? "safe" : "risk";
}

/* -------------------- UI -------------------- */

export function renderAttendance() {
  const state = getAppState();
  const records = state.attendance || [];
  const date = today();

  const allowedSubjectIds = subjectsScheduledToday(state);
  const subjectsToday = activeSubjects(state).filter((s) =>
    allowedSubjectIds.includes(s.id)
  );

  /* Today marking section */
  const todayList = subjectsToday.length === 0
    ? `<li>No classes scheduled today.</li>`
    : subjectsToday.map((subj) => {
        const alreadyMarked = records.find(
          (r) => r.subjectId === subj.id && r.date === date
        );

        return `
          <li>
            <strong>${subj.name}</strong>
            ${
              alreadyMarked
                ? `<span> — ${alreadyMarked.status.toUpperCase()}</span>`
                : `
                  <button data-subject="${subj.id}" data-status="present">Present</button>
                  <button data-subject="${subj.id}" data-status="absent">Absent</button>
                `
            }
          </li>
        `;
      }).join("");

  /* Subject-wise stats */
  const subjectStatsHtml = activeSubjects(state)
    .map((s) => {
      const stats = calculateSubjectStats(records, s.id);
      const z = zone(stats.percent);

      return `
        <li>
          ${s.name}: ${stats.percent}%
          <strong style="color:${z === "safe" ? "green" : "red"}">
            (${z.toUpperCase()})
          </strong>
        </li>
      `;
    })
    .join("");

  /* Overall stats */
  const overall = calculateOverallStats(records);
  const overallZone = zone(overall.percent);

  return `
    <h2>Attendance (${date})</h2>

    <ul id="attendance-list">
      ${todayList}
    </ul>

    <hr />

    <h3>Attendance Summary</h3>
    <p>
      Overall:
      <strong style="color:${overallZone === "safe" ? "green" : "red"}">
        ${overall.percent}% (${overallZone.toUpperCase()})
      </strong>
    </p>

    <ul>
      ${subjectStatsHtml}
    </ul>
  `;
}

/* -------------------- Events -------------------- */

export function attachAttendanceEvents() {
  const list = document.getElementById("attendance-list");
  if (!list) return;

  list.addEventListener("click", (e) => {
    const subjectId = e.target.dataset.subject;
    const status = e.target.dataset.status;
    if (!subjectId || !status) return;

    const state = getAppState();
    const date = today();

    // Immutable: prevent re-marking
    const exists = state.attendance.find(
      (r) => r.subjectId === subjectId && r.date === date
    );
    if (exists) return;

    state.attendance.push({
      id: Date.now().toString(),
      subjectId,
      date,
      status,
      createdAt: Date.now(),
      locked: true
    });

    setAppState(state);

    document.getElementById("content").innerHTML = renderAttendance();
    attachAttendanceEvents();
  });
}
