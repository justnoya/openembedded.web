import { useState, useEffect } from 'react';
import Styles from './SignIn.module.css';

type View = 'idle' | 'connecting' | 'discord-error';

const DISCORD_ERRORS: Record<string, string> = {
    discord_denied: 'Discord sign-in was cancelled. Please try again.',
    discord_token:  'Discord sign-in failed. Please try again.',
    discord_user:   'Could not load your Discord profile. Please try again.',
    discord_error:  'An unexpected error occurred with Discord. Please try again.',
    state_mismatch: 'Sign-in failed for security reasons. Please try again.',
};

const discordSvg = (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
);

export function SignIn() {
    const [view, setView]               = useState<View>('idle');
    const [discordError, setDiscordError] = useState('');

    function startDiscordLogin() {
        setView('connecting');
        setTimeout(() => { window.location.href = '/api/auth/discord'; }, 600);
    }

    // On mount: only check for OAuth error params coming back from Discord
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errCode = params.get('error');
        if (errCode) {
            window.history.replaceState({}, '', window.location.pathname);
            const msg = DISCORD_ERRORS[errCode] ?? `Sign-in error (${errCode}). Please try again.`;
            setDiscordError(msg);
            setView('discord-error');
        }
    }, []);

    const background = (
        <>
            <svg className={Styles.natureBg} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c5e4f0" />
                        <stop offset="60%" stopColor="#a8d4e8" />
                        <stop offset="100%" stopColor="#90c8e0" />
                    </linearGradient>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ab8c8" />
                        <stop offset="100%" stopColor="#38a8b8" />
                    </linearGradient>
                </defs>
                <rect width="1440" height="900" fill="url(#skyGrad)" />
                <path d="M440,480 Q520,310 640,370 Q720,400 820,280 Q910,180 1010,300 Q1080,370 1160,240 Q1240,130 1340,260 Q1400,320 1440,290 L1440,620 L440,620Z" fill="#8ab8cc" opacity="0.7" />
                <path d="M940,500 Q1020,310 1110,340 Q1180,280 1250,350 Q1320,300 1380,400 Q1420,450 1440,430 L1440,680 L940,680Z" fill="#c8a8c0" />
                <rect x="440" y="700" width="1000" height="80" fill="#b898a8" />
                <rect x="440" y="680" width="1000" height="24" fill="#c8a8b8" />
                {[600, 740, 880, 1020, 1160, 1300].map(x => (
                    <rect key={x} x={x} y={660} width={18} height={60} fill="#a88898" />
                ))}
                <path d="M440,560 Q580,410 700,470 Q800,510 900,400 Q980,330 1100,460 Q1200,520 1320,450 Q1380,420 1440,460 L1440,720 L440,720Z" fill="#5aa090" />
                <path d="M440,630 Q470,570 500,600 Q520,580 545,610 Q565,590 590,620 Q615,598 640,628 Q660,605 685,632 Q710,610 735,638 Q755,615 780,642 Q800,620 820,648 L820,760 L440,760Z" fill="#2d6858" />
                <path d="M440,700 Q480,670 520,690 Q560,665 600,688 Q640,668 680,690 Q720,672 760,692 Q800,675 830,695 L830,780 L440,780Z" fill="#3a7868" />
                <path d="M440,740 Q700,710 1000,725 Q1200,732 1440,715 L1440,900 L440,900Z" fill="url(#waterGrad)" />
                <ellipse cx="870" cy="742" rx="12" ry="6" fill="#e8a0b0" />
                <rect x="867" y="732" width="6" height="14" rx="3" fill="#f0b8c0" />
                <ellipse cx="910" cy="748" rx="9" ry="5" fill="#e8b0c0" />
                <rect x="907" y="739" width="5" height="12" rx="2" fill="#f0c0c8" />
            </svg>
            <svg className={Styles.darkBlob} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 L840,0 C800,80 860,160 780,240 C720,300 800,380 740,460 C680,540 760,620 700,720 C660,790 720,860 640,900 L0,900 Z" fill="#1e1f2e" />
            </svg>
            <div className={Styles.stars} />
            <div className={Styles.logo}>
                <div className={Styles.logoWrap}>
                    <img src="/logo.png" className={Styles.logoImg} alt="OpenEmbedded" draggable={false} />
                </div>
            </div>
        </>
    );

    const styles = `
        @keyframes oe-dc-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(88,101,242,0.5); }
            50%       { box-shadow: 0 0 0 18px rgba(88,101,242,0); }
        }
        @keyframes oe-dc-spin { to { transform: rotate(360deg); } }
        @keyframes oe-dc-in {
            from { opacity: 0; transform: translateY(10px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
    `;

    // ── View: discord-error ───────────────────────────────────────────────────
    if (view === 'discord-error') {
        return (
            <div className={Styles.page}>
                {background}
                <style>{styles}</style>
                <div className={Styles.card} style={{ animation: 'oe-dc-in 0.3s ease-out' }}>
                    <div className={Styles.cardLogoWrap}>
                        <img src="/logo.png" className={Styles.cardLogo} alt="OpenEmbedded" draggable={false} />
                    </div>
                    <div className={Styles.inboxIcon}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', background: 'rgba(237,66,69,0.15)', borderRadius: '50%', fontSize: '1.5rem' }}>⚠️</span>
                    </div>
                    <h2 className={Styles.inboxTitle}>Discord sign-in failed</h2>
                    <p className={Styles.inboxSubtitle}>{discordError}</p>
                    <button className={Styles.discordBtn} onClick={startDiscordLogin}>
                        <span style={{ width: '1.1rem', height: '1.1rem', display: 'inline-flex' }}>{discordSvg}</span>
                        Try again with Discord
                    </button>
                    <p className={Styles.legal}>
                        By signing in you agree to our{' '}
                        <a href="/terms">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        );
    }

    // ── View: connecting (after button click) ─────────────────────────────────
    if (view === 'connecting') {
        return (
            <div className={Styles.page}>
                {background}
                <style>{styles}</style>
                <div className={Styles.card} style={{ animation: 'oe-dc-in 0.25s ease-out' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 0 1rem' }}>
                        <div style={{
                            width: '5rem', height: '5rem',
                            background: '#5865F2',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'oe-dc-pulse 1.8s ease-in-out infinite',
                            color: 'white',
                        }}>
                            <span style={{ width: '2.4rem', height: '2.4rem' }}>{discordSvg}</span>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 700, fontFamily: 'inherit' }}>
                                Signing you in with Discord
                            </h2>
                            <p style={{ color: '#b9bbbe', margin: 0, fontSize: '0.875rem' }}>
                                Taking you to Discord to authorize your account…
                            </p>
                        </div>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 1.2rem',
                            background: 'rgba(88,101,242,0.12)',
                            border: '1px solid rgba(88,101,242,0.25)',
                            borderRadius: '2rem',
                            fontSize: '0.8rem',
                            color: '#9ea3f2',
                        }}>
                            <div style={{
                                width: '0.65rem', height: '0.65rem',
                                border: '2px solid rgba(88,101,242,0.3)',
                                borderTop: '2px solid #5865F2',
                                borderRadius: '50%',
                                animation: 'oe-dc-spin 0.8s linear infinite',
                                flexShrink: 0,
                            }} />
                            Redirecting to discord.com
                        </div>

                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#4f545c', textAlign: 'center', lineHeight: 1.5 }}>
                            By signing in you agree to our{' '}
                            <a href="/terms" style={{ color: '#00aff4', textDecoration: 'none' }}>Terms of Service</a>
                            {' '}and{' '}
                            <a href="/privacy" style={{ color: '#00aff4', textDecoration: 'none' }}>Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── View: idle (default — show sign-in button) ────────────────────────────
    return (
        <div className={Styles.page}>
            {background}
            <style>{styles}</style>
            <div className={Styles.card} style={{ animation: 'oe-dc-in 0.35s ease-out' }}>
                <div className={Styles.cardLogoWrap}>
                    <img src="/logo.png" className={Styles.cardLogo} alt="OpenEmbedded" draggable={false} />
                </div>

                <h2 className={Styles.inboxTitle} style={{ marginBottom: '0.4rem' }}>Welcome back</h2>
                <p className={Styles.inboxSubtitle} style={{ marginBottom: '2rem' }}>
                    Sign in with your Discord account to continue.
                </p>

                <button className={Styles.discordBtn} onClick={startDiscordLogin}>
                    <span style={{ width: '1.1rem', height: '1.1rem', display: 'inline-flex' }}>{discordSvg}</span>
                    Sign in with Discord
                </button>

                <p className={Styles.legal}>
                    By signing in you agree to our{' '}
                    <a href="/terms">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}
