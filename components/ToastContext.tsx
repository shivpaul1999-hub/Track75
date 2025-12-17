import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Icon from './Icon';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextProps {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col space-y-3 items-end pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        onClick={() => removeToast(toast.id)}
                        className={`pointer-events-auto min-w-[300px] max-w-sm bg-white shadow-xl rounded-lg border-l-4 overflow-hidden transform transition-all duration-300 animate-fade-in-up cursor-pointer
              ${toast.type === 'error' ? 'border-red-500' : ''}
              ${toast.type === 'success' ? 'border-green-500 bg-green-50' : ''}
              ${toast.type === 'info' ? 'border-blue-500' : ''}
            `}
                    >
                        <div className="p-3 flex items-center">
                            <div className="flex-shrink-0">
                                {toast.type === 'success' && <Icon name="check" className="h-5 w-5 text-green-500" />}
                                {toast.type === 'error' && <Icon name="alert-circle" className="h-5 w-5 text-red-500" />}
                                {toast.type === 'info' && <Icon name="info" className="h-5 w-5 text-blue-500" />}
                            </div>
                            <div className="ml-3 w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">{toast.message}</p>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                                <button className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                                    <Icon name="close" className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
