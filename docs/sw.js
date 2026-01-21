const CACHE_NAME = "sarasva-cache-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",

  "../src/main.js",
  "../src/ui/router.js",
  "../src/ui/layout.js",

  "../src/ui/screens/attendance.js",
  "../src/ui/screens/history.js",
  "../src/ui/screens/focus.js",
  "../src/ui/screens/exams.js",
  "../src/ui/screens/timetable.js",
  "../src/ui/screens/settings.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
