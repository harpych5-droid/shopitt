import { useEffect, useState } from 'react';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast = ({
  id,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
  };

  return (
    <div className="toast-container animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-3 py-3 md:px-4 md:py-3 rounded-lg border
          ${bgColors[type]} shadow-lg w-full md:max-w-md text-sm md:text-base touch-target`}
      >
        <div className={`flex-shrink-0 ${iconColors[type]}`}>
          {icons[type]}
        </div>
        <p className={`flex-1 font-medium ${textColors[type]}`}>
          {message}
        </p>
        <button
          onClick={() => onClose(id)}
          className={`flex-shrink-0 ${textColors[type]} hover:opacity-70 transition-opacity touch-target`}
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: string }>;
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`fixed z-50 flex flex-col gap-2 pointer-events-none ${
      isMobile
        ? 'bottom-4 left-4 right-4 max-w-sm'
        : 'top-4 right-4 max-w-md'
    }`}>
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type as 'success' | 'error' | 'info' | 'warning'}
            onClose={onRemove}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
