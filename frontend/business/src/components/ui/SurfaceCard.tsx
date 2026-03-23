import { ReactNode } from 'react';

interface SurfaceCardProps {
    children: ReactNode;
    className?: string;
}

export default function SurfaceCard({ children, className }: SurfaceCardProps) {
    return <section className={`surface-card ${className || ''}`.trim()}>{children}</section>;
}
