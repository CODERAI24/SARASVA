import { getAppState, setAppState } from "../../storage/appState.js";

export function renderTasks() {
  const state = getAppState();
  const tasks = state.tasks || [];

  const taskList = tasks
    .map(
      (task) => `
        <li>
          ${task.title} ${task.completed ? "✅" : ""}
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
        : `<ul>${taskList}</ul>`
    }
  `;
}

/**
 * Attach events after rendering
 */
export function attachTaskEvents() {
  const form = document.getElementById("task-form");
  if (!form) return;

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

    // re-render screen
    document.getElementById("content").innerHTML = renderTasks();
    attachTaskEvents();
  });
}
