import { StrictMode } from 'react';
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

function AuthGate() {
    const { user, isAuthenticated, isLoading } = useAuth();
    useDiscordPresence(user);

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#202226',
            }}>
                <div style={{ position: 'relative', width: '6rem', height: '6rem' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '8px solid rgba(88,101,242,0.2)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '8px solid transparent',
                        borderTopColor: '#5865F2',
                        borderRightColor: '#5865F2',
                        animation: 'oe-spin 0.9s linear infinite',
                    }} />
                </div>
                <style>{`
                    @keyframes oe-spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) return <SignIn />;

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
