// Guard: blokuj pokazené URL pri push/replaceState (napr. ~and~, //?/)
(function () {
  const origReplace = history.replaceState.bind(history);
  const origPush = history.pushState.bind(history);
  const bad = (u: string) => u.includes('~and~') || u.includes('//?/') || /\/{2,}\?/.test(u);

  // @ts-ignore
  history.replaceState = function(state, title, url) {
    if (typeof url === 'string' && bad(url)) return;
    // @ts-ignore
    return origReplace(state, title, url);
  };
  // @ts-ignore
  history.pushState = function(state, title, url) {
    if (typeof url === 'string' && bad(url)) return;
    // @ts-ignore
    return origPush(state, title, url);
  };
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


