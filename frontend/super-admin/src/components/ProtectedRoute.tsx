import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Waits for zustand-persist to rehydrate from localStorage before checking auth.
 * Otherwise the first paint sees isAuthenticated: false and incorrectly redirects to /login.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const location = useLocation();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [hydrated, setHydrated] = useState(() => {
        try {
            return useAuthStore.persist.hasHydrated();
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const finish = () => setHydrated(true);
        const unsub = useAuthStore.persist.onFinishHydration(finish);
        if (useAuthStore.persist.hasHydrated()) {
            finish();
        }
        return unsub;
    }, []);

    if (!hydrated) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
                Loading session…
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}
