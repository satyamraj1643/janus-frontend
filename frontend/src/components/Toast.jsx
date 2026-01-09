import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Component
const Toast = ({ id, type, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <XCircle className="w-4 h-4 text-red-600" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-600" />,
    info: <Info className="w-4 h-4 text-blue-600" />,
  };

  const backgrounds = {
    success: 'bg-white border-green-300',
    error: 'bg-white border-red-300',
    warning: 'bg-white border-amber-300',
    info: 'bg-white border-blue-300',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border shadow-sm ${backgrounds[type]}`}
    >
      {icons[type]}
      <p className="text-sm text-gray-800 flex-1">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="p-1 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => addToast('success', message, duration),
    error: (message, duration) => addToast('error', message, duration),
    warning: (message, duration) => addToast('warning', message, duration),
    info: (message, duration) => addToast('info', message, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              id={t.id}
              type={t.type}
              message={t.message}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default Toast;
