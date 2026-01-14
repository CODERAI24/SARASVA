import { getAppState, setAppState } from "../../storage/appState.js";

export function renderSettings() {
  const state = getAppState();
  const subjects = state.subjects || [];

  const activeSubjects = subjects.filter((s) => !s.archived);

  const subjectList = activeSubjects
    .map(
      (s) => `
        <li data-id="${s.id}">
          ${s.name}
          <button data-action="archive">🗑️</button>
        </li>
      `
    )
    .join("");

  return `
    <h2>Settings</h2>

    <h3>Subjects</h3>

    <form id="subject-form">
      <input
        type="text"
        id="subject-input"
        placeholder="Enter subject name"
        required
      />
      <button type="submit">Add Subject</button>
    </form>

    ${
      activeSubjects.length === 0
        ? "<p>No subjects added.</p>"
        : `<ul id="subject-list">${subjectList}</ul>`
    }
  `;
}

export function attachSettingsEvents() {
  const form = document.getElementById("subject-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const input = document.getElementById("subject-input");
      const name = input.value.trim();
      if (!name) return;

      const state = getAppState();

      state.subjects.push({
        id: Date.now().toString(),
        name,
        archived: false,
        createdAt: Date.now()
      });

      setAppState(state);
      input.value = "";

      rerender();
    });
  }

  const list = document.getElementById("subject-list");
  if (list) {
    list.addEventListener("click", (e) => {
      if (e.target.dataset.action !== "archive") return;

      const li = e.target.closest("li");
      if (!li) return;

      const subjectId = li.dataset.id;
      const state = getAppState();

      const subject = state.subjects.find((s) => s.id === subjectId);
      if (!subject) return;

      subject.archived = true;
      setAppState(state);

      rerender();
    });
  }
}

function rerender() {
  const content = document.getElementById("content");
  content.innerHTML = renderSettings();
  attachSettingsEvents();
}
