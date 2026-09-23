import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type PageShellProps = {
    children: ReactNode;
    className?: string;
    wide?: boolean;
    // Quiz sits under the wordmark with less air than marketing pages.
    inset?: 'default' | 'quiz';
};

// Shared width. Header is sticky in flow. Tab bar is fixed, so bottom padding uses --app-tabs.
export function PageShell({ children, className, wide = false, inset = 'default' }: PageShellProps) {
    return (
        <main
            className={cn(
                'mx-auto px-4',
                inset === 'quiz' ? 'py-4' : 'py-6 md:py-8',
                wide ? 'max-w-6xl' : 'flex max-w-lg flex-col md:max-w-2xl',
                'min-h-[calc(100dvh-var(--app-header))] pb-[calc(1.5rem+var(--app-tabs))]',
                className
            )}
        >
            {children}
        </main>
    );
}
