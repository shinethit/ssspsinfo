// Service Worker for Shan State Private School Association PWA
const CACHE_NAME = 'shan-school-app-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Allow network requests to proceed
});
