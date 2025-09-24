// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Guard: blokuj pokazené URL pri push/replaceState (napr. ~and~, //?/)
function installUrlGuard() {
  try {
    const hist = window.history;
    const origReplace = hist.replaceState.bind(hist);
    const origPush = hist.pushState.bind(hist);

    const isBad = (u: unknown) => {
      if (typeof u !== 'string') return false;
      return u.includes('~and~') || u.includes('//?/') || /\/{2,}\?/.test(u);
    };

    // @ts-expect-error - patchujeme runtime metódy history
    hist.replaceState = function (state: any, title: string, url?: string | URL | null) {
      const str = typeof url === 'string' ? url : url?.toString();
      if (isBad(str)) return;
      return origReplace(state, title, url as any);
    };

    // @ts-expect-error - patchujeme runtime metódy history
    hist.pushState = function (state: any, title: string, url?: string | URL | null) {
      const str = typeof url === 'string' ? url : url?.toString();
      if (isBad(str)) return;
      return origPush(state, title, url as any);
    };
  } catch {
    // no-op
  }
}

// spusti guard pred mountom aplikácie
installUrlGuard();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
