'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { Toast, ToastType } from '../types';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const toast: Toast = {
      id: Date.now().toString(),
      message,
      type,
      duration: type === 'error' ? 5000 : 3000,
    };
    setToasts(prev => [...prev, toast]);

    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, toast.duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}
      <ToastManager />
    </ToastContext.Provider>
  );
}

function Toast({ message, type, onClose }: ToastProps) {
  const { darkMode } = useTheme();
  
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm backdrop-saturate-150
      transition-all duration-300 ease-out
      ${darkMode 
        ? 'bg-gray-900/90 text-gray-100 border border-gray-800/50' 
        : 'bg-white/90 text-gray-900 border border-gray-200/50'}`}>
      <div className="flex items-center space-x-2">
        {type === 'warning' && (
          <span role="img" aria-label="warning" className="text-yellow-500">⚠️</span>
        )}
        {type === 'error' && (
          <span role="img" aria-label="error" className="text-red-500">❌</span>
        )}
        {type === 'info' && (
          <span role="img" aria-label="info" className="text-blue-500">ℹ️</span>
        )}
        {type === 'success' && (
          <span role="img" aria-label="success" className="text-green-500">✅</span>
        )}
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

export default function ToastManager(): JSX.Element {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="transform transition-all duration-300">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => dismissToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}