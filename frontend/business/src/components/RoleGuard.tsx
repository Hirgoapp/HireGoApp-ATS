import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export type Role = 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';

export default function RoleGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: ReactNode }) {
    const role = (useAuthStore((s) => s.user?.role) || '').toLowerCase();
    const ok = allowedRoles.map((r) => r.toLowerCase()).includes(role as Role);

    if (!ok) {
        return <Navigate to="/app" replace />;
    }

    return <>{children}</>;
}
