/**
 * Service Worker Registration and Update Controller
 */

export interface SwConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

export function register(config?: SwConfig) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Register on window load
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        // Check if there is already a waiting worker
        if (registration.waiting) {
          config?.onUpdate?.(registration);
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available and waiting
                console.log('[SW Registration] New content is available and will be used when updated.');
                config?.onUpdate?.(registration);
              } else {
                // Content cached for offline use
                console.log('[SW Registration] Content is cached for offline use.');
                config?.onSuccess?.(registration);
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[SW Registration] Service worker registration failed:', error);
      });
  });
}

export function unregister() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

/**
 * Sends SKIP_WAITING to waiting worker and reloads page once controller changes
 */
export function applyUpdate(registration: ServiceWorkerRegistration) {
  if (!registration.waiting) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  let refreshing = false;
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    });
  }

  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}
