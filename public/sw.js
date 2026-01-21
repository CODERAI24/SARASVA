const CACHE_NAME = "sarasva-v1";

const FILES_TO_CACHE = [
  "./index.html",
  "./style.css",
  "./manifest.json",

  // core JS
  "../src/main.js",
  "../src/ui/router.js",
  "../src/ui/layout.js",

  // screens
  "../src/ui/screens/attendance.js",
  "../src/ui/screens/history.js",
  "../src/ui/screens/focus.js",
  "../src/ui/screens/exams.js",
  "../src/ui/screens/timetable.js",
  "../src/ui/screens/settings.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
