export function renderRoute(route) {
  const content = document.getElementById("content");

  if (!content) return;

  switch (route) {
    case "dashboard":
      content.innerHTML = "<h2>Dashboard</h2><p>Welcome to Sarasva.</p>";
      break;

    case "tasks":
      content.innerHTML = "<h2>Tasks</h2><p>Your tasks will appear here.</p>";
      break;

    case "attendance":
      content.innerHTML = "<h2>Attendance</h2><p>Attendance tracking area.</p>";
      break;

    case "timetable":
      content.innerHTML = "<h2>Timetable</h2><p>Your class schedule.</p>";
      break;

    case "settings":
      content.innerHTML = "<h2>Settings</h2><p>App preferences.</p>";
      break;

    default:
      content.innerHTML = "<h2>Dashboard</h2><p>Welcome to Sarasva.</p>";
  }
}
