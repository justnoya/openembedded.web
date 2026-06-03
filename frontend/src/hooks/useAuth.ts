import { useEffect, useState } from 'react';

export interface AuthUser {
    id: string;
    email?: string | null;
    provider?: 'password' | 'discord';
    username?: string | null;
    avatar?: string | null;
    discriminator?: string | null;
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/user', { credentials: 'include' })
            .then(r => {
                if (!r.ok) return null;
                return r.json();
            })
            .then(data => {
                setUser(data);
                setIsLoading(false);
            })
            .catch(() => {
                setUser(null);
                setIsLoading(false);
            });
    }, []);

    const logout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => { window.location.href = '/'; });
    };

    return { user, isLoading, isAuthenticated: !!user, logout };
}
