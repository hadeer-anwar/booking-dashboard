'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  variant: ToastVariant;
  title?: string;
  message: string;
}

interface ToastContextValue {
  showToast: (opts: { variant?: ToastVariant; title?: string; message: string }) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ variant = 'info', title, message }: { variant?: ToastVariant; title?: string; message: string }) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, variant, title, message }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess: (message, title) => showToast({ variant: 'success', title, message }),
      showError: (message, title) => showToast({ variant: 'error', title, message }),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center space-y-2 pointer-events-none">
        {toasts.map((toast) => {
          const icon =
            toast.variant === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : toast.variant === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Info className="h-4 w-4 text-blue-500" />
            );

          const bgClass =
            toast.variant === 'success'
              ? 'bg-emerald-50 border-emerald-200'
              : toast.variant === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-sky-50 border-sky-200';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-md ${bgClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 text-sm text-gray-800">
                {toast.title && <div className="font-semibold mb-0.5">{toast.title}</div>}
                <div>{toast.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="-m-1 mt-0 shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

