import { AppFooter, AppHeader } from '@/components/app-chrome';
import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

// Shared navigation surrounds pages; the quiz keeps a single home exit.
export function AppFrame({ children }: { children: ReactNode }) {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const focused = pathname === '/onboard';

    return (
        <div className='flex min-h-dvh flex-col'>
            <AppHeader focused={focused} />
            <div className='flex flex-1 flex-col'>{children}</div>
            {!focused ? <AppFooter /> : null}
        </div>
    );
}
