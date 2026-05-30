import { useState, FormEvent } from 'react';
import Styles from './SignIn.module.css';

export function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Sign in failed. Please try again.');
                return;
            }

            window.location.reload();
        } catch {
            setError('Unable to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={Styles.page}>
            <form className={Styles.card} onSubmit={handleSubmit} noValidate>
                <div className={Styles.brand}>
                    <span className={Styles.brandDot} />
                    <span className={Styles.brandName}>OpenEmbedded</span>
                </div>

                <h1 className={Styles.title}>Sign in</h1>

                {error && <div className={Styles.error}>{error}</div>}

                <div className={Styles.field}>
                    <label className={Styles.label} htmlFor="email">Email</label>
                    <input
                        id="email"
                        className={Styles.input}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <div className={Styles.field}>
                    <label className={Styles.label} htmlFor="password">Password</label>
                    <input
                        id="password"
                        className={Styles.input}
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <button className={Styles.signInButton} type="submit" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
        </div>
    );
}
