import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline support and PWA capabilities
const updateSW = registerSW({
  onNeedRefresh() {
    // We could show a prompt here to reload the app
  },
  onOfflineReady() {
    console.log('App is ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
