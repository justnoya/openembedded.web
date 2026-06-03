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
            setError('Please fill in all fields.');
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
                setError(data.error || 'Login failed. Please try again.');
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
            {/* Full-page illustrated nature background */}
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

                {/* Sky */}
                <rect width="1440" height="900" fill="url(#skyGrad)" />

                {/* Distant mountains — grey-blue */}
                <path d="M440,480 Q520,310 640,370 Q720,400 820,280 Q910,180 1010,300 Q1080,370 1160,240 Q1240,130 1340,260 Q1400,320 1440,290 L1440,620 L440,620Z" fill="#8ab8cc" opacity="0.7" />

                {/* Pink/rose mountain — right side */}
                <path d="M940,500 Q1020,310 1110,340 Q1180,280 1250,350 Q1320,300 1380,400 Q1420,450 1440,430 L1440,680 L940,680Z" fill="#c8a8c0" />

                {/* Rocky/stone wall foreground horizontal band */}
                <rect x="440" y="700" width="1000" height="80" fill="#b898a8" />
                <rect x="440" y="680" width="1000" height="24" fill="#c8a8b8" />

                {/* Arch/pillars on stone wall */}
                {[600, 740, 880, 1020, 1160, 1300].map(x => (
                    <rect key={x} x={x} y={660} width={18} height={60} fill="#a88898" />
                ))}

                {/* Mid teal mountains */}
                <path d="M440,560 Q580,410 700,470 Q800,510 900,400 Q980,330 1100,460 Q1200,520 1320,450 Q1380,420 1440,460 L1440,720 L440,720Z" fill="#5aa090" />

                {/* Dark trees silhouette left */}
                <path d="M440,630 Q470,570 500,600 Q520,580 545,610 Q565,590 590,620 Q615,598 640,628 Q660,605 685,632 Q710,610 735,638 Q755,615 780,642 Q800,620 820,648 L820,760 L440,760Z" fill="#2d6858" />

                {/* Lighter green shrubs foreground */}
                <path d="M440,700 Q480,670 520,690 Q560,665 600,688 Q640,668 680,690 Q720,672 760,692 Q800,675 830,695 L830,780 L440,780Z" fill="#3a7868" />

                {/* Teal water / flat ground */}
                <path d="M440,740 Q700,710 1000,725 Q1200,732 1440,715 L1440,900 L440,900Z" fill="url(#waterGrad)" />

                {/* Small mushroom details */}
                <ellipse cx="870" cy="742" rx="12" ry="6" fill="#e8a0b0" />
                <rect x="867" y="732" width="6" height="14" rx="3" fill="#f0b8c0" />
                <ellipse cx="910" cy="748" rx="9" ry="5" fill="#e8b0c0" />
                <rect x="907" y="739" width="5" height="12" rx="2" fill="#f0c0c8" />
            </svg>

            {/* Dark organic blob — left side overlay */}
            <svg className={Styles.darkBlob} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M0,0 L840,0 C800,80 860,160 780,240 C720,300 800,380 740,460 C680,540 760,620 700,720 C660,790 720,860 640,900 L0,900 Z"
                    fill="#1e1f2e"
                />
            </svg>

            {/* Stars scattered on dark area */}
            <div className={Styles.stars} />

            {/* Logo top-left */}
            <div className={Styles.logo}>
                <div className={Styles.logoWrap}>
                    <img src="/logo.png" className={Styles.logoImg} alt="OpenEmbedded" draggable={false} />
                </div>
            </div>

            {/* Login card */}
            <form className={Styles.card} onSubmit={handleSubmit} noValidate>
                <h1 className={Styles.title}>OpenEmbedded</h1>
                <p className={Styles.subtitle}>We're so excited to see you again!</p>

                {error && <div className={Styles.error}>{error}</div>}

                <div className={Styles.field}>
                    <label className={Styles.label} htmlFor="email">EMAIL</label>
                    <input
                        id="email"
                        className={Styles.input}
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <div className={Styles.field}>
                    <label className={Styles.label} htmlFor="password">PASSWORD</label>
                    <input
                        id="password"
                        className={Styles.input}
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <button className={Styles.loginBtn} type="submit" disabled={loading}>
                    {loading ? 'Logging in…' : 'Login'}
                </button>

                <div className={Styles.links}>
                    <a href="#" className={Styles.link} onClick={e => e.preventDefault()}>Forgot your password?</a>
                    <a href="#" className={Styles.link} onClick={e => e.preventDefault()}>Register an account</a>
                </div>
            </form>
        </div>
    );
}
