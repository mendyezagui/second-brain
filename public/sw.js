/* Second Brain — push service worker.
 *
 * Served from /sw.js at the origin root so its scope covers the whole app.
 * Vite copies public/ verbatim, so this file ships as-is; it is NOT bundled
 * and must stay dependency-free plain JS.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: "Second Brain", body: event.data && event.data.text() }; }

  const title = d.title || "Second Brain";
  const options = {
    body: d.body || "",
    // Same crest the flyers use, so a SoFa nudge is recognisable on the
    // lock screen before it is read.
    icon: d.icon || "/sofa-jcc/icon-192.png",
    badge: d.badge || "/sofa-jcc/badge-72.png",
    // `tag` collapses repeats: a re-sent nudge for the same event replaces
    // the old notification instead of stacking a second one.
    tag: d.tag || "second-brain",
    renotify: !!d.renotify,
    requireInteraction: d.severity === "high",
    data: { url: d.url || "/", ...(d.data || {}) },
    actions: d.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      // Prefer focusing a tab that is already open on this origin.
      for (const w of wins) {
        if ("focus" in w) {
          if (w.url.includes(target.replace(/^\//, ""))) return w.focus();
        }
      }
      const first = wins.find((w) => "focus" in w);
      if (first) { first.navigate(target); return first.focus(); }
      return self.clients.openWindow(target);
    })
  );
});
