import { AppHeader } from '@/components/app-chrome';
import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

// Header wraps every page. Quiz hides the site links so the funnel has one exit.
export function AppFrame({ children }: { children: ReactNode }) {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const isQuiz = pathname === '/onboard';

    return (
        <div className='flex min-h-dvh flex-col'>
            <AppHeader hideLinks={isQuiz} />
            {children}
        </div>
    );
}
