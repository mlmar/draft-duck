import { AppHeader, MobileTabBar } from '@/components/app-chrome';
import { useRouterState } from '@tanstack/react-router';
import type { CSSProperties, ReactNode } from 'react';

// Header and tabs wrap every page. Quiz zeros the tab offset so Continue is not covered.
export function AppFrame({ children }: { children: ReactNode }) {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const isQuiz = pathname === '/onboard';

    return (
        <div
            className='flex min-h-dvh flex-col'
            style={isQuiz ? ({ '--app-tabs': '0px' } as CSSProperties) : undefined}
        >
            <AppHeader hideLinks={isQuiz} />
            {children}
            {isQuiz ? null : <MobileTabBar />}
        </div>
    );
}
