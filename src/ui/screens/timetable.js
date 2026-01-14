import { getAppState, setAppState } from "../../storage/appState.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* -------------------- Helpers -------------------- */

function activeSubjects(state) {
  return (state.subjects || []).filter(s => !s.archived);
}

function subjectName(state, id) {
  return state.subjects.find(s => s.id === id)?.name || id;
}

function getActiveTimetable(state) {
  return (state.timetables || []).find(t => t.active && !t.archived);
}

/* -------------------- UI -------------------- */

export function renderTimetable() {
  const state = getAppState();
  const timetables = state.timetables || [];
  const activeTT = getActiveTimetable(state);
  const inactiveTT = timetables.filter(t => !t.active && !t.archived);

  /* ---- Timetable creation ---- */
  const createSection = `
    <form id="timetable-form">
      <input
        type="text"
        id="timetable-name"
        placeholder="Timetable name (e.g. Semester 4)"
        required
      />
      <button type="submit">Create Timetable</button>
    </form>
  `;

  /* ---- Active timetable ---- */
  const activeSection = activeTT
    ? `
      <h3>Active Timetable</h3>
      <p><strong>${activeTT.name}</strong></p>

      <h4>Add Class Slot</h4>
      <form id="slot-form">
        <select id="slot-day" required>
          ${DAYS.map(d => `<option value="${d}">${d}</option>`).join("")}
        </select>

        <select id="slot-subject" required>
          ${activeSubjects(state)
            .map(s => `<option value="${s.id}">${s.name}</option>`)
            .join("")}
        </select>

        <input type="time" id="slot-start" required />
        <input type="time" id="slot-end" required />

        <button type="submit">Add Slot</button>
      </form>

      <h4>Weekly Slots</h4>
      ${renderSlotsTable(state, activeTT)}
    `
    : `<p>No active timetable.</p>`;

  /* ---- Other timetables ---- */
  const otherSection =
    inactiveTT.length === 0
      ? "<p>No other timetables.</p>"
      : `
        <ul id="timetable-list">
          ${inactiveTT.map(t => `
            <li data-id="${t.id}">
              ${t.name}
              <button data-action="activate">Activate</button>
              <button data-action="archive">Archive</button>
            </li>
          `).join("")}
        </ul>
      `;

  return `
    <h2>Timetable</h2>

    ${createSection}

    <hr />

    ${activeSection}

    <hr />

    <h3>Other Timetables</h3>
    ${otherSection}
  `;
}

/* -------------------- Slot Table -------------------- */

function renderSlotsTable(state, timetable) {
  if (!timetable.slots || timetable.slots.length === 0) {
    return "<p>No slots added yet.</p>";
  }

  const rows = DAYS.map(day => {
    const slots = timetable.slots.filter(s => s.day === day);

    if (slots.length === 0) {
      return `
        <tr>
          <td>${day}</td>
          <td>—</td>
        </tr>
      `;
    }

    return slots.map((slot, index) => `
      <tr>
        <td>${index === 0 ? day : ""}</td>
        <td>
          ${subjectName(state, slot.subjectId)}
          (${slot.startTime} - ${slot.endTime})
        </td>
      </tr>
    `).join("");
  }).join("");

  return `
    <table border="1" cellpadding="6">
      <thead>
        <tr>
          <th>Day</th>
          <th>Class</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/* -------------------- Events -------------------- */

export function attachTimetableEvents() {

  /* Create timetable */
  const ttForm = document.getElementById("timetable-form");
  if (ttForm) {
    ttForm.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Create timetable submit fired");


      const input = document.getElementById("timetable-name");
      const name = input.value.trim();
      if (!name) return;

      const state = getAppState(); // ✅ fresh state

      state.timetables.push({
        id: Date.now().toString(),
        name,
        active: state.timetables.length === 0,
        archived: false,
        slots: [],
        createdAt: Date.now()
      });

      setAppState(state);
      rerender();
    });
  }

  /* Activate / archive timetable */
  const list = document.getElementById("timetable-list");
  if (list) {
    list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;

      const id = li.dataset.id;
      const action = e.target.dataset.action;
      if (!action) return;

      const state = getAppState(); // ✅ fresh state

      if (action === "activate") {
        state.timetables.forEach((t) => {
          t.active = t.id === id;
        });
      }

      if (action === "archive") {
        const tt = state.timetables.find((t) => t.id === id);
        if (tt) {
          tt.archived = true;
          tt.active = false;
        }
      }

      setAppState(state);
      rerender();
    });
  }

  /* Add slot */
  const slotForm = document.getElementById("slot-form");
  if (slotForm) {
    slotForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const state = getAppState(); // ✅ fresh state
      const activeTT = state.timetables.find(
        (t) => t.active && !t.archived
      );
      if (!activeTT) return;

      activeTT.slots.push({
        day: document.getElementById("slot-day").value,
        subjectId: document.getElementById("slot-subject").value,
        startTime: document.getElementById("slot-start").value,
        endTime: document.getElementById("slot-end").value
      });

      setAppState(state);
      rerender();
    });
  }
}


/* -------------------- Rerender -------------------- */

function rerender() {
  const content = document.getElementById("content");
  content.innerHTML = renderTimetable();
  attachTimetableEvents();
}
