import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { applyEnvironmentVisuals } from './utils/env';

// Aplica personalização visual de ambiente (DEV: roxo/favicon vermelho, PROD: midnight blue)
applyEnvironmentVisuals();

// Registra o Service Worker para suporte offline e critérios completos de PWA (WebAPK)
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
