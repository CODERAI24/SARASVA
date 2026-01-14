import { getAppState } from "../../storage/appState.js";

export function renderTasks() {
  const state = getAppState();
  const tasks = state.tasks || [];

  if (tasks.length === 0) {
    return `
      <h2>Tasks</h2>
      <p>No tasks yet.</p>
    `;
  }

  const taskList = tasks
    .map(
      (task) => `
        <li>
          ${task.title} 
          ${task.completed ? "✅" : ""}
        </li>
      `
    )
    .join("");

  return `
    <h2>Tasks</h2>
    <ul>
      ${taskList}
    </ul>
  `;
}
