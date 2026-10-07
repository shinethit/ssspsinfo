// Service Worker Registration for Shan State Private School Association PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Registration successful
      })
      .catch((error) => {
        // Registration ignored or failed in non-HTTPS preview
      });
  });
}
