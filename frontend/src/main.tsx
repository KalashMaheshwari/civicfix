import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';
import { BASE_URL } from './services/api';

// Diagnostics Console Telemetry
console.groupCollapsed('%c[CivicFix System Diagnostics]', 'color: #0284c7; font-weight: bold; font-size: 12px;');
console.info('%c[Environment]:', 'font-weight: bold;', import.meta.env.MODE);
console.info('%c[Backend API Endpoint]:', 'font-weight: bold;', BASE_URL || '(Local Proxy: /api)');
console.info('%c[Auth Token]:', 'font-weight: bold;', localStorage.getItem('civicfix_token') ? 'PRESENT' : 'NONE');

// Test live health probe to backend & DB
const healthUrl = `${BASE_URL}/health`;
fetch(healthUrl)
  .then((res) => res.json())
  .then((data) => {
    console.info('%c[Backend Health & DB Probe]:', 'color: #10b981; font-weight: bold;', data);
  })
  .catch((err) => {
    console.warn('%c[Backend Connection Notice]:', 'color: #ef4444; font-weight: bold;', err.message || err);
  });
console.groupEnd();

// Unregister any stale service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
