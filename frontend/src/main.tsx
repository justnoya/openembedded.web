import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import 'emoji-mart/css/emoji-mart.css'
import 'components-sdk/components-sdk.css'
import './index.css'
import './slider.css'
import './i18n'
import App from './App'
import {store} from './state'
import {Provider} from 'react-redux'
import { ButtonActionsProvider } from './ButtonActionsContext';
import { ResponseBuilderProvider } from './ResponseBuilderContext';
import { useAuth } from './hooks/useAuth';
import { useDiscordPresence } from './hooks/useDiscordPresence';
import { SignIn } from './SignIn';
import { ToastProvider } from './Toast';
import { TermsPage } from './TermsPage';
import { PrivacyPage } from './PrivacyPage';

// ── Shared keyframes ──────────────────────────────────────────────────────────
const SHARED_STYLES = `
    @keyframes oe-spin           { to { transform: rotate(360deg); } }
    @keyframes oe-connected-pop  {
        0%   { transform: scale(0.4); opacity: 0; }
        70%  { transform: scale(1.08); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
    }
    @keyframes oe-connected-fade {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes oe-invite-in {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
    }
`;

// ── Loading spinner ───────────────────────────────────────────────────────────
function LoadingSpinner() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1E1F22',
            gap: '1.5rem',
            animation: 'oe-fade-in 0.3s ease-out both',
        }}>
            <style>{SHARED_STYLES + `
                @keyframes oe-fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes oe-logo-pulse {
                    0%, 100% { opacity: 0.9; transform: scale(1); }
                    50%       { opacity: 1;   transform: scale(1.04); }
                }
            `}</style>
            <div style={{ position: 'relative', width: '5.6rem', height: '5.6rem' }}>
                {/* Outer track */}
                <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    border: '3px solid rgba(88,101,242,0.15)',
                }} />
                {/* Spinning arc */}
                <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    border: '3px solid transparent',
                    borderTopColor: '#5865F2',
                    borderRightColor: 'rgba(88,101,242,0.4)',
                    animation: 'oe-spin 0.85s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }} />
                {/* Center logo */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'oe-logo-pulse 2s ease-in-out infinite',
                }}>
                    <img src="/logo.png" style={{ width: '2.4rem', height: '2.4rem', objectFit: 'contain' }} alt="" />
                </div>
            </div>
            <div style={{
                fontSize: '1.3rem', color: 'rgba(255,255,255,0.3)',
                fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em',
                animation: 'oe-fade-in 0.3s 0.15s ease-out both',
            }}>
                Loading…
            </div>
        </div>
    );
}

