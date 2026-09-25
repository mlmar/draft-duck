import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { boardSearch } from '@/lib/quiz';
import { Link } from '@tanstack/react-router';

const SITE_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

type AppFooterProps = {
    hideLinks: boolean;
};

const linkClass = 'flex min-h-11 items-center text-muted-foreground hover:text-foreground';

// In-flow wordmark plus site links. Quiz hides the links so the funnel has one exit.
export function AppFooter({ hideLinks }: AppFooterProps) {
    const { hydrated, profile } = useHydratedProfile();
    const showBoard = hydrated && profile !== null;

    return (
        <footer className='mt-auto border-t border-border bg-background pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
            <div className='mx-auto flex max-w-lg flex-wrap items-center gap-x-5 gap-y-1 px-4 md:max-w-2xl'>
                <Link
                    to='/'
                    className='flex min-h-11 items-center font-semibold text-foreground'
                    title='get your ducks in a row'
                >
                    draft duck
                </Link>
                {hideLinks ? null : (
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
                        {showBoard ? (
                            <Link
                                to='/draft'
                                search={boardSearch()}
                                className={linkClass}
                                activeProps={{ className: 'font-medium text-foreground' }}
                            >
                                Board
                            </Link>
                        ) : null}
                    </nav>
                )}
            </div>
        </footer>
    );
}
