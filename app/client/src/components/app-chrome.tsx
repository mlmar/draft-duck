import { Button } from '@/components/ui/button';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { useMediaQuery } from '@/hooks/use-media-query';
import { boardSearch } from '@/lib/quiz';
import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';

const SITE_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

type AppHeaderProps = {
    hideLinks: boolean;
};

type SiteNavLinksProps = {
    showBoard: boolean;
    compact: boolean;
    onNavigate?: () => void;
};

function SiteNavLinks({ showBoard, compact, onNavigate }: SiteNavLinksProps) {
    const linkClass = compact
        ? 'flex min-h-11 items-center text-muted-foreground hover:text-foreground'
        : 'text-muted-foreground hover:text-foreground';

    return (
        <>
            {SITE_LINKS.map((link) => (
                <Link
                    key={link.to}
                    to={link.to}
                    className={linkClass}
                    activeProps={{ className: 'font-medium text-foreground' }}
                    onClick={onNavigate}
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
                    onClick={onNavigate}
                >
                    Board
                </Link>
            ) : null}
        </>
    );
}

// Sticky wordmark plus site links. Quiz hides the links so the funnel has one exit.
// Phone uses a Menu panel so the h-12 row stays one line and --app-header stays aligned.
export function AppHeader({ hideLinks }: AppHeaderProps) {
    const { hydrated, profile } = useHydratedProfile();
    const showBoard = hydrated && profile !== null;
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [menuOpen, setMenuOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    const menuId = useId();

    // Desktop shows the inline links. Close so a resize cannot leave the panel open.
    useEffect(() => {
        if (isDesktop) setMenuOpen(false);
    }, [isDesktop]);

    useEffect(() => {
        if (!menuOpen) return;

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setMenuOpen(false);
        }

        function onPointerDown(event: PointerEvent) {
            const target = event.target;
            if (target instanceof Node && headerRef.current?.contains(target)) return;
            setMenuOpen(false);
        }

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onPointerDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [menuOpen]);

    return (
        <header
            ref={headerRef}
            className='relative sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm'
        >
            <div className='mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4'>
                <Link to='/' className='font-semibold text-foreground' title='get your ducks in a row'>
                    draft duck
                </Link>
                {hideLinks ? null : (
                    <>
                        <nav className='hidden items-center gap-5 md:flex'>
                            <SiteNavLinks showBoard={showBoard} compact={false} />
                        </nav>
                        <Button
                            type='button'
                            variant='ghost'
                            className='md:hidden'
                            aria-label='Menu'
                            aria-expanded={menuOpen}
                            aria-controls={menuId}
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            Menu
                        </Button>
                    </>
                )}
            </div>
            {hideLinks || !menuOpen ? null : (
                <nav
                    id={menuId}
                    className='absolute inset-x-0 top-full z-50 border-b border-border bg-background px-4 py-2 md:hidden'
                >
                    <div className='mx-auto grid max-w-6xl'>
                        <SiteNavLinks showBoard={showBoard} compact onNavigate={() => setMenuOpen(false)} />
                    </div>
                </nav>
            )}
        </header>
    );
}
