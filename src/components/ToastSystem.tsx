import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'warn' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving?: boolean;
}

interface ToastCtx {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastCtx>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

const icons: Record<ToastType, string> = {
  success: '◈',
  error: '◉',
  warn: '◆',
  info: '◇',
};

const labels: Record<ToastType, string> = {
  success: 'OK',
  error: 'ERR',
  warn: 'WARN',
  info: 'INFO',
};

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 400);
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    const timer = setTimeout(() => removeToast(id), duration);
    timers.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: '280px',
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            style={{
              animation: t.leaving
                ? 'toastOut 0.4s cubic-bezier(0.4,0,1,1) forwards'
                : 'toastIn 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
            onClick={() => removeToast(t.id)}
          >
            <span style={{ marginRight: '0.5rem', opacity: 0.7 }}>{labels[t.type]}</span>
            <span style={{ marginRight: '0.5rem' }}>{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
