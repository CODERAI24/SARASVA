export function renderLayout() {
  return `
    <div id="layout">
      
      <header id="header">
        <h1>Sarasva</h1>
      </header>

      <div id="body">
        
        <nav id="sidebar">
          <ul>
            <li><a href="#dashboard">Dashboard</a></li>
            <li><a href="#tasks">Tasks</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#timetable">Timetable</a></li>
            <li><a href="#settings">Settings</a></li>
          </ul>
        </nav>

        <main id="content">
          <p>Loading screen...</p>
        </main>

      </div>

    </div>
  `;
}
