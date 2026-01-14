import { renderDashboard } from "./screens/dashboard.js";
import { renderTasks, attachTaskEvents } from "./screens/tasks.js";
import { renderAttendance, attachAttendanceEvents } from "./screens/attendance.js";
import { renderTimetable } from "./screens/timetable.js";
import { renderSettings, attachSettingsEvents } from "./screens/settings.js";

export function renderRoute(route) {
  const content = document.getElementById("content");
  if (!content) return;

  switch (route) {
    case "dashboard":
      content.innerHTML = renderDashboard();
      break;

    case "tasks":
      content.innerHTML = renderTasks();
      attachTaskEvents();
      break;

    case "attendance":
      content.innerHTML = renderAttendance();
      attachAttendanceEvents();
      break;

    case "timetable":
      content.innerHTML = renderTimetable();
      break;

    case "settings":
      content.innerHTML = renderSettings();
      attachSettingsEvents();
      break;

    default:
      content.innerHTML = renderDashboard();
  }
}
