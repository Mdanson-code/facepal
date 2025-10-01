'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface ToastProps {
  message: string;
  type: 'info' | 'warning' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const { darkMode } = useTheme();
  
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 
      px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm backdrop-saturate-150
      transition-all duration-300 ease-out animate-slide-up
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
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

interface ToastManagerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastManager({ toasts, onDismiss }: ToastManagerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col items-center space-y-2 p-4">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => onDismiss(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}