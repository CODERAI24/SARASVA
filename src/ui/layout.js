export function renderLayout() {
  return `
    <div id="layout">
      
      <header id="header">
        <h1>Sarasva</h1>
      </header>

      <div id="body">
        
        <nav class="sidebar">
          <a href="#attendance">Attendance</a>
          <a href="#history">History</a>
          <a href="#timetable">Timetable</a>
          <a href="#focus">Focus</a>
          <a href="#exams">Exams</a>
          <a href="#settings">Settings</a>
        </nav>


        <main id="content">
          <p>Loading screen...</p>
        </main>

      </div>

    </div>
  `;
}
