/*
  Service Worker — permite "instalar" la app (icono en el celular, pantalla
  completa) y que siempre cargue la versión más reciente cuando hay internet,
  mostrando la última versión guardada si el promotor se queda sin conexión.
*/
const CACHE_NAME = 'cumplimiento-ff-v3'; // sube este número cada vez que cambies el HTML, para forzar la actualización
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './benchmark.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Network-first: intenta traer la versión más reciente de internet;
   si no hay conexión, usa la última copia guardada. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // deja pasar las llamadas al backend (Apps Script) sin tocar
  if (event.request.url.includes('script.google')) return; // nunca cachear las peticiones a Google Sheets

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
