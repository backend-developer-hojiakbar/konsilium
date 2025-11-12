import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

// Service Worker handling
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In development, unregister any existing SW to avoid stale caches and cross-port issues
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
  } else {
    // Register SW only in production
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('KONSILIUM ServiceWorker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.log('KONSILIUM ServiceWorker registration failed:', error);
        });
    });
  }
}