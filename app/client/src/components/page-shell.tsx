import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type PageShellProps = {
    children: ReactNode;
    className?: string;
    wide?: boolean;
    // Quiz uses less vertical air than marketing pages.
    inset?: 'default' | 'quiz';
};

// Reading pages stay constrained; workspace pages use the available width.
export function PageShell({ children, className, wide = false, inset = 'default' }: PageShellProps) {
    return (
        <main
            className={cn(
                'mx-auto w-full min-w-0 flex-1 px-4 md:px-8',
                inset === 'quiz' ? 'py-6 md:py-10' : 'py-8 md:py-12',
                wide ? (inset === 'quiz' ? 'max-w-6xl' : 'max-w-[88rem]') : 'flex max-w-3xl flex-col',
                className
            )}
        >
            {children}
        </main>
    );
}
