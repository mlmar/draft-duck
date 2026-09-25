import { AppFooter } from '@/components/app-chrome';
import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

// Page then footer. Quiz hides the site links so the funnel has one exit.
export function AppFrame({ children }: { children: ReactNode }) {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const isQuiz = pathname === '/onboard';

    return (
        <div className='flex min-h-dvh flex-col'>
            <div className='flex flex-1 flex-col'>{children}</div>
            <AppFooter hideLinks={isQuiz} />
        </div>
    );
}
