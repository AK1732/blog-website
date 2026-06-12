import { useMemo, useState } from 'react';

import ToastContext from './toastContext';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const value = useMemo(
    () => ({
      showToast(message, type = 'success') {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, message, type }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-80 max-w-[calc(100vw-2rem)] rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              toast.type === 'error'
                ? 'border-rose-200 bg-rose-50/95 text-rose-800'
                : 'border-blue-200 bg-white/95 text-slate-900'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

