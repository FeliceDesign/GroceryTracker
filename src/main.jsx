import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/storage.js'; // installiert window.storage (localStorage-Shim)
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
