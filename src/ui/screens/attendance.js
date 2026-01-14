import { getAppState, setAppState } from "../../storage/appState.js";

const SUBJECTS = [
  { id: "maths", name: "Mathematics" },
  { id: "physics", name: "Physics" },
  { id: "cs", name: "Computer Science" }
];

function today() {
  return new Date().toISOString().split("T")[0];
}

function subjectName(id) {
  return SUBJECTS.find((s) => s.id === id)?.name || id;
}

export function renderAttendance() {
  const state = getAppState();
  const records = state.attendance || [];
  const date = today();

  const todayList = SUBJECTS.map((subj) => {
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

  // Group history by date (excluding today)
  const historyByDate = records
    .filter((r) => r.date !== date)
    .reduce((acc, record) => {
      acc[record.date] = acc[record.date] || [];
      acc[record.date].push(record);
      return acc;
    }, {});

  const historyHtml = Object.keys(historyByDate)
    .sort()
    .reverse()
    .map(
      (d) => `
        <h4>${d}</h4>
        <ul>
          ${historyByDate[d]
            .map(
              (r) => `
                <li>
                  ${subjectName(r.subjectId)} — ${r.status.toUpperCase()}
                </li>
              `
            )
            .join("")}
        </ul>
      `
    )
    .join("");

  return `
    <h2>Attendance (${date})</h2>
    <ul id="attendance-list">
      ${todayList}
    </ul>

    <hr />

    <h3>Attendance History</h3>
    ${historyHtml || "<p>No past records.</p>"}
  `;
}

export function attachAttendanceEvents() {
  const list = document.getElementById("attendance-list");
  if (!list) return;

  list.addEventListener("click", (e) => {
    const subjectId = e.target.dataset.subject;
    const status = e.target.dataset.status;
    if (!subjectId || !status) return;

    const state = getAppState();
    const date = today();

    // IMMUTABLE: do not allow re-marking
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

    // re-render
    document.getElementById("content").innerHTML = renderAttendance();
    attachAttendanceEvents();
  });
}
