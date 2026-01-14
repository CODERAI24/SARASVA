import { renderRoute } from "./ui/router.js";
import { renderLayout } from "./ui/layout.js";
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

  document.getElementById("app").innerHTML = renderLayout();

  function handleRouteChange() {
  const route = window.location.hash.replace("#", "") || "dashboard";
  renderRoute(route);
  }

  window.addEventListener("hashchange", handleRouteChange);
  handleRouteChange();

  
}

initApp();
