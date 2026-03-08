import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext.jsx";
import App from "./App.jsx";
import "./index.css";

// Auto-update: check for a new service worker every 60 seconds.
// When a new SW takes control, reload so users get the latest version.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    setInterval(() => reg.update(), 60 * 1000);
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
