import { getAppState } from "../../storage/appState.js";

function groupByDate(records) {
  return records.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});
}

function subjectName(state, id) {
  return state.subjects.find(s => s.id === id)?.name || id;
}

export function renderHistory() {
  const state = getAppState();
  const records = state.attendance || [];

  if (records.length === 0) {
    return `
      <h2>Attendance History</h2>
      <p>No attendance records yet.</p>
    `;
  }

  const grouped = groupByDate(records);
  const dates = Object.keys(grouped).sort().reverse(); // latest first

  const historyHtml = dates.map(date => {
    const dayRecords = grouped[date];

    const items = dayRecords.map(r => `
      <li>
        ${subjectName(state, r.subjectId)} — 
        <strong>${r.status.toUpperCase()}</strong>
      </li>
    `).join("");

    return `
      <section style="margin-bottom: 16px;">
        <h4>${date}</h4>
        <ul>${items}</ul>
      </section>
    `;
  }).join("");

  return `
    <h2>Attendance History</h2>
    ${historyHtml}
  `;
}
