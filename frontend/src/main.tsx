import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Force theme to light and save in localStorage
document.documentElement.classList.remove('dark');
document.body.classList.remove('dark');
localStorage.setItem('theme', 'light');

// Ensure theme is scoped inside App only (not globally on html/body).
// (comment explains why above code exists)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);