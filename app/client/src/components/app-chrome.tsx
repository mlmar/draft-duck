import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { boardSearch } from '@/lib/quiz';
import { Link } from '@tanstack/react-router';

const SITE_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

type AppHeaderProps = {
    hideLinks: boolean;
};

// Sticky wordmark plus site links. Quiz hides the links so the funnel has one exit.
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
                    <nav className='flex items-center gap-3 md:gap-5'>
                        {SITE_LINKS.map((link) => (
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
