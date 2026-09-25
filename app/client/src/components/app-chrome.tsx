import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { boardSearch } from '@/lib/quiz';
import { Link } from '@tanstack/react-router';

const DESKTOP_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

type AppHeaderProps = {
    hideLinks: boolean;
};

// Sticky wordmark. Desktop also gets site links. Quiz hides those so the funnel has one exit.
export function AppHeader({ hideLinks }: AppHeaderProps) {
    const { hydrated, profile } = useHydratedProfile();
    const showBoard = hydrated && profile !== null;

    return (
        <header className='sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm'>
            <div className='mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4'>
                <Link to='/' className='font-semibold text-foreground' title='get your ducks in a row'>
                    draft duck
                </Link>
                {hideLinks ? null : (
                    <nav className='hidden items-center gap-5 md:flex'>
                        {DESKTOP_LINKS.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className='text-muted-foreground hover:text-foreground'
                                activeProps={{ className: 'font-medium text-foreground' }}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {showBoard && profile ? (
                            <Link
                                to='/draft'
                                search={boardSearch()}
                                className='text-muted-foreground hover:text-foreground'
                                activeProps={{ className: 'font-medium text-foreground' }}
                            >
                                Board
                            </Link>
                        ) : null}
                    </nav>
                )}
            </div>
        </header>
    );
}

type TabLinkProps = {
    to: '/' | '/how-it-works' | '/draft';
    search?: { assist: '1' };
    label: string;
};

function TabLink({ to, search, label }: TabLinkProps) {
    return (
        <Link
            to={to}
            search={search}
            className='flex min-h-11 flex-1 items-center justify-center px-2 text-muted-foreground hover:text-foreground'
            activeProps={{ className: 'font-medium text-foreground' }}
        >
            {label}
        </Link>
    );
}

// Phone thumb bar. About stays on Home and Scoring, not a fourth tab.
export function MobileTabBar() {
    const { hydrated, profile } = useHydratedProfile();
    const showBoard = hydrated && profile !== null;

    return (
        <nav
            className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] md:hidden'
            aria-label='Primary'
        >
            <div className='flex'>
                <TabLink to='/' label='Home' />
                {showBoard && profile ? <TabLink to='/draft' search={boardSearch()} label='Board' /> : null}
                <TabLink to='/how-it-works' label='Scoring' />
            </div>
        </nav>
    );
}
