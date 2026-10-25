import { useEffect, useState } from 'react';

type ToastType = 'info' | 'error' | 'success';
type Toast = { id: string; message: string; type: ToastType };

let listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: ToastType = 'info') {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, type }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3000);
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setCurrentToasts(t);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="q-toast-container">
      {currentToasts.map((t) => (
        <div key={t.id} className={`q-toast q-toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}