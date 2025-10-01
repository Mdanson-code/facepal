'use client';

import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface ToastManagerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const TOAST_DURATION = 5000; // Duration in milliseconds

export default function ToastManager({ toasts, onDismiss }: ToastManagerProps) {
  const { darkMode } = useTheme();

  useEffect(() => {
    // Auto-dismiss toasts after duration
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, TOAST_DURATION);

      return () => clearTimeout(timer);
    });
  }, [toasts, onDismiss]);

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
              : darkMode ? 'text-red-300' : 'text-red-600'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
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