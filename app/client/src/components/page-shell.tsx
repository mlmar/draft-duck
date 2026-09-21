import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type PageShellProps = {
    children: ReactNode;
    className?: string;
    wide?: boolean;
};

// Shared width and vertical padding. Draft is the only wide surface.
export function PageShell({ children, className, wide = false }: PageShellProps) {
    return (
        <main
            className={cn(
                'mx-auto min-h-dvh px-4 py-10',
                wide ? 'max-w-6xl' : 'flex max-w-lg flex-col md:max-w-2xl',
                className
            )}
        >
            {children}
        </main>
    );
}
