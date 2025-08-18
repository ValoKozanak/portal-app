import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalled: boolean;
  isUpdated: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalled: false,
    isUpdated: false,
    registration: null
  });

  const registerServiceWorker = useCallback(async () => {
    if (!state.isSupported) {
      console.log('Service Worker is not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration
      }));

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({
                ...prev,
                isUpdated: true
              }));
            }
          });
        }
      });

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setState(prev => ({
          ...prev,
          isInstalled: true
        }));
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, [state.isSupported]);

  const updateServiceWorker = useCallback(async () => {
    if (state.registration) {
      try {
        await state.registration.update();
        console.log('Service Worker update requested');
      } catch (error) {
        console.error('Service Worker update failed:', error);
      }
    }
  }, [state.registration]);

  const skipWaiting = useCallback(async () => {
    if (state.registration && state.registration.waiting) {
      try {
        state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('Skip waiting message sent');
      } catch (error) {
        console.error('Skip waiting failed:', error);
      }
    }
  }, [state.registration]);

  const unregisterServiceWorker = useCallback(async () => {
    if (state.registration) {
      try {
        await state.registration.unregister();
        setState(prev => ({
          ...prev,
          isRegistered: false,
          registration: null
        }));
        console.log('Service Worker unregistered');
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
      }
    }
  }, [state.registration]);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  // Listen for skip waiting message
  useEffect(() => {
    if (state.registration) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [state.registration]);

  return {
    ...state,
    registerServiceWorker,
    updateServiceWorker,
    skipWaiting,
    unregisterServiceWorker
  };
};
