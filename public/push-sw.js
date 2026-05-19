self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};

  try {
    if (event.data) data = event.data.json();
  } catch {
    data = {};
  }

  const title = data.title || 'DigiWell';
  const options = {
    body: data.body || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    data: data.data || {},
    requireInteraction: false,
    tag: data.data?.type || 'digiwell-push',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const url = new URL(client.url);
        if (url.pathname === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
