import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  push: (title: string, variant?: ToastVariant) => void;
  success: (title: string) => void;
  error: (title: string) => void;
  info: (title: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  push: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (title: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, variant }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title: string) => push(title, 'success'),
      error: (title: string) => push(title, 'error'),
      info: (title: string) => push(title, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const styles: Record<ToastVariant, string> = {
              success: 'border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300',
              error: 'border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300',
              info: 'border-cyan-200 dark:border-cyan-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
            };
            const Icon = t.variant === 'success' ? CheckCircle2 : t.variant === 'error' ? AlertCircle : Info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${styles[t.variant]}`}
              >
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium flex-1 leading-relaxed">{t.title}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
