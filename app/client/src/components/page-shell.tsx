import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type PageShellProps = {
    children: ReactNode;
    className?: string;
    wide?: boolean;
    // Quiz uses less vertical air than marketing pages.
    inset?: 'default' | 'quiz';
};

// Default is the reading column. wide unlocks full width from md up. Mobile stays max-w-lg.
export function PageShell({ children, className, wide = false, inset = 'default' }: PageShellProps) {
    return (
        <main
            className={cn(
                'mx-auto w-full flex-1 px-4',
                inset === 'quiz' ? 'py-4' : 'py-6 md:py-8',
                wide ? 'max-w-lg md:max-w-none' : 'flex max-w-lg flex-col md:max-w-2xl',
                className
            )}
        >
            {children}
        </main>
    );
}
