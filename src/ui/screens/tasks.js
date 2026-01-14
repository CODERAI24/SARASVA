import { getAppState, setAppState } from "../../storage/appState.js";

export function renderTasks() {
  const state = getAppState();
  const tasks = state.tasks || [];

  const taskList = tasks
    .map(
      (task) => `
        <li 
          data-id="${task.id}" 
          style="cursor:pointer; ${task.completed ? "text-decoration: line-through;" : ""}"
        >
          ${task.completed ? "✅" : "⬜"} ${task.title}
        </li>
      `
    )
    .join("");

  return `
    <h2>Tasks</h2>

    <form id="task-form">
      <input 
        type="text" 
        id="task-input" 
        placeholder="Enter a task"
        required
      />
      <button type="submit">Add</button>
    </form>

    ${
      tasks.length === 0
        ? "<p>No tasks yet.</p>"
        : `<ul id="task-list">${taskList}</ul>`
    }
  `;
}

/**
 * Attach events after rendering
 */
export function attachTaskEvents() {
  // Add task
  const form = document.getElementById("task-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const input = document.getElementById("task-input");
      const title = input.value.trim();
      if (!title) return;

      const state = getAppState();

      state.tasks.push({
        id: Date.now().toString(),
        title,
        completed: false,
        createdAt: Date.now(),
        archived: false
      });

      setAppState(state);
      input.value = "";

      rerender();
    });
  }

  // Toggle complete
  const list = document.getElementById("task-list");
  if (list) {
    list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;

      const taskId = li.dataset.id;
      const state = getAppState();

      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;

      task.completed = !task.completed;
      setAppState(state);

      rerender();
    });
  }
}

function rerender() {
  const content = document.getElementById("content");
  content.innerHTML = renderTasks();
  attachTaskEvents();
}
