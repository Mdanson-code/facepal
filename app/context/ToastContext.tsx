'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { Toast, ToastType } from '../types';

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

export default function ToastManager() {
  const { toasts, dismissToast } = useToast();
  const { darkMode } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg max-w-sm transform transition-all duration-300
            ${darkMode ? 'bg-gray-800' : 'bg-white'}
            ${toast.type === 'info' 
              ? darkMode ? 'text-blue-300' : 'text-blue-600'
              : toast.type === 'warning'
              ? darkMode ? 'text-yellow-300' : 'text-yellow-600'
              : toast.type === 'success'
              ? darkMode ? 'text-green-300' : 'text-green-600'
              : darkMode ? 'text-red-300' : 'text-red-600'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}