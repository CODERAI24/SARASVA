import { getAppState, setAppState } from "./storage/appState.js";
import { migrateData } from "./storage/migrationManager.js";
import { AppMeta } from "./models/appMeta.js";

function initApp() {
  let state = getAppState();

  // First-time launch
  if (!state.meta) {
    state.meta = {
      ...AppMeta,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
  }

  // Run migrations safely
  state = migrateData(state);

  state.meta.lastUpdatedAt = Date.now();
  setAppState(state);

  document.getElementById("app").innerHTML = `
    <h1>Sarasva</h1>
    <p>App initialized successfully.</p>
  `;
}

initApp();
