import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Register the service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
function registerSW({
  onNeedRefresh,
  onOfflineReady,
}: { onNeedRefresh(): void; onOfflineReady(): void }) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        // Listen for updates to the service worker.
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  onNeedRefresh();
                } else {
                  // Ready to work offline
                  onOfflineReady();
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  }

  // Return a function to force update (reload)
  return function updateSW(reload: boolean) {
    if (reload) {
      window.location.reload();
    }
  };
}

