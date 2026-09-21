import { Link } from '@tanstack/react-router';

const LINKS = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'Scoring' },
    { to: '/about', label: 'About' }
] as const;

// Quiet footer links for prerendered content pages. Quiz and draft keep their own chrome.
export function SiteNav() {
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
        </nav>
    );
}