// ── Bot invite screen ─────────────────────────────────────────────────────────
function BotInviteScreen({ onSkip }: { onSkip: () => void }) {
    const [adding, setAdding] = useState(false);

    function handleAddToServer() {
        setAdding(true);
        window.location.href = '/api/auth/discord/invite';
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg,#1a1b2e 0%,#202226 60%,#1a1f2e 100%)',
            padding: '1.5rem',
            gap: '2rem',
        }}>
            <style>{SHARED_STYLES + `
                @keyframes oe-dc-spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* Icon row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', animation: 'oe-invite-in 0.4s ease-out' }}>
                {/* OpenEmbedded logo placeholder */}
                <div style={{
                    width: '4rem', height: '4rem',
                    background: '#2d2f3e',
                    borderRadius: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                }}>
                    <img src="/logo.png" style={{ width: '2.6rem', height: '2.6rem', objectFit: 'contain' }} alt="" />
                </div>

                {/* Arrow */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>

                {/* Discord icon */}
                <div style={{
                    width: '4rem', height: '4rem',
                    background: '#5865F2',
                    borderRadius: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(88,101,242,0.4)',
                }}>
                    <svg viewBox="0 0 24 24" fill="white" width="2.2rem" height="2.2rem">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                </div>
            </div>

            {/* Text */}
            <div style={{
                textAlign: 'center', maxWidth: '26rem',
                animation: 'oe-invite-in 0.4s 0.1s ease-out both',
            }}>
                <h2 style={{
                    color: '#fff', margin: '0 0 0.75rem',
                    fontSize: '1.5rem', fontWeight: 700, fontFamily: 'inherit',
                }}>
                    Add OpenEmbedded to Your Server
                </h2>
                <p style={{ color: '#b9bbbe', margin: 0, fontSize: '0.925rem', lineHeight: 1.6 }}>
                    To send messages and use slash commands, the bot needs to
                    be in your Discord server with <strong style={{ color: '#fff' }}>Administrator</strong> permissions.
                </p>
            </div>

            {/* Permission badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.25rem',
                animation: 'oe-invite-in 0.4s 0.2s ease-out both',
            }}>
                <div style={{
                    width: '2.25rem', height: '2.25rem',
                    background: 'rgba(88,101,242,0.15)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1.1rem" height="1.1rem">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <div>
                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                        Administrator
                    </div>
                    <div style={{ color: '#72767d', fontSize: '0.775rem' }}>
                        Required to manage channels &amp; send messages
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '22rem',
                animation: 'oe-invite-in 0.4s 0.3s ease-out both',
            }}>
                <button
                    onClick={handleAddToServer}
                    disabled={adding}
                    style={{
                        width: '100%',
                        padding: '0.875rem 1.5rem',
                        background: adding ? 'rgba(88,101,242,0.5)' : '#5865F2',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.6rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        cursor: adding ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                        transition: 'background 0.15s, transform 0.1s',
                    }}
                    onMouseEnter={e => { if (!adding) (e.currentTarget as HTMLButtonElement).style.background = '#4752c4'; }}
                    onMouseLeave={e => { if (!adding) (e.currentTarget as HTMLButtonElement).style.background = '#5865F2'; }}
                >
                    {adding ? (
                        <>
                            <div style={{
                                width: '1rem', height: '1rem',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid #fff',
                                borderRadius: '50%',
                                animation: 'oe-dc-spin 0.8s linear infinite',
                            }} />
                            Redirecting to Discord…
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="1.1rem" height="1.1rem">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.030zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Add to Server
                        </>
                    )}
                </button>

                <button
                    onClick={onSkip}
                    style={{
                        background: 'none', border: 'none',
                        color: '#72767d', cursor: 'pointer',
                        fontSize: '0.85rem', padding: '0.25rem 0.5rem',
                        fontFamily: 'inherit',
                        textDecoration: 'underline',
                    }}
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}

// ── Discord connected success screen ──────────────────────────────────────────
function DiscordConnectedScreen({ displayName }: { displayName: string }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#202226',
            gap: '1.75rem',
        }}>
            <style>{SHARED_STYLES}</style>

            <div style={{
                width: '5.5rem', height: '5.5rem',
                background: 'linear-gradient(135deg,#5865F2,#4752c4)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'oe-connected-pop 0.45s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
                boxShadow: '0 0 40px rgba(88,101,242,0.4)',
            }}>
                <svg width="2.2rem" height="2.2rem" viewBox="0 0 24 24" fill="none"
                     stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>

            <div style={{ textAlign: 'center', animation: 'oe-connected-fade 0.4s 0.2s ease-out both' }}>
                <h2 style={{
                    color: '#fff', margin: '0 0 0.5rem',
                    fontSize: '1.4rem', fontWeight: 700, fontFamily: 'inherit',
                }}>
                    Discord Connected!
                </h2>
                <p style={{ color: '#b9bbbe', margin: 0, fontSize: '0.95rem' }}>
                    Welcome back, <strong style={{ color: '#fff' }}>{displayName}</strong>
                </p>
            </div>

            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: '#72767d', fontSize: '0.8rem',
                animation: 'oe-connected-fade 0.4s 0.35s ease-out both',
            }}>
                <div style={{
                    width: '0.55rem', height: '0.55rem',
                    border: '2px solid rgba(88,101,242,0.3)',
                    borderTop: '2px solid #5865F2',
                    borderRadius: '50%',
                    animation: 'oe-spin 0.8s linear infinite',
                }} />
                Loading your workspace…
            </div>
        </div>
    );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AuthGate() {
    const { user, isAuthenticated, isLoading } = useAuth();
    useDiscordPresence(user);

    // ?invite_bot=1 — show bot invite step (set after Discord user OAuth)
    const [inviteBot, setInviteBot] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const yes = params.get('invite_bot') === '1';
        if (yes) window.history.replaceState({}, '', window.location.pathname);
        return yes;
    });

    // ?discord_connected=1 — show brief success animation after bot invite
    const [discordJustConnected, setDiscordJustConnected] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const yes = params.get('discord_connected') === '1';
        if (yes) window.history.replaceState({}, '', window.location.pathname);
        return yes;
    });

    // Auto-dismiss success screen after 1.8s
    useEffect(() => {
        if (!discordJustConnected || isLoading) return;
        if (!isAuthenticated) { setDiscordJustConnected(false); return; }
        const t = setTimeout(() => setDiscordJustConnected(false), 1800);
        return () => clearTimeout(t);
    }, [discordJustConnected, isAuthenticated, isLoading]);

    if (isLoading) return <LoadingSpinner />;

    if (!isAuthenticated) return <SignIn />;

    // Show bot-invite screen (user already logged in, needs to invite bot)
    if (inviteBot) {
        return (
            <BotInviteScreen
                onSkip={() => {
                    setInviteBot(false);
                    setDiscordJustConnected(true);
                }}
            />
        );
    }

    // Show brief "Discord Connected!" animation
    if (discordJustConnected) {
        return (
            <DiscordConnectedScreen
                displayName={user?.username ?? user?.email ?? 'there'}
            />
        );
    }

    // Main app
    return (
        <Provider store={store}>
            <ButtonActionsProvider>
                <ResponseBuilderProvider>
                    <App />
                </ResponseBuilderProvider>
            </ButtonActionsProvider>
        </Provider>
    );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function Root() {
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/terms')   return <TermsPage />;
    if (path === '/privacy') return <PrivacyPage />;
    return (
        <ToastProvider>
            <AuthGate />
        </ToastProvider>
    );
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
