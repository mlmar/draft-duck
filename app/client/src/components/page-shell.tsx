import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type PageShellProps = {
    children: ReactNode;
    className?: string;
    wide?: boolean;
    // Quiz sits under the wordmark with less air than marketing pages.
    inset?: 'default' | 'quiz';
};

// Default is the reading column. wide is the board, full viewport. Header is sticky in flow. Tab bar is fixed, so bottom padding uses --app-tabs.
export function PageShell({ children, className, wide = false, inset = 'default' }: PageShellProps) {
    return (
        <main
            className={cn(
                'mx-auto px-4',
                inset === 'quiz' ? 'py-4' : 'py-6 md:py-8',
                // w-full so mx-auto cannot shrink-wrap a compact board and slide the toolbar.
                wide ? 'w-full max-w-none' : 'flex max-w-lg flex-col md:max-w-2xl',
                'min-h-[calc(100dvh-var(--app-header))] pb-[calc(1.5rem+var(--app-tabs))]',
                className
            )}
        >
            {children}
        </main>
    );
}
