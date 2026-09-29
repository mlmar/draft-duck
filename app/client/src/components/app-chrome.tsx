import { Link } from '@tanstack/react-router';

const SITE_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

const linkClass = 'flex min-h-11 items-center text-muted-foreground hover:text-foreground';

// Only shown on the draft board.
export function AppFooter() {
    return (
        <footer className='mt-auto border-t border-border bg-background pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
            <div className='mx-auto flex max-w-lg flex-wrap items-center gap-x-5 gap-y-1 px-4 md:max-w-2xl'>
                <nav className='flex flex-wrap items-center gap-x-5'>
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
