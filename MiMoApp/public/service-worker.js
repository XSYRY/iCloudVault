const CACHE_NAME = 'mimo-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/js/0.chunk.js',
  '/static/js/main.chunk.js',
  '/static/css/main.css',
  '/favicon.ico',
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

const DYNAMIC_CACHE_NAME = 'mimo-dynamic-cache-v1';
const MAX_DYNAMIC_CACHE_SIZE = 50;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  if (request.method !== 'GET') {
    return;
  }

  if (request.url.startsWith('chrome-extension://') || 
      request.url.startsWith('moz-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        if (request.headers.get('Accept')?.includes('image')) {
          return new Response(null, {
            status: 404,
            statusText: 'Not Found'
          });
        }
        
        return caches.match('/offline.html');
      });

      return cachedResponse || fetchPromise;
    })
  );
});

function limitCacheSize(cacheName, maxSize) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxSize) {
        cache.delete(keys[0]).then(limitCacheSize(cacheName, maxSize));
      }
    });
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

async function syncPhotos() {
  const pendingPhotos = await getPendingPhotos();
  for (const photo of pendingPhotos) {
    try {
      await uploadPhoto(photo);
      await removePendingPhoto(photo.id);
    } catch (error) {
      console.error('Failed to sync photo:', error);
    }
  }
}

async function getPendingPhotos() {
  const cache = await caches.open('pending-photos');
  const keys = await cache.keys();
  const photos = [];
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      photos.push(await response.json());
    }
  }
  return photos;
}

async function uploadPhoto(photo) {
  const formData = new FormData();
  formData.append('image', photo.blob, photo.filename);
  await fetch('/api/photos', {
    method: 'POST',
    body: formData
  });
}

async function removePendingPhoto(id) {
  const cache = await caches.open('pending-photos');
  await cache.delete(`pending-${id}`);
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'MiMo 相册';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-48x48.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
