import Styles from './ErrorFallback.module.css';

interface ErrorFallbackProps {
    error?: Error;
    resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div className={Styles.wrapper} role="alert">
            <div className={Styles.iconWrap}>
                <svg className={Styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                </svg>
            </div>
            <h2 className={Styles.title}>Something went wrong</h2>
            <p className={Styles.body}>
                This part of the app ran into a problem. Your work is safe — this section failed to render.
            </p>
            {error?.message && (
                <code className={Styles.code}>{error.message}</code>
            )}
            {resetErrorBoundary && (
                <button className={Styles.btn} onClick={resetErrorBoundary}>
                    Try again
                </button>
            )}
        </div>
    );
}
