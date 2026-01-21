import { renderDashboard } from "./screens/dashboard.js";
import { renderTasks, attachTaskEvents } from "./screens/tasks.js";
import { renderAttendance, attachAttendanceEvents } from "./screens/attendance.js";
import { renderTimetable, attachTimetableEvents } from "./screens/timetable.js";
import { renderSettings, attachSettingsEvents } from "./screens/settings.js";
import { renderHistory } from "./screens/history.js";
import { renderFocus, attachFocusEvents } from "./screens/focus.js";
import { renderExams, attachExamEvents } from "./screens/exams.js";
import { highlightActiveRoute } from "./layout.js";


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
      attachTimetableEvents();
      break;


    case "settings":
      content.innerHTML = renderSettings();
      attachSettingsEvents();
      break;

    case "history":
      content.innerHTML = renderHistory();
      break;

    case "focus":
      content.innerHTML = renderFocus();
      attachFocusEvents();
      break;
    case "exams":
      content.innerHTML = renderExams();
      attachExamEvents();
      break;




    default:
      content.innerHTML = renderDashboard();
  }
  
  highlightActiveRoute();

}
