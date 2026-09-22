import { Link } from '@tanstack/react-router';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';

const LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

const BOARD_SEARCH = { assist: '1', view: 'simple' } as const;

// Quiet footer links. Board appears after a profile hydrates so first-run chrome stays quiz-first.
export function SiteNav() {
    const { hydrated, profile } = useHydratedProfile();
    const showBoard = hydrated && profile !== null;

    return (
        <nav className='mt-10 flex flex-wrap gap-x-5 gap-y-2'>
            {LINKS.map((link) => (
                <Link
                    key={link.to}
                    to={link.to}
                    className='text-muted-foreground hover:text-foreground'
                    activeProps={{ className: 'text-foreground' }}
                >
                    {link.label}
                </Link>
            ))}
            {showBoard ? (
                <Link
                    to='/draft'
                    search={BOARD_SEARCH}
                    className='text-muted-foreground hover:text-foreground'
                    activeProps={{ className: 'text-foreground' }}
                >
                    Board
                </Link>
            ) : null}
        </nav>
    );
}
