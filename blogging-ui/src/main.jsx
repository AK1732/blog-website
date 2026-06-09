import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '../tailwind.css';
import AppRouter from './router.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </StrictMode>,
);
