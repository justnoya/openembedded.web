import Styles from './InlineAlert.module.css';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

interface InlineAlertProps {
    type: AlertType;
    title?: string;
    message: string;
    onDismiss?: () => void;
    className?: string;
}

const ICONS: Record<AlertType, JSX.Element> = {
    error: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm.75 10.5h-1.5v-1.5h1.5v1.5zm0-3h-1.5V4.5h1.5V8.5z" fill="currentColor"/>
        </svg>
    ),
    success: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zM6.5 11.5L3 8l1.06-1.06L6.5 9.38l5.44-5.44L13 5l-6.5 6.5z" fill="currentColor"/>
        </svg>
    ),
    warning: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.865 1.52c-.18-.31-.51-.5-.87-.5s-.69.19-.87.5L.275 13.5c-.18.31-.18.69 0 1 .18.31.51.5.87.5h13.7c.36 0 .69-.19.87-.5.18-.31.18-.69 0-1L8.865 1.52zM8.5 12.5h-1v-1h1v1zm0-2.5h-1V6h1v4z" fill="currentColor"/>
        </svg>
    ),
    info: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z" fill="currentColor"/>
        </svg>
    ),
};

export function InlineAlert({ type, title, message, onDismiss, className }: InlineAlertProps) {
    return (
        <div className={`${Styles.alert} ${Styles[type]} ${className || ''}`} role="alert">
            <span className={Styles.alertIcon}>{ICONS[type]}</span>
            <div className={Styles.alertBody}>
                {title && <span className={Styles.alertTitle}>{title}</span>}
                <span className={Styles.alertMessage}>{message}</span>
            </div>
            {onDismiss && (
                <button className={Styles.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M11 1L1 11M1 1l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>
            )}
        </div>
    );
}
