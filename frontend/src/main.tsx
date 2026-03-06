import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure theme is scoped inside App only (not globally on html/body).
document.documentElement.classList.remove('dark');
document.body.classList.remove('dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
