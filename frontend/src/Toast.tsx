import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Styles from './Toast.module.css';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    title?: string;
    message: string;
    duration: number;
    leaving?: boolean;
}

interface ToastAPI {
    error:   (message: string, title?: string) => void;
    success: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info:    (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastAPI>({
    error:   () => {},
    success: () => {},
    warning: () => {},
    info:    () => {},
});

export function useToast() {
    return useContext(ToastContext);
}

let counter = 0;

const ICONS: Record<ToastType, string> = {
    error:   '✕',
    success: '✓',
    warning: '⚠',
    info:    'ℹ',
};

const LABELS: Record<ToastType, string> = {
    error:   'Error',
    success: 'Success',
    warning: 'Warning',
    info:    'Info',
};

function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
    const [progress, setProgress] = useState(100);
    const startRef  = useRef<number>(Date.now());
    const frameRef  = useRef<number>(0);

    useEffect(() => {
        const tick = () => {
            const elapsed = Date.now() - startRef.current;
            const pct = Math.max(0, 100 - (elapsed / toast.duration) * 100);
            setProgress(pct);
            if (pct > 0) frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [toast.duration]);

    return (
        <div className={`${Styles.toast} ${Styles[toast.type]} ${toast.leaving ? Styles.leaving : ''}`}>
            <div className={Styles.iconWrap}>
                <span className={Styles.icon}>{ICONS[toast.type]}</span>
            </div>
            <div className={Styles.body}>
                <div className={Styles.toastTitle}>{toast.title || LABELS[toast.type]}</div>
                <div className={Styles.toastMessage}>{toast.message}</div>
            </div>
            <button className={Styles.closeBtn} onClick={() => onRemove(toast.id)} aria-label="Dismiss">
                ✕
            </button>
            <div className={Styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const remove = useCallback((id: number) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320);
    }, []);

    const add = useCallback((type: ToastType, message: string, title?: string, duration = 4500) => {
        const id = ++counter;
        setToasts(prev => [...prev, { id, type, message, title, duration }]);
        setTimeout(() => remove(id), duration);
    }, [remove]);

    const api: ToastAPI = {
        error:   (msg, title) => add('error',   msg, title, 6000),
        success: (msg, title) => add('success', msg, title, 4000),
        warning: (msg, title) => add('warning', msg, title, 5000),
        info:    (msg, title) => add('info',    msg, title, 4000),
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className={Styles.container} aria-live="assertive" aria-atomic="true">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onRemove={remove} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
