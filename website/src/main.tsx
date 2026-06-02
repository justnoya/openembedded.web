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
import { SignIn } from './SignIn';

function AuthGate() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#292a2c',
            }}>
                <div style={{ position: 'relative', width: '6rem', height: '6rem' }}>
                    {/* Static faint track ring */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '6px solid rgba(87,88,230,0.12)',
                    }} />
                    {/* Spinning conic-gradient arc ring */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, #5758e6 0%, #8b8cf8 55%, transparent 72%)',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), white calc(100% - 6px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), white calc(100% - 6px))',
                        animation: 'oe-spin 0.9s linear infinite',
                        filter: 'drop-shadow(0 0 6px rgba(87,88,230,0.9))',
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

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
)
