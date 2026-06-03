import { useEffect, useState } from 'react';

export interface AuthUser {
    id: string;
    email?: string | null;
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
        window.location.href = '/api/logout';
    };

    return { user, isLoading, isAuthenticated: !!user, logout };
}
