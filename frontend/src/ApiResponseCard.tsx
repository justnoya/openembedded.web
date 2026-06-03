import Styles from './ApiResponseCard.module.css';

interface ApiResponseCardProps {
    response: object | null;
    onDismiss?: () => void;
}

function parseDiscordError(res: any): { title: string; details: string[] } {
    if (!res) return { title: 'Unknown error', details: [] };

    if (res.status && typeof res.status === 'string' && res.status.includes('Success')) {
        return { title: res.status, details: [] };
    }

    const details: string[] = [];
    const title = res.message || res.error || `HTTP ${res.code || 'Error'}`;

    if (res.code) details.push(`Discord code: ${res.code}`);
    if (res.errors) {
        const flattenErrors = (obj: any, prefix = ''): void => {
            for (const [k, v] of Object.entries(obj)) {
                if (k === '_errors' && Array.isArray(v)) {
                    (v as any[]).forEach((e: any) => {
                        if (e.message) details.push(prefix ? `${prefix}: ${e.message}` : e.message);
                    });
                } else if (typeof v === 'object' && v !== null) {
                    flattenErrors(v, prefix ? `${prefix}.${k}` : k);
                }
            }
        };
        flattenErrors(res.errors);
    }

    return { title, details };
}

export function ApiResponseCard({ response, onDismiss }: ApiResponseCardProps) {
    if (!response) return null;

    const res = response as any;
    const isSuccess = !!res.status && typeof res.status === 'string' && res.status.includes('Success');
    const { title, details } = parseDiscordError(res);

    return (
        <div className={`${Styles.card} ${isSuccess ? Styles.success : Styles.error}`}>
            <div className={Styles.header}>
                <span className={Styles.iconWrap}>
                    {isSuccess
                        ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zM6.5 11.5L3 8l1.06-1.06L6.5 9.38l5.44-5.44L13 5l-6.5 6.5z" fill="currentColor"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm.75 10.5h-1.5v-1.5h1.5v1.5zm0-3h-1.5V4.5h1.5V8.5z" fill="currentColor"/></svg>
                    }
                </span>
                <span className={Styles.title}>{title}</span>
                {onDismiss && (
                    <button className={Styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M9 1L1 9M1 1l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>
                )}
            </div>
            {details.length > 0 && (
                <ul className={Styles.details}>
                    {details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
            )}
        </div>
    );
}
