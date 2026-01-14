import { getAppState, setAppState } from "./storage/appState.js";
import { migrateData } from "./storage/migrationManager.js";
import { AppMeta } from "./models/appMeta.js";

import { renderLayout } from "./ui/layout.js";
import { renderRoute } from "./ui/router.js";

function initState() {
  let state = getAppState();

  // First-time launch
  if (!state.meta) {
    state.meta = {
      ...AppMeta,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
  }

  state = migrateData(state);
  state.meta.lastUpdatedAt = Date.now();
  setAppState(state);
}

function initUI() {
  const app = document.getElementById("app");
  app.innerHTML = renderLayout();
}

function handleRouteChange() {
  const route = window.location.hash.replace("#", "") || "dashboard";
  renderRoute(route);
}

function initRouter() {
  window.addEventListener("hashchange", handleRouteChange);
  handleRouteChange(); // initial load
}

function initApp() {
  initState();
  initUI();
  initRouter();
}

initApp();
