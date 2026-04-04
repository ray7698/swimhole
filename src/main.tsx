import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import type {SwimHole} from './types/swim-hole';

const rootElement = document.getElementById('root');
const initialCatalogElement = document.getElementById('initial-catalog');

if (!rootElement) {
  throw new Error('Root element not found.');
}

const initialHoles: SwimHole[] = initialCatalogElement?.textContent
  ? (JSON.parse(initialCatalogElement.textContent) as SwimHole[])
  : [];

const app = (
  <StrictMode>
    <App initialHoles={initialHoles} />
  </StrictMode>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
