import { useRef, useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Styles from './UserProfile.module.css';

export function UserProfile() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    if (!user) return null;

    const isDiscord = user.provider === 'discord';
    const avatarUrl = isDiscord && user.avatar && user.id
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
        : null;
    const displayName = isDiscord
        ? (user.username || user.email || 'User')
        : (user.email || 'User');
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <div className={Styles.wrapper} ref={ref}>
            <button className={Styles.chip} onClick={() => setOpen(v => !v)} aria-label="Profile menu">
                {avatarUrl
                    ? <img className={Styles.avatar} src={avatarUrl} alt={displayName} />
                    : <div className={Styles.avatarInitial}>{initial}</div>
                }
                <span className={Styles.name}>{displayName}</span>
                <span className={Styles.caret}>{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className={Styles.dropdown}>
                    <div className={Styles.dropdownHeader}>
                        <span className={Styles.dropdownName}>{displayName}</span>
                        {isDiscord && user.discriminator && user.discriminator !== '0' && (
                            <span className={Styles.dropdownSubtext}>#{user.discriminator}</span>
                        )}
                        {isDiscord && (
                            <span className={Styles.dropdownSubtext} style={{ color: '#5865f2', marginTop: 2 }}>Discord account</span>
                        )}
                        {!isDiscord && user.email && (
                            <span className={Styles.dropdownSubtext}>{user.email}</span>
                        )}
                    </div>
                    <button className={Styles.dropdownItem} onClick={() => { setOpen(false); logout(); }}>
                        <span className={Styles.dropdownItemIcon}>🚪</span>
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
