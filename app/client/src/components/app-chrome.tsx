import { Link } from '@tanstack/react-router';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';

const SITE_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

const linkClass = 'flex min-h-11 items-center text-muted-foreground hover:text-foreground';

export function AppHeader({ focused = false }: { focused?: boolean }) {
    const { profile } = useHydratedProfile();
    return (
        <header className='border-b border-border bg-card'>
            <div className='mx-auto flex min-h-18 max-w-[88rem] flex-wrap items-center justify-between gap-x-5 px-4 py-2 md:px-8'>
                <Link
                    to='/'
                    className='flex min-h-11 items-center gap-2 font-semibold tracking-tight text-foreground'
                    aria-label='Draft Duck home'
                >
                    <span className='text-xl'>draft duck</span>
                </Link>
                {!focused ? (
                    <nav aria-label='Main navigation' className='flex items-center gap-4 text-sm md:gap-6'>
                        <Link to='/' className={linkClass} activeProps={{ className: 'font-medium text-primary' }}>
                            Home
                        </Link>
                        {profile ? (
                            <Link
                                to='/draft'
                                className={linkClass}
                                activeProps={{ className: 'font-medium text-primary' }}
                            >
                                Board
                            </Link>
                        ) : null}
                        <Link
                            to='/how-it-works'
                            className={linkClass}
                            activeProps={{ className: 'font-medium text-primary' }}
                        >
                            Scoring
                        </Link>
                    </nav>
                ) : (
                    <span className='text-sm text-muted-foreground'>Find your build</span>
                )}
            </div>
        </header>
    );
}

// Public pages share quiet supporting links.
export function AppFooter() {
    return (
        <footer className='mt-auto border-t border-border bg-background pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
            <div className='mx-auto flex max-w-[88rem] flex-wrap items-center gap-x-5 gap-y-1 px-4 md:px-8'>
                <nav aria-label='Footer navigation' className='flex flex-wrap items-center gap-x-5'>
                    {SITE_LINKS.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={linkClass}
                            activeProps={{ className: 'font-medium text-foreground' }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    );
}
